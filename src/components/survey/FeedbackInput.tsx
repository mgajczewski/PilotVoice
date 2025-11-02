import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FeedbackInputProps {
  value: string | null;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
}

export function FeedbackInput({
  value,
  onChange,
  label,
  placeholder = "Share your thoughts...",
}: FeedbackInputProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="feedback" className="text-base">
        {label}
      </Label>
      <Textarea
        id="feedback"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="resize-none"
      />
      <p className="text-sm text-muted-foreground">
        Optional - Your feedback will be anonymized to protect your privacy
      </p>
    </div>
  );
}

