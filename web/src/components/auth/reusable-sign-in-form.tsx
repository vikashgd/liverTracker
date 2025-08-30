"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AUTH_ERRORS } from "@/types/auth";

import EmailInput from "./email-input";
import PasswordInput from "./password-input";
import SubmitButton from "./submit-button";
import GoogleSignInButton from "./google-sign-in-button";
import FormDivider from "./form-divider";

interface ReusableSignInFormProps {
  callbackUrl?: string;
  showGoogleSignIn?: boolean;
  showForgotPassword?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ReusableSignInForm({
  callbackUrl,
  showGoogleSignIn = true,
  showForgotPassword = true,
  onSuccess,
  onError
}: ReusableSignInFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCallbackUrl = callbackUrl || searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = getErrorMessage(result.error);
        setError(errorMessage);
        if (onError) onError(errorMessage);
      } else if (result?.ok) {
        if (onSuccess) onSuccess();
        router.push(defaultCallbackUrl);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      const errorMessage = "Something went wrong. Please try again.";
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    setError(error);
    if (onError) onError(error);
  };

  const displayError = error || (urlError && getErrorMessage(urlError));

  return (
    <div className="space-y-6">
      {showGoogleSignIn && (
        <>
          <GoogleSignInButton
            callbackUrl={defaultCallbackUrl}
            disabled={isLoading}
            onError={handleGoogleError}
          />
          <FormDivider text="Or continue with email" />
        </>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <EmailInput
          id="email"
          name="email"
          label="Email address"
          value={formData.email}
          onChange={handleInputChange}
          disabled={isLoading}
          required
        />

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          value={formData.password}
          onChange={handleInputChange}
          disabled={isLoading}
          required
        />

        {showForgotPassword && (
          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>
        )}

        <SubmitButton
          isLoading={isLoading}
          loadingText="Signing in..."
          disabled={!formData.email || !formData.password}
        >
          Sign in
        </SubmitButton>

        {displayError && (
          <div className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-md p-3">
            {displayError}
          </div>
        )}
      </form>
    </div>
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'CredentialsSignin':
    case AUTH_ERRORS.INVALID_CREDENTIALS:
      return 'Invalid email or password. Please try again.';
    case AUTH_ERRORS.ACCOUNT_LOCKED:
      return 'Account temporarily locked due to multiple failed attempts. Please try again later or reset your password.';
    case 'OAuthSignin':
    case 'OAuthCallback':
    case 'OAuthCreateAccount':
      return 'Google sign in failed. Please try again or use email/password.';
    case 'EmailCreateAccount':
      return 'Could not create account. Please try again.';
    case 'Callback':
      return 'Authentication failed. Please try again.';
    case 'OAuthAccountNotLinked':
      return 'This email is already registered. Please sign in with your password or use the same method you used before.';
    case 'EmailSignin':
      return 'Email sign in failed. Please try again.';
    case 'CredentialsSignup':
      return 'Account creation failed. Please try again.';
    case 'SessionRequired':
      return 'Please sign in to access this page.';
    case 'SessionInvalid':
      return 'Your session has expired. Please sign in again.';
    default:
      return 'An error occurred. Please try again.';
  }
}