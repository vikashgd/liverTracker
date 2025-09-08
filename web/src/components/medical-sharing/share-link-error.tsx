"use client";

import React from "react";
import { AlertTriangle, Clock, Shield, RefreshCw } from "lucide-react";

interface ShareLinkErrorProps {
  error: string | null;
}

export function ShareLinkError({ error }: ShareLinkErrorProps) {
  const getErrorDetails = (errorMessage: string | null) => {
    if (!errorMessage) {
      return {
        title: "Unknown Error",
        description: "An unexpected error occurred.",
        icon: AlertTriangle,
        color: "red"
      };
    }

    const message = errorMessage.toLowerCase();

    if (message.includes('expired') || message.includes('expir')) {
      return {
        title: "Link Expired",
        description: "This medical report link has expired. Please request a new link from the patient.",
        icon: Clock,
        color: "amber",
        action: "Contact the patient to request a new share link"
      };
    }

    if (message.includes('not found') || message.includes('invalid')) {
      return {
        title: "Link Not Found",
        description: "This share link is invalid or has been removed. Please verify the link with the patient.",
        icon: AlertTriangle,
        color: "red",
        action: "Double-check the link URL or request a new link"
      };
    }

    if (message.includes('max') && message.includes('view')) {
      return {
        title: "View Limit Reached",
        description: "This link has reached its maximum number of views. Please contact the patient for a new link.",
        icon: Shield,
        color: "blue",
        action: "Request a new share link from the patient"
      };
    }

    if (message.includes('revoked') || message.includes('disabled')) {
      return {
        title: "Access Revoked",
        description: "This share link has been revoked by the patient. Access is no longer available.",
        icon: Shield,
        color: "red",
        action: "Contact the patient if you still need access to this information"
      };
    }

    if (message.includes('password')) {
      return {
        title: "Authentication Failed",
        description: "The password provided is incorrect. Please verify the password with the patient.",
        icon: Shield,
        color: "amber",
        action: "Verify the correct password with the patient"
      };
    }

    return {
      title: "Access Error",
      description: errorMessage,
      icon: AlertTriangle,
      color: "red",
      action: "Please try again or contact the patient for assistance"
    };
  };

  const errorDetails = getErrorDetails(error);
  const IconComponent = errorDetails.icon;

  const colorClasses = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      title: "text-red-900",
      text: "text-red-700",
      button: "bg-red-600 hover:bg-red-700"
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200", 
      icon: "text-amber-600",
      title: "text-amber-900",
      text: "text-amber-700",
      button: "bg-amber-600 hover:bg-amber-700"
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600", 
      title: "text-blue-900",
      text: "text-blue-700",
      button: "bg-blue-600 hover:bg-blue-700"
    }
  };

  const colors = colorClasses[errorDetails.color as keyof typeof colorClasses];

  return (
    <div className="min-h-screen bg-medical-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className={`${colors.bg} ${colors.border} border rounded-xl p-8 text-center`}>
          <IconComponent className={`w-16 h-16 ${colors.icon} mx-auto mb-4`} />
          
          <h1 className={`text-2xl font-bold ${colors.title} mb-3`}>
            {errorDetails.title}
          </h1>
          
          <p className={`${colors.text} mb-6 leading-relaxed`}>
            {errorDetails.description}
          </p>

          {errorDetails.action && (
            <div className="bg-white rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-medical-neutral-900 mb-2">
                What to do next:
              </h3>
              <p className="text-medical-neutral-700 text-sm">
                {errorDetails.action}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className={`w-full ${colors.button} text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <button
              onClick={() => window.close()}
              className="w-full border border-medical-neutral-300 text-medical-neutral-700 py-3 px-4 rounded-lg font-semibold hover:bg-medical-neutral-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6 text-sm text-medical-neutral-500">
          <p>
            If you continue to experience issues, please contact the patient 
            who shared this medical report with you.
          </p>
        </div>
      </div>
    </div>
  );
}