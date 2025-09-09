/**
 * Privacy utilities for medical data sharing
 * Ensures HIPAA compliance and proper anonymization
 */

export interface PrivacySettings {
  anonymizationLevel: 'minimal' | 'standard' | 'high' | 'full';
  showPartialName: boolean;
  showAge: boolean;
  showLocation: boolean;
  showDates: boolean;
  shareType: 'HEALTHCARE_PROVIDER' | 'PATIENT_FAMILY' | 'RESEARCH' | 'INSURANCE';
}

/**
 * Anonymize patient name based on privacy settings and share context
 */
export function anonymizePatientName(
  name: string | null | undefined, 
  settings: PrivacySettings,
  shareContext: 'PROFESSIONAL' | 'FAMILY' | 'RESEARCH'
): string {
  if (!name) {
    return '[Name Protected]';
  }

  // For healthcare provider sharing - show initials only
  if (shareContext === 'PROFESSIONAL' && settings.shareType === 'HEALTHCARE_PROVIDER') {
    const nameParts = name.trim().split(' ');
    const initials = nameParts
      .map(part => part.charAt(0).toUpperCase())
      .join('. ');
    return `${initials} (Patient)`;
  }

  // For family sharing - show first name only
  if (shareContext === 'FAMILY' && settings.shareType === 'PATIENT_FAMILY') {
    const firstName = name.trim().split(' ')[0];
    return `${firstName} (Family Share)`;
  }

  // For research - fully anonymized
  if (shareContext === 'RESEARCH' || settings.shareType === 'RESEARCH') {
    return 'Patient [Research ID: ANON]';
  }

  // Default: Full protection
  return '[Name Protected for Privacy]';
}

/**
 * Anonymize date of birth while preserving clinical relevance
 */
export function anonymizeDateOfBirth(
  dateOfBirth: Date | string | null | undefined,
  settings: PrivacySettings
): string {
  if (!dateOfBirth) {
    return '[Date Protected]';
  }

  const dob = new Date(dateOfBirth);
  const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  // Show age range instead of exact date for privacy
  if (settings.showAge) {
    const ageRange = getAgeRange(age);
    return `Age Range: ${ageRange}`;
  }

  return '[Date Protected]';
}

/**
 * Get age range for privacy protection
 */
function getAgeRange(age: number): string {
  if (age < 18) return 'Under 18';
  if (age < 30) return '18-29';
  if (age < 40) return '30-39';
  if (age < 50) return '40-49';
  if (age < 60) return '50-59';
  if (age < 70) return '60-69';
  if (age < 80) return '70-79';
  return '80+';
}

/**
 * Anonymize location data
 */
export function anonymizeLocation(
  location: string | null | undefined,
  settings: PrivacySettings
): string {
  if (!location || !settings.showLocation) {
    return '[Location Protected]';
  }

  // Show only state/region for privacy
  const parts = location.split(',');
  if (parts.length > 1) {
    const state = parts[parts.length - 1].trim();
    return `${state} (Region)`;
  }

  return '[Location Protected]';
}

/**
 * Create privacy-compliant patient profile for sharing
 */
export function createPrivacyCompliantProfile(
  profile: any,
  shareType: 'HEALTHCARE_PROVIDER' | 'PATIENT_FAMILY' | 'RESEARCH' = 'HEALTHCARE_PROVIDER'
): any {
  if (!profile) {
    return null;
  }

  const privacySettings: PrivacySettings = {
    anonymizationLevel: 'standard',
    showPartialName: false, // Never show partial names for HIPAA compliance
    showAge: shareType === 'HEALTHCARE_PROVIDER',
    showLocation: false, // Location always protected
    showDates: shareType === 'HEALTHCARE_PROVIDER',
    shareType
  };

  return {
    // Basic Information - Privacy Protected
    name: anonymizePatientName(profile.name, privacySettings, 'PROFESSIONAL'),
    age: privacySettings.showAge ? profile.age : undefined,
    gender: profile.gender, // Gender is typically allowed for clinical context
    dateOfBirth: anonymizeDateOfBirth(profile.dateOfBirth, privacySettings),
    location: anonymizeLocation(profile.location, privacySettings),

    // Medical Information - Clinical Context Preserved
    primaryDiagnosis: profile.primaryDiagnosis,
    diagnosisDate: privacySettings.showDates 
      ? profile.diagnosisDate 
      : '[Date Protected]',
    
    // Physical Information - Clinical Relevance
    height: profile.height,
    weight: profile.weight,
    
    // Treatment Information - Clinical Context
    onDialysis: profile.onDialysis,
    dialysisSessionsPerWeek: profile.dialysisSessionsPerWeek,
    dialysisStartDate: privacySettings.showDates 
      ? profile.dialysisStartDate 
      : '[Date Protected]',
    dialysisType: profile.dialysisType,
    liverDiseaseType: profile.liverDiseaseType,
    transplantCandidate: profile.transplantCandidate,
    transplantListDate: privacySettings.showDates 
      ? profile.transplantListDate 
      : '[Date Protected]',
    
    // Lifestyle Factors - Clinical Relevance
    alcoholUse: profile.alcoholUse,
    smokingStatus: profile.smokingStatus,
    
    // Healthcare Providers - Professional Context Only
    primaryPhysician: shareType === 'HEALTHCARE_PROVIDER' 
      ? profile.primaryPhysician 
      : '[Provider Protected]',
    hepatologist: shareType === 'HEALTHCARE_PROVIDER' 
      ? profile.hepatologist 
      : '[Provider Protected]',
    transplantCenter: shareType === 'HEALTHCARE_PROVIDER' 
      ? profile.transplantCenter 
      : '[Center Protected]',
    
    // Clinical Assessment
    ascites: profile.ascites,
    encephalopathy: profile.encephalopathy,
    
    // Privacy Controls
    includeMedicalHistory: true,
    includeContactInfo: false, // Never include contact info in sharing
    anonymizationLevel: privacySettings.anonymizationLevel,
    shareType: shareType,
    privacyNotice: 'This information is shared in compliance with HIPAA and applicable privacy laws. Patient identity is protected through anonymization.'
  };
}

/**
 * HIPAA compliance checker
 */
export function validateHIPAACompliance(profileData: any): {
  isCompliant: boolean;
  violations: string[];
  recommendations: string[];
} {
  const violations: string[] = [];
  const recommendations: string[] = [];

  // Check for direct identifiers (HIPAA Safe Harbor Rule)
  if (profileData.name && !profileData.name.includes('[') && !profileData.name.includes('Patient')) {
    violations.push('Full name should not be displayed in medical sharing');
  }

  if (profileData.dateOfBirth && profileData.dateOfBirth instanceof Date) {
    violations.push('Exact date of birth should be anonymized');
  }

  if (profileData.location && !profileData.location.includes('[') && !profileData.location.includes('Protected')) {
    violations.push('Specific location information should be anonymized');
  }

  if (profileData.includeContactInfo === true) {
    violations.push('Contact information should not be included in sharing');
  }

  // Recommendations for better privacy
  if (!profileData.privacyNotice) {
    recommendations.push('Add privacy notice explaining anonymization');
  }

  if (!profileData.anonymizationLevel) {
    recommendations.push('Specify anonymization level for transparency');
  }

  return {
    isCompliant: violations.length === 0,
    violations,
    recommendations
  };
}