import * as React from "react";
import type { GdprCheckResult } from "@/lib/services/anonymizationService";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface GdprWarningProps {
  result: GdprCheckResult;
  onAccept: () => void;
  onEdit: () => void;
}

/**
 * Component that displays a GDPR warning when personal data is detected in user feedback.
 * Implements US-007 requirements by showing both original and anonymized versions.
 */
export function GdprWarning({ result, onAccept, onEdit }: GdprWarningProps) {
  // Guard clause: don't show if no personal data detected
  if (!result.containsPersonalData) {
    return null;
  }

  return (
    <Alert variant="destructive" className="my-4">
      <AlertTitle className="text-lg font-semibold flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="size-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        Personal Data Detected
      </AlertTitle>

      <AlertDescription>
        <div className="space-y-4 mt-2">
          <p className="text-sm">
            We detected potential personal information in your response ({result.detectedDataTypes?.join(", ")}). For
            GDPR compliance, we suggest the following anonymized version:
          </p>

          <div className="space-y-3">
            {/* Original Text */}
            <Card className="bg-background/50">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2 text-foreground">Your Original Text:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.originalText}</p>
              </CardContent>
            </Card>

            {/* Anonymized Text */}
            <Card className="bg-background/50 border-primary/50">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2 text-foreground">Suggested Anonymized Version:</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.anonymizedText}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button onClick={onAccept} variant="default" className="flex-1">
              Accept Anonymized Version
            </Button>
            <Button onClick={onEdit} variant="outline" className="flex-1">
              Edit My Response
            </Button>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Note: Only the anonymized version will be stored in the database.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
