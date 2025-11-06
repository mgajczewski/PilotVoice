import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import type { SurveyDto, CompetitionDto, SurveyResponseDto } from "@/types";
import type { User } from "@supabase/supabase-js";
import type { GdprCheckResult } from "@/lib/services/anonymizationService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingInput } from "./RatingInput";
import { FeedbackInput } from "./FeedbackInput";
import { SaveStatusIndicator, type SaveStatus } from "./SaveStatusIndicator";
import { GdprWarning } from "./GdprWarning";
import { useSurveyAutoSave } from "../hooks/useSurveyAutoSave";

interface SurveyFillFormProps {
  initialSurvey: SurveyDto;
  initialCompetition: CompetitionDto;
  initialResponse: SurveyResponseDto | null;
  user?: User;
}

export function SurveyFillForm({ initialSurvey, initialCompetition, initialResponse }: SurveyFillFormProps) {
  // State for the survey response
  const [response, setResponse] = useState<SurveyResponseDto | null>(initialResponse);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isInitializing, setIsInitializing] = useState(!initialResponse);
  const [initError, setInitError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [isSavingManually, setIsSavingManually] = useState(false);
  const [manualSaveError, setManualSaveError] = useState<string | null>(null);

  // GDPR checking state
  const [gdprCheckResult, setGdprCheckResult] = useState<GdprCheckResult | null>(null);
  const [isCheckingGdpr, setIsCheckingGdpr] = useState(false);
  const [gdprCheckError, setGdprCheckError] = useState<string | null>(null);

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
      } catch {
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

    // Step 1: If there's feedback, check for GDPR compliance
    if (response.open_feedback && response.open_feedback.trim().length > 0 && !gdprCheckResult) {
      setIsCheckingGdpr(true);
      setGdprCheckError(null);

      try {
        const res = await fetch("/api/survey-responses/check-gdpr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: response.open_feedback }),
        });

        if (!res.ok) {
          throw new Error("Failed to check for personal data");
        }

        const result: GdprCheckResult = await res.json();
        setGdprCheckResult(result);

        // If no personal data detected, proceed with submission
        if (!result.containsPersonalData) {
          await submitSurvey();
        }
        // Otherwise, show the GDPR warning and wait for user action
      } catch {
        setGdprCheckError("Could not verify feedback for personal data. Please try again.");
      } finally {
        setIsCheckingGdpr(false);
      }
      return;
    }

    // Step 2: If GDPR check already passed or no feedback, proceed with submission
    await submitSurvey();
  };

  // Handler for accepting anonymized version
  const handleAcceptAnonymized = async () => {
    if (!gdprCheckResult || !response) return;

    // Update response with anonymized text
    const anonymizedText = gdprCheckResult.anonymizedText || gdprCheckResult.originalText;
    setResponse({
      ...response,
      open_feedback: anonymizedText,
    });

    // Clear GDPR result to allow submission
    setGdprCheckResult(null);

    // Proceed with submission
    await submitSurvey();
  };

  // Handler for editing response after GDPR warning
  const handleEditResponse = () => {
    setGdprCheckResult(null);
    setGdprCheckError(null);
    // User can now edit their response
  };

  // Handler for manual save
  const handleManualSave = async () => {
    if (!response) return;

    setIsSavingManually(true);
    setManualSaveError(null);

    try {
      const res = await fetch(`/api/survey-responses/${response.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overall_rating: response.overall_rating,
          open_feedback: response.open_feedback,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save survey");
      }

      // Update save status to success
      setSaveStatus("saved");

      // Reset status to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch {
      setManualSaveError("Could not save survey. Check your connection and try again.");
      setSaveStatus("error");
    } finally {
      setIsSavingManually(false);
    }
  };

  // Actual survey submission logic
  const submitSurvey = async () => {
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
    } catch {
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

          {/* GDPR Warning */}
          {gdprCheckResult && (
            <GdprWarning result={gdprCheckResult} onAccept={handleAcceptAnonymized} onEdit={handleEditResponse} />
          )}

          {/* GDPR Check Error */}
          {gdprCheckError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">{gdprCheckError}</p>
            </div>
          )}

          {/* Manual Save Error */}
          {manualSaveError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive">{manualSaveError}</p>
            </div>
          )}

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
        <div className="flex gap-2">
          <Button
            onClick={handleManualSave}
            disabled={isSavingManually || isCompleting || isCheckingGdpr}
            size="lg"
            variant="outline"
          >
            {isSavingManually ? "Saving..." : "Save"}
          </Button>
          <Button onClick={handleComplete} disabled={!isFormValid || isCompleting || isCheckingGdpr} size="lg">
            {isCheckingGdpr ? "Checking for personal data..." : isCompleting ? "Completing..." : "Complete Survey"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
