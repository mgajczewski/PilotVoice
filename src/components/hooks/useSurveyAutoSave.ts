import { useEffect, useRef } from "react";
import type { SurveyResponseDto, UpdateSurveyResponseCommand } from "@/types";
import type { SaveStatus } from "../survey/SaveStatusIndicator";
import log from "@/lib/logger";

interface UseSurveyAutoSaveParams {
  response: SurveyResponseDto | null;
  onStatusChange: (status: SaveStatus) => void;
  debounceMs?: number;
}

/**
 * Custom hook for auto-saving survey responses with debouncing.
 *
 * @param response - The current survey response state
 * @param onStatusChange - Callback to update the save status
 * @param debounceMs - Debounce delay in milliseconds (default: 5000)
 */
export function useSurveyAutoSave({ response, onStatusChange, debounceMs = 5000 }: UseSurveyAutoSaveParams) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousResponseRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  useEffect(() => {
    // Guard clause: no response to save
    if (!response) {
      return;
    }

    // Serialize the response for comparison
    const currentResponseData = JSON.stringify({
      overall_rating: response.overall_rating,
      open_feedback: response.open_feedback,
    });

    // Guard clause: no changes detected
    if (currentResponseData === previousResponseRef.current) {
      return;
    }

    // Guard clause: skip if currently saving
    if (isSavingRef.current) {
      return;
    }

    // Update previous response
    previousResponseRef.current = currentResponseData;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set status to typing
    onStatusChange("typing");

    // Set up debounced save
    timeoutRef.current = setTimeout(async () => {
      // Guard clause: response is null or completed
      if (!response || response.completed_at) {
        return;
      }

      isSavingRef.current = true;
      onStatusChange("saving");

      try {
        // Prepare the update command
        const command: UpdateSurveyResponseCommand = {
          overall_rating: response.overall_rating,
          open_feedback: response.open_feedback,
          completed_at: undefined, // Don't mark as completed during auto-save
        };

        // Call the API
        const res = await fetch(`/api/survey-responses/${response.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!res.ok) {
          throw new Error("Failed to save survey response");
        }

        // Success
        onStatusChange("saved");

        // Reset to idle after 2 seconds
        setTimeout(() => {
          onStatusChange("idle");
        }, 2000);
      } catch (error) {
        log.error("Auto-save error:", error);
        onStatusChange("error");

        // Reset to idle after showing error for 3 seconds
        setTimeout(() => {
          onStatusChange("idle");
        }, 3000);
      } finally {
        isSavingRef.current = false;
      }
    }, debounceMs);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [response, onStatusChange, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
