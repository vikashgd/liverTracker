"use client";

import { useState } from "react";
import Link from "next/link";

import EmailInput from "./email-input";
import SubmitButton from "./submit-button";

interface ReusablePasswordResetFormProps {
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
}

export default function ReusablePasswordResetForm({
  onSuccess,
  onError
}: ReusablePasswordResetFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        const successMessage = "If an account with that email exists, we've sent you a password reset link.";
        setMessage(successMessage);
        if (onSuccess) onSuccess(email);
      } else {
        const errorMessage = data.error || "An error occurred. Please try again.";
        setError(errorMessage);
        if (onError) onError(errorMessage);
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{message}</div>
        </div>
        
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Didn't receive an email? Check your spam folder or try again.
          </p>
          
          <button
            onClick={() => {
              setSubmitted(false);
              setEmail("");
              setMessage("");
              setError("");
            }}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Try again
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <EmailInput
          id="email"
          name="email"
          label="Email address"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          disabled={isLoading}
          required
        />

        <SubmitButton
          isLoading={isLoading}
          loadingText="Sending..."
          disabled={!email.trim()}
        >
          Send reset link
        </SubmitButton>
      </form>

      <div className="text-center">
        <Link
          href="/auth/signin"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}