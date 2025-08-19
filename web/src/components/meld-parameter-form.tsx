"use client";

import { useState } from 'react';
import { PatientProfile } from '@/lib/ai-health-intelligence';

interface MELDParameterFormProps {
  currentProfile?: PatientProfile;
  onProfileUpdate: (profile: PatientProfile) => void;
  missingParameters?: string[];
  className?: string;
}

export function MELDParameterForm({ 
  currentProfile = {}, 
  onProfileUpdate, 
  missingParameters = [],
  className = "" 
}: MELDParameterFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [profile, setProfile] = useState<PatientProfile>(currentProfile);

  const handleSave = () => {
    onProfileUpdate(profile);
    setIsExpanded(false);
  };

  const handleReset = () => {
    setProfile(currentProfile);
    setIsExpanded(false);
  };

  const hasMissingParams = missingParameters.length > 0;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🏥</span>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              MELD Score Parameters
            </h3>
            <p className="text-sm text-blue-600">
              {hasMissingParams 
                ? `Missing: ${missingParameters.join(', ')} for more accurate MELD 3.0 calculation`
                : 'All parameters provided for accurate MELD 3.0 calculation'
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            hasMissingParams
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
          }`}
        >
          {isExpanded ? 'Cancel' : (hasMissingParams ? 'Provide Missing Info' : 'Update Info')}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
                {missingParameters.includes('gender') && (
                  <span className="text-orange-600 ml-1">*</span>
                )}
              </label>
              <select
                value={profile.gender || ''}
                onChange={(e) => setProfile({ 
                  ...profile, 
                  gender: e.target.value as 'male' | 'female' | undefined 
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  missingParameters.includes('gender') 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-300'
                }`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Required for MELD 3.0 calculation (2023 standard)
              </p>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
                {missingParameters.includes('age') && (
                  <span className="text-orange-600 ml-1">*</span>
                )}
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={profile.age || ''}
                onChange={(e) => setProfile({ 
                  ...profile, 
                  age: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  missingParameters.includes('age') 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-300'
                }`}
                placeholder="Enter age"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for risk stratification and treatment planning
              </p>
            </div>
          </div>

          {/* Dialysis Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">🔄</span>
              <h4 className="font-medium text-gray-800">
                Dialysis Information
                {missingParameters.includes('dialysis') && (
                  <span className="text-orange-600 ml-1">*</span>
                )}
              </h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="onDialysis"
                  checked={profile.dialysis?.onDialysis || false}
                  onChange={(e) => setProfile({
                    ...profile,
                    dialysis: {
                      ...profile.dialysis,
                      onDialysis: e.target.checked,
                      sessionsPerWeek: e.target.checked ? (profile.dialysis?.sessionsPerWeek || 3) : 0
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="onDialysis" className="text-sm font-medium text-gray-700">
                  Currently on dialysis
                </label>
              </div>

              {profile.dialysis?.onDialysis && (
                <div className="ml-7 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sessions per week
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={profile.dialysis?.sessionsPerWeek || 3}
                      onChange={(e) => setProfile({
                        ...profile,
                        dialysis: {
                          ...profile.dialysis!,
                          sessionsPerWeek: parseInt(e.target.value) || 3
                        }
                      })}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ≥2 sessions/week adjusts creatinine to 4.0 mg/dL for safety
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last session date (optional)
                    </label>
                    <input
                      type="date"
                      value={profile.dialysis?.lastSession || ''}
                      onChange={(e) => setProfile({
                        ...profile,
                        dialysis: {
                          ...profile.dialysis!,
                          lastSession: e.target.value || undefined
                        }
                      })}
                      className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical History */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">📋</span>
              <h4 className="font-medium text-gray-800">Medical History</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Liver Disease */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary liver condition
                </label>
                <select
                  value={profile.primaryCondition || ''}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    primaryCondition: e.target.value || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select condition</option>
                  <option value="cirrhosis">Cirrhosis</option>
                  <option value="hepatitis">Hepatitis</option>
                  <option value="fatty_liver">Fatty Liver Disease</option>
                  <option value="autoimmune">Autoimmune Liver Disease</option>
                  <option value="alcoholic">Alcoholic Liver Disease</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Date of diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of diagnosis
                </label>
                <input
                  type="date"
                  value={profile.diagnosisDate || ''}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    diagnosisDate: e.target.value || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium"
            >
              Save Profile
            </button>
          </div>

          {/* Information Panel */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <span className="text-lg">💡</span>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">Why do we need this information?</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Gender & Albumin:</strong> Required for MELD 3.0 (2023 standard) - more accurate than classic MELD</li>
                  <li>• <strong>Dialysis:</strong> Critical safety requirement - adjusts creatinine calculation to prevent underestimation</li>
                  <li>• <strong>Medical History:</strong> Helps provide personalized insights and treatment recommendations</li>
                  <li>• <strong>All data is stored securely</strong> and only used for your health calculations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
