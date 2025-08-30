"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { validatePasswordStrength, passwordsMatch } from "@/lib/password-utils";
import { AUTH_ERRORS } from "@/types/auth";

import TextInput from "./text-input";
import EmailInput from "./email-input";
import PasswordInput from "./password-input";
import SubmitButton from "./submit-button";
import GoogleSignInButton from "./google-sign-in-button";
import FormDivider from "./form-divider";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string[];
  confirmPassword?: string;
  general?: string;
}

interface ReusableSignUpFormProps {
  callbackUrl?: string;
  showGoogleSignIn?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function ReusableSignUpForm({
  callbackUrl = "/dashboard",
  showGoogleSignIn = true,
  onSuccess,
  onError
}: ReusableSignUpFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (!passwordsMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Create account via API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === AUTH_ERRORS.EMAIL_EXISTS) {
          setErrors({ email: "An account with this email already exists" });
        } else {
          const errorMessage = data.message || "Failed to create account";
          setErrors({ general: errorMessage });
          if (onError) onError(errorMessage);
        }
        return;
      }

      // Account created successfully, now sign in
      const signInResult = await signIn("credentials", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        const errorMessage = "Account created but sign in failed. Please try signing in manually.";
        setErrors({ general: errorMessage });
        if (onError) onError(errorMessage);
      } else if (signInResult?.ok) {
        if (onSuccess) onSuccess();
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      const errorMessage = "Something went wrong. Please try again.";
      setErrors({ general: errorMessage });
      if (onError) onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    setErrors({ general: error });
    if (onError) onError(error);
  };

  const passwordValidation = validatePasswordStrength(formData.password);

  return (
    <div className="space-y-6">
      {showGoogleSignIn && (
        <>
          <GoogleSignInButton
            callbackUrl={callbackUrl}
            text="Continue with Google"
            disabled={isLoading}
            onError={handleGoogleError}
          />
          <FormDivider text="Or create account with email" />
        </>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextInput
          id="name"
          name="name"
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          disabled={isLoading}
          autoComplete="name"
          required
        />

        <EmailInput
          id="email"
          name="email"
          label="Email address"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          disabled={isLoading}
          required
        />

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password?.[0]}
          disabled={isLoading}
          autoComplete="new-password"
          showStrengthIndicator
          strengthLevel={passwordValidation.strength}
          required
        />

        {errors.password && errors.password.length > 1 && (
          <div className="space-y-1">
            {errors.password.slice(1).map((error, index) => (
              <p key={index} className="text-sm text-red-600">{error}</p>
            ))}
          </div>
        )}

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />

        <div className="text-xs text-gray-600">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
        </div>

        <SubmitButton
          isLoading={isLoading}
          loadingText="Creating account..."
          disabled={!formData.name || !formData.email || !formData.password || !formData.confirmPassword}
        >
          Create account
        </SubmitButton>

        {errors.general && (
          <div className="text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-md p-3">
            {errors.general}
          </div>
        )}
      </form>
    </div>
  );
}