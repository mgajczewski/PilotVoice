import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import type { SurveyDto, CompetitionDto, SurveyResponseDto } from "@/types";
import type { User } from "@supabase/supabase-js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingInput } from "./RatingInput";
import { FeedbackInput } from "./FeedbackInput";
import { SaveStatusIndicator, type SaveStatus } from "./SaveStatusIndicator";
import { useSurveyAutoSave } from "../hooks/useSurveyAutoSave";

interface SurveyFillFormProps {
  initialSurvey: SurveyDto;
  initialCompetition: CompetitionDto;
  initialResponse: SurveyResponseDto | null;
  user: User;
}

export function SurveyFillForm({ initialSurvey, initialCompetition, initialResponse, user }: SurveyFillFormProps) {
  // State for the survey response
  const [response, setResponse] = useState<SurveyResponseDto | null>(initialResponse);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isInitializing, setIsInitializing] = useState(!initialResponse);
  const [initError, setInitError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Callback for updating save status
  const handleStatusChange = useCallback((status: SaveStatus) => {
    setSaveStatus(status);
  }, []);

  // Auto-save hook - debounces saves by 5 seconds
  useSurveyAutoSave({
    response,
    onStatusChange: handleStatusChange,
    debounceMs: 5000,
  });

  // Initialize response if it doesn't exist
  useEffect(() => {
    async function initializeResponse() {
      if (initialResponse) {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await fetch(`/api/surveys/${initialSurvey.id}/responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!res.ok) {
          throw new Error("Failed to initialize survey response");
        }

        const newResponse: SurveyResponseDto = await res.json();
        setResponse(newResponse);
        setIsInitializing(false);
      } catch (error) {
        console.error("Error initializing response:", error);
        setInitError("Failed to initialize survey. Please try again.");
        setIsInitializing(false);
      }
    }

    initializeResponse();
  }, [initialSurvey.id, initialResponse]);

  // Handler for rating change
  const handleRatingChange = (rating: number) => {
    if (!response) return;

    setResponse({
      ...response,
      overall_rating: rating,
    });
  };

  // Handler for feedback change
  const handleFeedbackChange = (feedback: string) => {
    if (!response) return;

    setResponse({
      ...response,
      open_feedback: feedback || null,
    });
  };

  // Handler for completing the survey
  const handleComplete = async () => {
    if (!response || !response.overall_rating) return;

    setIsCompleting(true);
    setCompleteError(null);

    try {
      const res = await fetch(`/api/survey-responses/${response.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overall_rating: response.overall_rating,
          open_feedback: response.open_feedback,
          completed_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete survey");
      }

      // Redirect to thank you page
      window.location.href = `/surveys/${initialSurvey.slug}/thanks`;
    } catch (error) {
      console.error("Error completing survey:", error);
      setCompleteError("Could not complete survey. Check your connection and try again.");
      setIsCompleting(false);
    }
  };

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            <p className="text-muted-foreground">Loading survey...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if initialization failed
  if (initError || !response) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="text-destructive text-lg font-semibold">Error</div>
            <p className="text-muted-foreground text-center">{initError || "Failed to load survey"}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format competition dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const competitionDates = `${formatDate(initialCompetition.starts_at)} - ${formatDate(initialCompetition.ends_at)}`;

  // Check if form is valid for completion
  const isFormValid = response.overall_rating !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl md:text-3xl">{initialCompetition.name}</CardTitle>
            <CardDescription className="text-base md:text-lg mt-2">{competitionDates}</CardDescription>
          </div>
          <SaveStatusIndicator status={saveStatus} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-8">
          {/* Competition Info */}
          <div className="text-muted-foreground">
            <p className="flex items-center gap-2">
              <span className="font-medium">Location:</span>
              <span>
                {initialCompetition.city}, {initialCompetition.country_code}
              </span>
            </p>
          </div>

          {/* Rating Input */}
          <RatingInput
            value={response.overall_rating}
            onChange={handleRatingChange}
            label="How would you rate this competition overall?"
            required
          />

          {/* Feedback Input */}
          <FeedbackInput
            value={response.open_feedback}
            onChange={handleFeedbackChange}
            label="Do you have any additional feedback?"
            placeholder="Share your thoughts, suggestions, or concerns..."
          />

          {/* Error message */}
          {completeError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">{completeError}</p>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          <span className="text-destructive">*</span> Required field
        </p>
        <Button onClick={handleComplete} disabled={!isFormValid || isCompleting} size="lg">
          {isCompleting ? "Completing..." : "Complete Survey"}
        </Button>
      </CardFooter>
    </Card>
  );
}
