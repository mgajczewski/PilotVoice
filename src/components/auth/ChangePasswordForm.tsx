import * as React from "react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ newPassword?: string; confirmNewPassword?: string }>({});

  const validateForm = (): boolean => {
    const errors: { newPassword?: string; confirmNewPassword?: string } = {};
    let isValid = true;

    if (!newPassword) {
      errors.newPassword = "New password is required";
      isValid = false;
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
      isValid = false;
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = "Please confirm your new password";
      isValid = false;
    } else if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = "Passwords do not match";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleBlur = (field: "newPassword" | "confirmNewPassword") => {
    const errors = { ...fieldErrors };

    if (field === "newPassword") {
      if (!newPassword) {
        errors.newPassword = "New password is required";
      } else if (newPassword.length < 8) {
        errors.newPassword = "Password must be at least 8 characters long";
      } else {
        delete errors.newPassword;
      }

      // Also revalidate confirm password if it has been filled
      if (confirmNewPassword) {
        if (newPassword !== confirmNewPassword) {
          errors.confirmNewPassword = "Passwords do not match";
        } else {
          delete errors.confirmNewPassword;
        }
      }
    }

    if (field === "confirmNewPassword") {
      if (!confirmNewPassword) {
        errors.confirmNewPassword = "Please confirm your new password";
      } else if (newPassword !== confirmNewPassword) {
        errors.confirmNewPassword = "Passwords do not match";
      } else {
        delete errors.confirmNewPassword;
      }
    }

    setFieldErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to change password. Please try again.");
      }

      setSuccess(true);
      setNewPassword("");
      setConfirmNewPassword("");
      setFieldErrors({});
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Change Password</CardTitle>
        <CardDescription>Update your password to keep your account secure</CardDescription>
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
                <AlertDescription>Password changed successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => handleBlur("newPassword")}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.newPassword}
                aria-describedby={fieldErrors.newPassword ? "newPassword-error" : undefined}
              />
              {fieldErrors.newPassword && (
                <p id="newPassword-error" className="text-sm text-destructive">
                  {fieldErrors.newPassword}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">
                Confirm New Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmNewPassword"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                onBlur={() => handleBlur("confirmNewPassword")}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.confirmNewPassword}
                aria-describedby={fieldErrors.confirmNewPassword ? "confirmNewPassword-error" : undefined}
              />
              {fieldErrors.confirmNewPassword && (
                <p id="confirmNewPassword-error" className="text-sm text-destructive">
                  {fieldErrors.confirmNewPassword}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Changing..." : "Change Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

