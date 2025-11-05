import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfileFormProps {
  initialCivlId?: string | null;
  initialRegistrationReason?: string | null;
}

export function UserProfileForm({ initialCivlId, initialRegistrationReason }: UserProfileFormProps) {
  const [civlId, setCivlId] = useState(initialCivlId || "");
  const [registrationReason, setRegistrationReason] = useState(initialRegistrationReason || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // At least one field should be filled
    if (!civlId.trim() && !registrationReason.trim()) {
      setError("Please provide either a CIVL ID or a reason for registration");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          civl_id: civlId.trim() || null,
          registration_reason: registrationReason.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to update profile. Please try again.");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Profile Information</CardTitle>
        <CardDescription>
          Update your CIVL ID or provide a reason for registration if you don't have one
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <AlertDescription>Profile updated successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="civlId">CIVL ID</Label>
              <Input
                id="civlId"
                type="text"
                placeholder="e.g., 12345"
                value={civlId}
                onChange={(e) => setCivlId(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Your CIVL (Commission Internationale de Vol Libre) ID number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationReason">Reason for Registration (if no CIVL ID)</Label>
              <Textarea
                id="registrationReason"
                placeholder="Please explain why you're registering without a CIVL ID..."
                value={registrationReason}
                onChange={(e) => setRegistrationReason(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                If you don't have a CIVL ID, please explain your reason for registration
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 border p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Providing your CIVL ID helps us verify your participation in competitions. If
                you don't have a CIVL ID, please provide a brief explanation of your involvement in paragliding.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

