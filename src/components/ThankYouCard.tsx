import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ThankYouCardProps {
  surveySlug: string;
}

export function ThankYouCard({ surveySlug }: ThankYouCardProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <CardTitle className="text-2xl md:text-3xl">Thank You!</CardTitle>
        <CardDescription className="text-base md:text-lg mt-2">
          Your survey has been submitted successfully
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p className="leading-relaxed">
              We appreciate you taking the time to share your feedback. Your responses help us improve future
              competitions and ensure a better experience for all pilots.
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 border border-border">
            <h3 className="font-semibold mb-2 text-foreground">🔒 Privacy Reminder</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your responses remain <strong className="text-foreground">completely anonymous</strong>. Any identifying
              information in your feedback has been automatically anonymized to protect your privacy.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="default" size="lg">
              <a href="/">Back to Home</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`/surveys/${surveySlug}`}>View Survey Details</a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
