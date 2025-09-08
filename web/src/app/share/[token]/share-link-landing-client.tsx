"use client";

import React, { useState, useEffect } from "react";
import { Shield, Clock, Eye, AlertTriangle, FileText, Download } from "lucide-react";
import { ProfessionalMedicalView } from "@/components/medical-sharing/professional-medical-view";
import { ShareLinkError } from "@/components/medical-sharing/share-link-error";
import LoadingSpinner from "@/components/auth/loading-spinner";

interface ShareLinkLandingClientProps {
  token: string;
}

interface ShareLinkInfo {
  id: string;
  title: string;
  description?: string;
  expiresAt: string;
  currentViews: number;
  maxViews?: number;
  requiresPassword: boolean;
  patientName?: string;
  createdAt: string;
}

interface SharedMedicalData {
  patient: {
    id: string;
    name?: string;
    age?: number;
    gender?: string;
  };
  reports: any[];
  executiveSummary: any;
  // ... other medical data
}

export function ShareLinkLandingClient({ token }: ShareLinkLandingClientProps) {
  const [step, setStep] = useState<'loading' | 'landing' | 'password' | 'viewing' | 'error'>('loading');
  const [shareInfo, setShareInfo] = useState<ShareLinkInfo | null>(null);
  const [medicalData, setMedicalData] = useState<SharedMedicalData | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    validateShareLink();
  }, [token]);

  const validateShareLink = async () => {
    try {
      const response = await fetch(`/api/share/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Share link not found');
        setStep('error');
        return;
      }

      const data = await response.json();
      setShareInfo(data);
      
      if (data.requiresPassword) {
        setStep('password');
      } else {
        setStep('landing');
      }
    } catch (err) {
      setError('Failed to validate share link');
      setStep('error');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Submitting password...');
    
    try {
      const response = await fetch(`/api/share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      console.log('🔐 Password validation response:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Password error:', errorData);
        setError(errorData.error || 'Invalid password');
        return;
      }

      const data = await response.json();
      console.log('✅ Password validated, moving to landing');
      setShareInfo(data);
      setStep('landing');
    } catch (err) {
      console.error('💥 Password exception:', err);
      setError('Failed to verify password');
    }
  };

  const handleAccessMedicalData = async () => {
    if (!agreedToTerms) {
      setError('Please agree to the confidentiality terms');
      return;
    }

    try {
      console.log('🔄 Starting medical data access...');
      setStep('loading');
      
      const response = await fetch(`/api/share/${token}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password: password || undefined 
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        setError(errorData.error || 'Failed to access medical data');
        setStep('error');
        return;
      }

      const data = await response.json();
      console.log('✅ Medical data received:', {
        hasReports: !!data.medicalData?.reports,
        reportCount: data.medicalData?.reports?.individual?.length || 0,
        hasPatient: !!data.medicalData?.patient,
        hasScoring: !!data.medicalData?.scoring,
        hasAiAnalysis: !!data.medicalData?.aiAnalysis,
        medicalDataKeys: Object.keys(data.medicalData || {}),
        reportsKeys: Object.keys(data.medicalData?.reports || {}),
        rawResponse: data
      });
      
      setMedicalData(data.medicalData);
      setStep('viewing');
    } catch (err) {
      console.error('💥 Exception:', err);
      setError('Failed to load medical data');
      setStep('error');
    }
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-medical-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-medical-neutral-600">Validating secure link...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return <ShareLinkError error={error} />;
  }

  if (step === 'password') {
    return (
      <div className="min-h-screen bg-medical-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-medical-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-medical-neutral-900">Password Required</h1>
            <p className="text-medical-neutral-600 mt-2">
              This medical report is password protected for additional security.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-medical-neutral-700 mb-2">
                Access Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-medical-neutral-300 rounded-lg focus:ring-2 focus:ring-medical-primary-500 focus:border-transparent"
                placeholder="Enter password provided by patient"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              style={{ minHeight: '48px' }}
            >
              🔓 Continue with Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'viewing' && medicalData) {
    return (
      <div className="min-h-screen">
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 font-semibold">✅ Medical Data Loaded Successfully</div>
          <div className="text-green-600 text-sm">Displaying {Array.isArray(medicalData.reports) ? medicalData.reports.length : 0} reports</div>
        </div>
        <ProfessionalMedicalView 
          shareToken={token}
          medicalData={medicalData}
          shareInfo={shareInfo!}
        />
      </div>
    );
  }

  if (step === 'viewing' && !medicalData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-semibold mb-2">⚠️ No Medical Data Available</div>
          <div className="text-red-600 text-sm mb-4">The medical data failed to load properly.</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Landing page with confidentiality agreement
  return (
    <div className="min-h-screen bg-medical-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-medical-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-medical-primary-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-medical-neutral-900">
                Secure Medical Report
              </h1>
              <p className="text-medical-neutral-600">
                Confidential patient information - Healthcare provider access
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Share Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-medical-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-medical-neutral-900 mb-4">
            {shareInfo?.title || 'Medical Report Share'}
          </h2>
          
          {shareInfo?.description && (
            <p className="text-medical-neutral-700 mb-4">{shareInfo.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-medical-neutral-600">
              <Clock className="w-4 h-4" />
              <span>Expires: {new Date(shareInfo?.expiresAt || '').toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-medical-neutral-600">
              <Eye className="w-4 h-4" />
              <span>
                Views: {shareInfo?.currentViews || 0}
                {shareInfo?.maxViews && ` / ${shareInfo.maxViews}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-medical-neutral-600">
              <Shield className="w-4 h-4" />
              <span>Secure & Encrypted</span>
            </div>
          </div>
        </div>

        {/* Confidentiality Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">
                Confidentiality Notice
              </h3>
              <div className="text-amber-800 text-sm space-y-2">
                <p>
                  This medical information is confidential and protected under HIPAA and other applicable privacy laws. 
                  By accessing this report, you acknowledge that:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You are a healthcare provider authorized to view this information</li>
                  <li>You will maintain the confidentiality of all patient information</li>
                  <li>You will not share, copy, or distribute this information without proper authorization</li>
                  <li>Your access is being logged for security and compliance purposes</li>
                  <li>This information is for medical consultation purposes only</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Access Agreement */}
        <div className="bg-white rounded-xl shadow-sm border border-medical-neutral-200 p-6">
          <h3 className="font-semibold text-medical-neutral-900 mb-4">
            Healthcare Provider Access Agreement
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-medical-primary-600 border-medical-neutral-300 rounded focus:ring-medical-primary-500"
              />
              <span className="text-sm text-medical-neutral-700">
                I am a licensed healthcare provider and I agree to maintain the confidentiality 
                of this medical information in accordance with applicable privacy laws and professional standards.
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleAccessMedicalData}
                disabled={!agreedToTerms}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                style={{ minHeight: '48px' }}
              >
                🔓 Access Medical Report
              </button>
              
              <button
                onClick={() => window.close()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                style={{ minHeight: '48px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-medical-neutral-500">
          <p>
            This secure link was generated by LiverTracker Medical Platform. 
            All access is logged and monitored for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
}