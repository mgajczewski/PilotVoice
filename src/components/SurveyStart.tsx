import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import type { SurveyResponseDto } from "../types";

interface SurveyStartProps {
  surveyId: number;
  surveySlug: string;
}

export function SurveyStart({ surveyId, surveySlug }: SurveyStartProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
  const [surveyResponse, setSurveyResponse] = useState<SurveyResponseDto | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        } else {
          // Other error
          setError("Failed to load data. Please try refreshing the page.");
        }
      } catch (err) {
        console.error("Error fetching user and response:", err);
        setError("An error occurred while loading data.");
      }
    };

    fetchUserAndResponse();
  }, [surveyId]);

  // Handle button click
  const handleStartSurvey = async () => {
    // User not logged in - redirect to login
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/surveys/${surveySlug}`;
      return;
    }

    // User already started survey - redirect to form
    if (surveyResponse) {
      window.location.href = `/surveys/${surveySlug}/fill`;
      return;
    }

    // Create new survey response
    setIsLoading(true);
    setError(null);

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
        window.location.href = `/surveys/${surveySlug}/fill`;
      } else if (response.status === 401) {
        setError("Session expired. Please log in again.");
        setIsAuthenticated(false);
      } else if (response.status === 409) {
        // User already has a response (race condition)
        setError("You have already started this survey.");
        // Fetch the existing response
        const existingResponse = await fetch(`/api/surveys/${surveyId}/responses/me`);
        if (existingResponse.ok) {
          const existingData = await existingResponse.json();
          setSurveyResponse(existingData);
        }
      } else {
        setError("An error occurred while starting the survey. Please try again.");
      }
    } catch (err) {
      console.error("Error starting survey:", err);
      setError("An error occurred while starting the survey. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isAuthenticated === undefined || (isAuthenticated && surveyResponse === undefined)) {
    return (
      <div className="flex justify-center">
        <Button disabled className="w-full sm:w-auto">
          Loading...
        </Button>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
        {isAuthenticated && (
          <div className="flex justify-center">
            <Button onClick={handleStartSurvey} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? "Loading..." : surveyResponse ? "Continue Survey" : "Start Survey"}
            </Button>
          </div>
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
    <div className="flex justify-center">
      <Button onClick={handleStartSurvey} disabled={isLoading} size="lg" className="w-full sm:w-auto">
        {isLoading ? "Loading..." : buttonText}
      </Button>
    </div>
  );
}
