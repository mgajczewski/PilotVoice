import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface SurveyInfoCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function SurveyInfoCard({ title, subtitle, children }: SurveyInfoCardProps) {
  return (
    <Card data-testid="survey-info-card">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl" data-testid="survey-competition-name">
          {title}
        </CardTitle>
        <CardDescription className="text-base md:text-lg" data-testid="survey-competition-dates">
          {subtitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">{children}</div>
      </CardContent>
    </Card>
  );
}
