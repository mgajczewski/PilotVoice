import * as React from "react";

export type SaveStatus = "idle" | "typing" | "saving" | "saved" | "error";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  const statusConfig = {
    typing: {
      text: "Typing...",
      className: "text-muted-foreground",
    },
    saving: {
      text: "Saving...",
      className: "text-muted-foreground",
    },
    saved: {
      text: "Saved",
      className: "text-green-600 dark:text-green-500",
    },
    error: {
      text: "Save error",
      className: "text-destructive",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      {status === "saving" && (
        <svg
          className="animate-spin h-4 w-4 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className={`text-sm ${config.className}`}>{config.text}</span>
    </div>
  );
}
