import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import type { SurveyResponseDto } from "../types";
import log from "@/lib/logger";

interface SurveyStartProps {
  surveyId: number;
  surveySlug: string;
}

const getSurveyFillUrl = (surveySlug: string) => `/surveys/${surveySlug}/fill`;

export function SurveyStart({ surveyId, surveySlug }: SurveyStartProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
  const [surveyResponse, setSurveyResponse] = useState<SurveyResponseDto | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"fatal" | "recoverable" | null>(null);

  // Fetch user session and survey response
  useEffect(() => {
    const fetchUserAndResponse = async () => {
      try {
        // Check authentication and existing response by calling the API
        const response = await fetch(`/api/surveys/${surveyId}/responses/me`);

        if (response.ok) {
          const data = await response.json();
          // User is authenticated
          setIsAuthenticated(true);
          setSurveyResponse(data);
        } else if (response.status === 401) {
          // User is not authenticated
          setIsAuthenticated(false);
          setSurveyResponse(null);
        } else if (response.status === 404) {
          // Survey not found
          setError("Survey not found.");
          setErrorType("fatal");
        } else {
          // Other error
          setError("Failed to load data. Please try refreshing the page.");
          setErrorType("recoverable");
        }
      } catch (err) {
        log.error("Error fetching user and response:", err);
        setError("An error occurred while loading data.");
        setErrorType("recoverable");
      }
    };

    fetchUserAndResponse();
  }, [surveyId]);

  // Handle button click
  const handleStartSurvey = async () => {
    // User not logged in - redirect to login
    if (!isAuthenticated) {
      window.location.href = `/login?redirect_to=${getSurveyFillUrl(surveySlug)}`;
      return;
    }

    // User already started survey - redirect to form
    if (surveyResponse) {
      window.location.href = getSurveyFillUrl(surveySlug);
      return;
    }

    // Create new survey response
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const newResponse: SurveyResponseDto = await response.json();
        setSurveyResponse(newResponse);
        // Redirect to form
        window.location.href = getSurveyFillUrl(surveySlug);
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
        setErrorType("recoverable");
        setIsAuthenticated(false);
      } else if (response.status === 409) {
        // User already has a response (race condition)
        setError("You have already started this survey.");
        setErrorType("recoverable");
        // Fetch the existing response
        const existingResponse = await fetch(`/api/surveys/${surveyId}/responses/me`);
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          setSurveyResponse(existingData);
        }
      } else {
        setError("An error occurred while starting the survey. Please try again.");
        setErrorType("recoverable");
      }
    } catch (err) {
      log.error("Error starting survey:", err);
      setError("An error occurred while starting the survey. Please try again.");
      setErrorType("recoverable");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isAuthenticated === undefined || (isAuthenticated && surveyResponse === undefined)) {
    return (
      <div className="flex justify-center" data-testid="survey-start-loading">
        <Button disabled className="w-full sm:w-auto">
          Loading...
        </Button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4" data-testid="survey-start-error">
        <p className="text-sm text-destructive font-medium">{error}</p>
        {errorType === "recoverable" && (
          <p className="text-sm text-destructive/80 mt-2">Please refresh the page to try again.</p>
        )}
      </div>
    );
  }

  // Determine button text and behavior
  let buttonText = "Sign In to Start";
  if (isAuthenticated && surveyResponse) {
    buttonText = "Continue Survey";
  } else if (isAuthenticated && !surveyResponse) {
    buttonText = "Start Survey";
  }

  return (
    <div className="flex justify-center" data-testid="survey-start-action">
      <Button
        onClick={handleStartSurvey}
        disabled={isLoading}
        size="lg"
        className="w-full sm:w-auto"
        data-testid="survey-start-button"
      >
        {isLoading ? "Loading..." : buttonText}
      </Button>
    </div>
  );
}
