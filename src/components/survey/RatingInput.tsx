import * as React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { Label } from "@/components/ui/label";

interface RatingInputProps {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
  required?: boolean;
}

export function RatingInput({ value, onChange, label, required = false }: RatingInputProps) {
  const ratingLabels = ["1 - Poor", "2", "3 - Average", "4", "5 - Excellent"];

  return (
    <div className="space-y-4">
      <Label className="text-base">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="px-2 py-4">
        <Slider
          min={1}
          max={5}
          step={1}
          value={value ?? undefined}
          onChange={(val) => {
            if (typeof val === "number") {
              onChange(val);
            }
          }}
          marks={{
            1: "1",
            2: "2",
            3: "3",
            4: "4",
            5: "5",
          }}
          dotStyle={{
            borderColor: "hsl(var(--primary))",
            borderWidth: 2,
            width: 12,
            height: 12,
            bottom: -4,
          }}
          activeDotStyle={{
            borderColor: "hsl(var(--primary))",
            backgroundColor: "hsl(var(--primary))",
          }}
          railStyle={{
            backgroundColor: "hsl(var(--muted))",
            height: 4,
          }}
          trackStyle={{
            backgroundColor: "hsl(var(--primary))",
            height: 4,
          }}
          handleStyle={{
            borderColor: "hsl(var(--primary))",
            backgroundColor: "hsl(var(--primary))",
            opacity: 1,
            width: 20,
            height: 20,
            marginTop: -8,
          }}
        />
      </div>

      {value !== null && (
        <div className="text-center">
          <span className="text-sm font-medium text-primary">{ratingLabels[value - 1]}</span>
        </div>
      )}

      <p className="text-sm text-muted-foreground">Rate from 1 (poor) to 5 (excellent)</p>
    </div>
  );
}
