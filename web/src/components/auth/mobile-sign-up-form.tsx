"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import MobileEmailInput from "./mobile-email-input";
import MobilePasswordInput from "./mobile-password-input";
import MobileSubmitButton from "./mobile-submit-button";
import MobileGoogleButton from "./mobile-google-button";
import ErrorMessage from "./error-message";
import SuccessMessage from "./success-message";
import { validatePasswordStrength } from "@/lib/password-utils";

interface MobileTextInputProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

function MobileTextInput({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false
}: MobileTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={id}
        name={name}
        type="text"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          block w-full px-4 py-3 text-base border rounded-lg
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error 
            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 text-gray-900 placeholder-gray-500'
          }
          ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          transition-all duration-200
          min-h-[48px] text-16px
        `}
        style={{
          fontSize: '16px', // Prevents zoom on iOS
          WebkitAppearance: 'none',
          WebkitBorderRadius: '8px'
        }}
      />

      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function MobileSignUpForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  
  const router = useRouter();

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      const strength = validatePasswordStrength(value);
      setPasswordStrength(strength.strength);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    
    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess("Account created successfully! Signing you in...");
      
      // Auto sign in after successful registration
      setTimeout(async () => {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          router.push("/dashboard");
        } else {
          router.push("/auth/signin?message=Account created successfully. Please sign in.");
        }
      }, 1500);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    setError(error);
  };

  if (success) {
    return (
      <div className="space-y-6">
        <SuccessMessage
          title="Account Created!"
          message={success}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Google Sign Up */}
      <MobileGoogleButton
        text="Sign up with Google"
        callbackUrl="/dashboard"
        disabled={loading}
        onError={handleGoogleError}
      />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-50 text-gray-500">Or create account with email</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage
          title="Sign Up Failed"
          message={error}
        />
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <MobileTextInput
          id="name"
          name="name"
          label="Full name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleInputChange('name')}
          required
          disabled={loading}
        />

        <MobileEmailInput
          id="email"
          name="email"
          label="Email address"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleInputChange('email')}
          required
          disabled={loading}
          autoComplete="email"
        />

        <MobilePasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleInputChange('password')}
          required
          disabled={loading}
          autoComplete="new-password"
          showStrengthIndicator={true}
          strengthLevel={passwordStrength}
        />

        <MobilePasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          required
          disabled={loading}
          autoComplete="new-password"
        />

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </label>
          </div>
        </div>

        <MobileSubmitButton
          type="submit"
          loading={loading}
          disabled={!formData.name || !formData.email || !formData.password || !formData.confirmPassword}
        >
          Create account
        </MobileSubmitButton>
      </form>
    </div>
  );
}