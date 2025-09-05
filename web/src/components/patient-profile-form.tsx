"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { User, Heart, Stethoscope, Phone, Settings, CheckCircle, Clock, AlertTriangle, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PatientProfile {
  id?: string;
  name?: string;
  location?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  onDialysis: boolean;
  dialysisSessionsPerWeek?: number;
  dialysisStartDate?: string;
  dialysisType?: 'hemodialysis' | 'peritoneal' | 'other';
  ascites?: 'none' | 'mild' | 'moderate';
  encephalopathy?: 'none' | 'grade1-2' | 'grade3-4';
  liverDiseaseType?: 'viral_hepatitis' | 'alcoholic' | 'nash' | 'autoimmune' | 'other';
  diagnosisDate?: string;
  transplantCandidate: boolean;
  transplantListDate?: string;
  alcoholUse?: 'never' | 'former' | 'current_light' | 'current_moderate' | 'current_heavy';
  smokingStatus?: 'never' | 'former' | 'current';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  primaryPhysician?: string;
  hepatologist?: string;
  transplantCenter?: string;
  preferredUnits: 'US' | 'International';
  timezone: string;
}

const defaultProfile: PatientProfile = {
  onDialysis: false,
  transplantCandidate: false,
  preferredUnits: 'US',
  timezone: 'UTC',
  ascites: 'none',
  encephalopathy: 'none'
};

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function PatientProfileForm() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<PatientProfile>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    try {
      console.log('🔍 Loading profile data...');
      const response = await fetch('/api/profile');
      console.log('📡 Profile API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Profile API response data:', data);
        
        if (data.profile) {
          // Convert ISO datetime strings to YYYY-MM-DD format for HTML date inputs
          const convertedProfile = { ...defaultProfile, ...data.profile };
          
          // Convert date fields from ISO strings to YYYY-MM-DD format
          if (convertedProfile.dateOfBirth) {
            convertedProfile.dateOfBirth = new Date(convertedProfile.dateOfBirth).toISOString().split('T')[0];
          }
          if (convertedProfile.diagnosisDate) {
            convertedProfile.diagnosisDate = new Date(convertedProfile.diagnosisDate).toISOString().split('T')[0];
          }
          if (convertedProfile.transplantListDate) {
            convertedProfile.transplantListDate = new Date(convertedProfile.transplantListDate).toISOString().split('T')[0];
          }
          if (convertedProfile.dialysisStartDate) {
            convertedProfile.dialysisStartDate = new Date(convertedProfile.dialysisStartDate).toISOString().split('T')[0];
          }
          
          console.log('✅ Setting profile data with converted dates:', convertedProfile);
          setProfile(convertedProfile);
        } else {
          console.log('⚠️ No profile data found in response');
        }
      } else {
        console.error('❌ Profile API error:', response.status, response.statusText);
      }
    } catch (err) {
      console.error('❌ Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSave = useCallback(
    debounce(async (profileData: PatientProfile) => {
      if (!hasChanges) return;
      
      setSaving(true);
      setError(null);
      
      try {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        });

        if (!response.ok) {
          throw new Error('Failed to save profile');
        }

        setLastSaved(new Date());
        setHasChanges(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save profile');
      } finally {
        setSaving(false);
      }
    }, 1500),
    [hasChanges]
  );

  const updateProfile = (updates: Partial<PatientProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    setHasChanges(true);
    debouncedSave(newProfile);
  };

  const calculateAge = () => {
    if (!profile.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(profile.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = () => {
    if (!profile.height || !profile.weight) return null;
    const heightInM = profile.height / 100;
    return (profile.weight / (heightInM * heightInM)).toFixed(1);
  };

  const getCompletionPercentage = () => {
    const fields = [
      profile.name, profile.location, profile.dateOfBirth, profile.gender, 
      profile.height, profile.weight, profile.liverDiseaseType, profile.diagnosisDate, 
      profile.primaryPhysician, profile.emergencyContactName, profile.emergencyContactPhone
    ];
    const completed = fields.filter(field => {
      return field !== undefined && field !== null && field !== '';
    }).length;
    return Math.round((completed / fields.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Profile</h1>
              <p className="text-gray-600 mt-1">
                Complete your profile for accurate MELD 3.0 and Child-Pugh calculations
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-600">
              {getCompletionPercentage()}%
            </div>
            <div className="text-sm text-gray-600">Complete</div>
            <div className="w-24 h-2 bg-gray-200 rounded-full mt-2">
              <div 
                className="h-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: getCompletionPercentage() + '%' }}
              />
            </div>
          </div>
        </div>
      </motion.div>



      <AnimatePresence>
        {saving && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-200"
          >
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Saving changes...</span>
          </motion.div>
        )}
        
        {lastSaved && !saving && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Saved at {lastSaved.toLocaleTimeString()}
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-indigo-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
              <CardTitle className="flex items-center space-x-2 text-indigo-800">
                <User className="w-5 h-5" />
                <span>Demographics & Vitals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profile.name || ''}
                    onChange={(e) => updateProfile({ name: e.target.value })}
                    className="mt-1"
                    placeholder="John Doe"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - helps personalize your experience</p>
                </div>

                <div>
                  <Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    value={profile.location || ''}
                    onChange={(e) => updateProfile({ location: e.target.value })}
                    className="mt-1"
                    placeholder="City, State or Country"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - for timezone and regional settings</p>
                </div>
              </div>

              {/* Demographics & Vitals */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-800 mb-4">Demographics & Vitals</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-gray-700 font-medium">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={profile.dateOfBirth || ''}
                      onChange={(e) => updateProfile({ dateOfBirth: e.target.value })}
                      className="mt-1"
                    />
                    {calculateAge() && (
                      <p className="text-sm text-gray-600 mt-1">Age: {calculateAge()} years</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="gender" className="text-gray-700 font-medium">Gender</Label>
                    <Select value={profile.gender || ''} onValueChange={(value) => updateProfile({ gender: value as any })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="height" className="text-gray-700 font-medium">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={profile.height || ''}
                      onChange={(e) => updateProfile({ height: parseFloat(e.target.value) || undefined })}
                      className="mt-1"
                      placeholder="170"
                    />
                  </div>

                  <div>
                    <Label htmlFor="weight" className="text-gray-700 font-medium">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={profile.weight || ''}
                      onChange={(e) => updateProfile({ weight: parseFloat(e.target.value) || undefined })}
                      className="mt-1"
                      placeholder="70"
                    />
                    {calculateBMI() && (
                      <p className="text-sm text-gray-600 mt-1">BMI: {calculateBMI()}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-yellow-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
              <CardTitle className="flex items-center space-x-2 text-yellow-800">
                <Stethoscope className="w-5 h-5" />
                <span>Clinical Information</span>
                <Badge variant="outline" className="ml-2 text-xs">MELD 3.0 & Child-Pugh</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <Checkbox
                    id="onDialysis"
                    checked={profile.onDialysis}
                    onCheckedChange={(checked) => updateProfile({ onDialysis: !!checked })}
                  />
                  <Label htmlFor="onDialysis" className="font-medium text-yellow-800">
                    Currently on Dialysis
                  </Label>
                  <Badge variant="secondary" className="text-xs">MELD 3.0 Factor</Badge>
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-4 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Child-Pugh Clinical Assessment
                  <Badge variant="secondary" className="ml-2 text-xs">Clinical Scoring</Badge>
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-purple-700">Ascites</Label>
                    <Select value={profile.ascites || 'none'} onValueChange={(value) => updateProfile({ ascites: value as any })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (1 point)</SelectItem>
                        <SelectItem value="mild">Mild/Controlled (2 points)</SelectItem>
                        <SelectItem value="moderate">Moderate/Refractory (3 points)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm text-purple-700">Hepatic Encephalopathy</Label>
                    <Select value={profile.encephalopathy || 'none'} onValueChange={(value) => updateProfile({ encephalopathy: value as any })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (1 point)</SelectItem>
                        <SelectItem value="grade1-2">Grade 1-2/Controlled (2 points)</SelectItem>
                        <SelectItem value="grade3-4">Grade 3-4/Refractory (3 points)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <Heart className="w-5 h-5" />
                <span>Medical History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 font-medium">Liver Disease Type</Label>
                  <Select value={profile.liverDiseaseType || ''} onValueChange={(value) => updateProfile({ liverDiseaseType: value as any })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select disease type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viral_hepatitis">Viral Hepatitis</SelectItem>
                      <SelectItem value="alcoholic">Alcoholic Liver Disease</SelectItem>
                      <SelectItem value="nash">NASH/NAFLD</SelectItem>
                      <SelectItem value="autoimmune">Autoimmune</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Diagnosis Date</Label>
                  <Input
                    type="date"
                    value={profile.diagnosisDate || ''}
                    onChange={(e) => updateProfile({ diagnosisDate: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Phone className="w-5 h-5" />
                <span>Healthcare Providers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 font-medium">Primary Physician</Label>
                  <Input
                    value={profile.primaryPhysician || ''}
                    onChange={(e) => updateProfile({ primaryPhysician: e.target.value })}
                    className="mt-1"
                    placeholder="Dr. Smith"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Hepatologist</Label>
                  <Input
                    value={profile.hepatologist || ''}
                    onChange={(e) => updateProfile({ hepatologist: e.target.value })}
                    className="mt-1"
                    placeholder="Dr. Johnson"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-800 mb-4">Emergency Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-700">Name</Label>
                    <Input
                      value={profile.emergencyContactName || ''}
                      onChange={(e) => updateProfile({ emergencyContactName: e.target.value })}
                      className="mt-1"
                      placeholder="Contact name"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">Phone</Label>
                    <Input
                      value={profile.emergencyContactPhone || ''}
                      onChange={(e) => updateProfile({ emergencyContactPhone: e.target.value })}
                      className="mt-1"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700">Relationship</Label>
                    <Input
                      value={profile.emergencyContactRelation || ''}
                      onChange={(e) => updateProfile({ emergencyContactRelation: e.target.value })}
                      className="mt-1"
                      placeholder="Spouse, Parent, etc."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
              <CardTitle className="flex items-center space-x-2 text-purple-800">
                <Settings className="w-5 h-5" />
                <span>Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 font-medium">Preferred Units</Label>
                  <Select value={profile.preferredUnits} onValueChange={(value) => updateProfile({ preferredUnits: value as any })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">US Units (mg/dL, etc.)</SelectItem>
                      <SelectItem value="International">International Units (mmol/L, etc.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-700 font-medium">Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(value) => updateProfile({ timezone: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}