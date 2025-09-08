"use client";

import React, { useState } from "react";
import { X, Share2, Shield, Clock, Eye, Mail, Lock, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface ShareCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportIds?: string[]; // For specific report sharing
  onShareCreated?: (shareLink: any) => void;
}

interface ShareConfig {
  shareType: 'complete_profile' | 'specific_reports' | 'consultation_package';
  title: string;
  description: string;
  reportIds: string[];
  includeProfile: boolean;
  includeDashboard: boolean;
  includeScoring: boolean;
  includeAI: boolean;
  includeFiles: boolean;
  expiryDays: number;
  maxViews?: number;
  password?: string;
  allowedEmails: string[];
}

export function ShareCreationModal({ 
  isOpen, 
  onClose, 
  reportIds = [], 
  onShareCreated 
}: ShareCreationModalProps) {
  const [step, setStep] = useState<'type' | 'content' | 'security' | 'review' | 'success'>('type');
  const [config, setConfig] = useState<ShareConfig>({
    shareType: reportIds.length > 0 ? 'specific_reports' : 'complete_profile',
    title: '',
    description: '',
    reportIds: reportIds,
    includeProfile: true,
    includeDashboard: true,
    includeScoring: true,
    includeAI: true,
    includeFiles: true,
    expiryDays: 7,
    maxViews: undefined,
    password: undefined,
    allowedEmails: []
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdShare, setCreatedShare] = useState<any>(null);
  const [emailInput, setEmailInput] = useState('');

  if (!isOpen) return null;

    const handleCreateShare = async () => {
    setIsCreating(true);
    try {
      // Transform config to match API expectations
      const apiConfig = {
        ...config,
        shareType: config.shareType.toUpperCase(), // Convert to uppercase
        expiresAt: undefined, // Remove if present, API calculates from expiryDays
        // Ensure all required fields are present
        title: config.title || 'Shared Medical Report',
        reportIds: config.reportIds || [],
        allowedEmails: config.allowedEmails || [],
        // Only include password if it's actually set and meets minimum length
        password: config.password && config.password.length >= 6 ? config.password : undefined
      };

      console.log('Sending API config:', apiConfig); // Debug log

      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiConfig)
      });

      console.log('API Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData); // Debug log
        throw new Error(`Failed to create share link: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      const shareLink = data.shareLink;
      console.log('Extracted shareLink:', shareLink); // Debug log
      setCreatedShare(shareLink);
      setStep('success');
      console.log('Set step to success, createdShare:', shareLink); // Debug log
      onShareCreated?.(shareLink);
    } catch (error) {
      console.error('Share creation error:', error);
      setIsCreating(false);
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to create share link: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  const addEmail = () => {
    if (emailInput && !config.allowedEmails.includes(emailInput)) {
      setConfig(prev => ({
        ...prev,
        allowedEmails: [...prev.allowedEmails, emailInput]
      }));
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    setConfig(prev => ({
      ...prev,
      allowedEmails: prev.allowedEmails.filter(e => e !== email)
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success feedback
      const button = document.activeElement as HTMLButtonElement;
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
        button.style.backgroundColor = '#10b981';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-medical-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-medical-primary-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-medical-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-medical-neutral-900">
                Share Medical Report
              </h2>
              <p className="text-sm text-medical-neutral-600">
                Create a secure link to share your medical data with healthcare providers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-medical-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-medical-neutral-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Share Type Selection */}
          {step === 'type' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
                  What would you like to share?
                </h3>
                
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border border-medical-neutral-200 rounded-lg cursor-pointer hover:bg-medical-neutral-50 transition-colors">
                    <input
                      type="radio"
                      name="shareType"
                      value="complete_profile"
                      checked={config.shareType === 'complete_profile'}
                      onChange={(e) => setConfig(prev => ({ ...prev, shareType: e.target.value as any }))}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-medical-neutral-900">Complete Medical Profile</div>
                      <div className="text-sm text-medical-neutral-600">
                        Share all reports, trends, scores, AI insights, and profile information
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border border-medical-neutral-200 rounded-lg cursor-pointer hover:bg-medical-neutral-50 transition-colors">
                    <input
                      type="radio"
                      name="shareType"
                      value="specific_reports"
                      checked={config.shareType === 'specific_reports'}
                      onChange={(e) => setConfig(prev => ({ ...prev, shareType: e.target.value as any }))}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-medical-neutral-900">Specific Reports</div>
                      <div className="text-sm text-medical-neutral-600">
                        Share selected lab reports and related analysis only
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border border-medical-neutral-200 rounded-lg cursor-pointer hover:bg-medical-neutral-50 transition-colors">
                    <input
                      type="radio"
                      name="shareType"
                      value="consultation_package"
                      checked={config.shareType === 'consultation_package'}
                      onChange={(e) => setConfig(prev => ({ ...prev, shareType: e.target.value as any }))}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-medical-neutral-900">Consultation Package</div>
                      <div className="text-sm text-medical-neutral-600">
                        Share recent reports, key trends, and AI insights optimized for consultations
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Share Title *</Label>
                  <Input
                    id="title"
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Lab Results for Dr. Smith Consultation"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional context for the healthcare provider..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setStep('content')}
                  disabled={!config.title.trim()}
                >
                  Next: Content Selection
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Content Selection */}
          {step === 'content' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
                  Select Content to Include
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeProfile"
                      checked={config.includeProfile}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeProfile: !!checked }))
                      }
                    />
                    <Label htmlFor="includeProfile" className="font-medium">
                      Patient Profile & Demographics
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeDashboard"
                      checked={config.includeDashboard}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeDashboard: !!checked }))
                      }
                    />
                    <Label htmlFor="includeDashboard" className="font-medium">
                      Dashboard & Trends
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeScoring"
                      checked={config.includeScoring}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeScoring: !!checked }))
                      }
                    />
                    <Label htmlFor="includeScoring" className="font-medium">
                      MELD & Child-Pugh Scores
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAI"
                      checked={config.includeAI}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeAI: !!checked }))
                      }
                    />
                    <Label htmlFor="includeAI" className="font-medium">
                      AI Insights & Predictions
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeFiles"
                      checked={config.includeFiles}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, includeFiles: !!checked }))
                      }
                    />
                    <Label htmlFor="includeFiles" className="font-medium">
                      Original Documents & Images
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('type')}>
                  Back
                </Button>
                <Button onClick={() => setStep('security')}>
                  Next: Security Settings
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Security Settings */}
          {step === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
                  Security & Access Settings
                </h3>
                
                <div className="space-y-6">
                  {/* Expiry Settings */}
                  <div>
                    <Label htmlFor="expiry" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Link Expiry
                    </Label>
                    <select
                      id="expiry"
                      value={config.expiryDays}
                      onChange={(e) => setConfig(prev => ({ ...prev, expiryDays: parseInt(e.target.value) }))}
                      className="mt-1 w-full px-3 py-2 border border-medical-neutral-300 rounded-lg focus:ring-2 focus:ring-medical-primary-500 focus:border-transparent"
                    >
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>1 week</option>
                      <option value={14}>2 weeks</option>
                      <option value={30}>1 month</option>
                    </select>
                  </div>

                  {/* View Limit */}
                  <div>
                    <Label htmlFor="maxViews" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Maximum Views (Optional)
                    </Label>
                    <Input
                      id="maxViews"
                      type="number"
                      value={config.maxViews || ''}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        maxViews: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      placeholder="Leave empty for unlimited views"
                      className="mt-1"
                    />
                  </div>

                  {/* Password Protection */}
                  <div>
                    <Label htmlFor="password" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password Protection (Optional)
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={config.password || ''}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        password: e.target.value || undefined 
                      }))}
                      placeholder="Leave empty for no password"
                      className="mt-1"
                    />
                  </div>

                  {/* Email Restrictions */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Restrict Access to Specific Emails (Optional)
                    </Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="doctor@hospital.com"
                          onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                        />
                        <Button type="button" onClick={addEmail} size="sm">
                          Add
                        </Button>
                      </div>
                      {config.allowedEmails.length > 0 && (
                        <div className="space-y-1">
                          {config.allowedEmails.map((email, index) => (
                            <div key={index} className="flex items-center justify-between bg-medical-neutral-50 px-3 py-2 rounded">
                              <span className="text-sm">{email}</span>
                              <button
                                onClick={() => removeEmail(email)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('content')}>
                  Back
                </Button>
                <Button onClick={() => setStep('review')}>
                  Review & Create
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
                  Review Share Settings
                </h3>
                
                <div className="bg-medical-neutral-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="font-medium">Title:</span> {config.title}
                  </div>
                  {config.description && (
                    <div>
                      <span className="font-medium">Description:</span> {config.description}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Share Type:</span> {
                      config.shareType === 'complete_profile' ? 'Complete Medical Profile' :
                      config.shareType === 'specific_reports' ? 'Specific Reports' :
                      'Consultation Package'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span> {config.expiryDays} day{config.expiryDays !== 1 ? 's' : ''}
                  </div>
                  {config.maxViews && (
                    <div>
                      <span className="font-medium">Max Views:</span> {config.maxViews}
                    </div>
                  )}
                  {config.password && (
                    <div>
                      <span className="font-medium">Password Protected:</span> Yes
                    </div>
                  )}
                  {config.allowedEmails.length > 0 && (
                    <div>
                      <span className="font-medium">Restricted to:</span> {config.allowedEmails.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Privacy Notice</h4>
                    <p className="text-amber-800 text-sm">
                      By creating this share link, you consent to sharing the selected medical information 
                      with healthcare providers who access this link. All access will be logged for security purposes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <h4 className="font-semibold text-blue-900 mb-2">Ready to Create Your Share Link?</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Click the button below to generate a secure link that you can share with healthcare providers.
                  </p>
                  <div className="text-xs text-blue-700">
                    ✓ Link will expire in {config.expiryDays} day{config.expiryDays !== 1 ? 's' : ''} • ✓ All access logged for security
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center gap-4">
                <button
                  onClick={() => setStep('security')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateShare}
                  disabled={isCreating}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 min-w-[160px] justify-center"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      🔗 Create Share Link
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Success */}
          {step === 'success' && createdShare && createdShare.url && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
                  Share Link Created Successfully!
                </h3>
                <p className="text-medical-neutral-600">
                  Your secure medical report share link is ready to use.
                </p>
              </div>

              <div className="bg-medical-neutral-50 rounded-lg p-4">
                <Label className="text-sm font-medium text-medical-neutral-700">
                  Share Link:
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={createdShare.url}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(createdShare.url)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-medical-neutral-600 space-y-1">
                <p>• Link expires: {new Date(createdShare.expiresAt).toLocaleDateString()}</p>
                <p>• Share ID: {createdShare.id}</p>
                <p>• All access will be logged for security</p>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={onClose}
                  className="px-8 py-2"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}