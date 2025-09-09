/**
 * Medical Report Sharing System Types
 * Comprehensive type definitions for secure medical data sharing
 */

import type { ShareType } from '../generated/prisma';

// ================================
// CORE SHARING TYPES
// ================================

export interface ShareLinkConfig {
  shareType: ShareType;
  title: string;
  description?: string;
  reportIds?: string[];
  includeProfile: boolean;
  includeDashboard: boolean;
  includeScoring: boolean;
  includeAI: boolean;
  includeFiles: boolean;
  expiryDays: number;
  maxViews?: number;
  password?: string;
  allowedEmails?: string[];
}

export interface ShareLinkResult {
  id: string;
  token: string;
  url: string;
  expiresAt: Date;
  qrCode?: string; // Base64 QR code for mobile sharing
}

export interface ShareLinkValidation {
  isValid: boolean;
  shareLink?: ShareLinkData;
  error?: ShareLinkError;
  requiresPassword?: boolean;
}

export interface ShareLinkData {
  id: string;
  token: string;
  url: string;
  userId: string;
  shareType: ShareType;
  title: string;
  description?: string;
  reportIds: string[];
  includeProfile: boolean;
  includeDashboard: boolean;
  includeScoring: boolean;
  includeAI: boolean;
  includeFiles: boolean;
  expiresAt: Date;
  maxViews?: number;
  currentViews: number;
  allowedEmails: string[];
  isActive: boolean;
  createdAt: Date;
  lastAccessedAt?: Date;
}

export interface AccessInfo {
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  actionsPerformed?: Record<string, any>;
}

// ================================
// MEDICAL DATA TYPES
// ================================

export interface SharedMedicalData {
  patient: {
    id: string; // Anonymized
    demographics: PatientDemographics;
    profile: PatientProfile;
  };
  reports: {
    summary: ReportSummary;
    individual: MedicalReport[];
    trends: ChartSeries[];
  };
  scoring: {
    meld: MELDResult | null;
    childPugh: ChildPughResult | null;
    trends: ScoringTrends;
  };
  aiAnalysis: {
    insights: ClinicalInsight[];
    predictions: PredictiveAnalysis;
    recommendations: ClinicalRecommendation[];
  };
  files: {
    originalDocuments: FileReference[];
    processedImages: ProcessedImageData[];
  };
  metadata: {
    generatedAt: Date;
    dataRange: DateRange;
    shareToken: string;
    watermark: WatermarkData;
  };
}

export interface PatientDemographics {
  age?: number;
  gender?: string;
  location?: string;
  primaryDiagnosis?: string;
  diagnosisDate?: Date;
}

export interface PatientProfile {
  height?: number;
  weight?: number;
  onDialysis: boolean;
  dialysisSessionsPerWeek?: number;
  dialysisStartDate?: Date;
  dialysisType?: string;
  liverDiseaseType?: string;
  transplantCandidate: boolean;
  transplantListDate?: Date;
  alcoholUse?: string;
  smokingStatus?: string;
  primaryPhysician?: string;
  hepatologist?: string;
  transplantCenter?: string;
  ascites?: string;
  encephalopathy?: string;
}

export interface ReportSummary {
  totalReports: number;
  dateRange: DateRange;
  latestReportDate: Date;
  keyMetrics: KeyMetric[];
  criticalValues: CriticalValue[];
}

export interface MedicalReport {
  id: string;
  reportDate: Date;
  reportType: string;
  metrics: ExtractedMetric[];
  quality: QualityScore;
  originalFile?: FileReference;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  unit: string;
  referenceRange?: ReferenceRange;
}

export interface ChartDataPoint {
  date: Date;
  value: number;
  isAbnormal?: boolean;
  confidence?: number;
}

// ================================
// CLINICAL SCORING TYPES
// ================================

export interface MELDResult {
  score: number;
  class: 'Low' | 'Moderate' | 'High' | 'Critical';
  components: {
    creatinine: number;
    bilirubin: number;
    inr: number;
  };
  calculatedAt: Date;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface ChildPughResult {
  score: number;
  class: 'A' | 'B' | 'C';
  components: {
    bilirubin: number;
    albumin: number;
    inr: number;
    ascites: string;
    encephalopathy: string;
  };
  calculatedAt: Date;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface ScoringTrends {
  meldHistory: MELDHistoryPoint[];
  childPughHistory: ChildPughHistoryPoint[];
  trendAnalysis: TrendAnalysis;
}

export interface MELDHistoryPoint {
  date: Date;
  score: number;
  components: MELDResult['components'];
}

export interface ChildPughHistoryPoint {
  date: Date;
  score: number;
  class: 'A' | 'B' | 'C';
  components: ChildPughResult['components'];
}

export interface TrendAnalysis {
  direction: 'improving' | 'stable' | 'declining';
  confidence: number;
  significantChanges: SignificantChange[];
}

// ================================
// AI ANALYSIS TYPES
// ================================

export interface ClinicalInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  supportingData: any[];
  generatedAt: Date;
}

export interface PredictiveAnalysis {
  shortTermPredictions: Prediction[];
  longTermPredictions: Prediction[];
  riskFactors: RiskFactor[];
  confidence: number;
}

export interface Prediction {
  metric: string;
  timeframe: string;
  predictedValue: number;
  confidence: number;
  factors: string[];
}

export interface ClinicalRecommendation {
  id: string;
  category: 'monitoring' | 'lifestyle' | 'medical' | 'urgent';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  evidence: string[];
  generatedAt: Date;
}

// ================================
// FILE AND DOCUMENT TYPES
// ================================

export interface FileReference {
  id: string;
  objectKey: string;
  contentType: string;
  reportType?: string;
  reportDate?: Date;
  signedUrl?: string;
  previewUrl?: string;
}

export interface ProcessedImageData {
  id: string;
  originalFile: FileReference;
  extractedData: any;
  confidence: number;
  processingNotes: string[];
}

// ================================
// UTILITY TYPES
// ================================

export interface DateRange {
  start: Date;
  end: Date;
}

export interface KeyMetric {
  name: string;
  value: number;
  unit: string;
  isAbnormal: boolean;
  referenceRange?: ReferenceRange;
  trend?: 'up' | 'down' | 'stable';
}

export interface CriticalValue {
  metric: string;
  value: number;
  unit: string;
  severity: 'high' | 'critical';
  referenceRange: ReferenceRange;
  date: Date;
}

export interface ReferenceRange {
  min?: number;
  max?: number;
  unit: string;
  source?: string;
}

export interface ExtractedMetric {
  id: string;
  name: string;
  value?: number;
  unit?: string;
  textValue?: string;
  category?: string;
  validationStatus?: string;
  wasConverted: boolean;
  originalValue?: number;
  originalUnit?: string;
}

export interface QualityScore {
  overallScore: number;
  completeness: number;
  accuracy: number;
  confidence: number;
}

export interface WatermarkData {
  patientName: string;
  shareDate: Date;
  shareToken: string;
  accessedBy?: string;
}

export interface SignificantChange {
  metric: string;
  date: Date;
  oldValue: number;
  newValue: number;
  percentChange: number;
  significance: 'minor' | 'moderate' | 'major';
}

export interface RiskFactor {
  name: string;
  level: 'low' | 'medium' | 'high';
  description: string;
  impact: number;
}

// ================================
// ERROR TYPES
// ================================

export enum ShareLinkError {
  LINK_NOT_FOUND = 'LINK_NOT_FOUND',
  LINK_EXPIRED = 'LINK_EXPIRED',
  MAX_VIEWS_EXCEEDED = 'MAX_VIEWS_EXCEEDED',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  EMAIL_NOT_AUTHORIZED = 'EMAIL_NOT_AUTHORIZED',
  IP_NOT_AUTHORIZED = 'IP_NOT_AUTHORIZED',
  LINK_REVOKED = 'LINK_REVOKED',
  DATA_NOT_AVAILABLE = 'DATA_NOT_AVAILABLE'
}

export interface ErrorResponse {
  message: string;
  action: 'contact_patient' | 'retry' | 'check_credentials';
  severity: 'info' | 'warning' | 'error';
}

// ================================
// API RESPONSE TYPES
// ================================

export interface ShareLinkCreateResponse {
  success: boolean;
  shareLink?: ShareLinkResult;
  error?: string;
}

export interface ShareLinkAccessResponse {
  success: boolean;
  medicalData?: SharedMedicalData;
  shareInfo?: ShareLinkData;
  error?: ShareLinkError;
  requiresPassword?: boolean;
}

export interface ShareLinkListResponse {
  success: boolean;
  shareLinks?: ShareLinkData[];
  error?: string;
}

// ================================
// COMPONENT PROPS TYPES
// ================================

export interface ShareCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShareCreated: (shareLink: ShareLinkResult) => void;
  userId: string;
  availableReports: MedicalReport[];
}

export interface ShareManagementPanelProps {
  userId: string;
  shareLinks: ShareLinkData[];
  onRevoke: (linkId: string) => void;
  onExtend: (linkId: string, days: number) => void;
  onCopyLink: (url: string) => void;
}

export interface ProfessionalMedicalViewProps {
  shareToken: string;
  medicalData: SharedMedicalData;
  shareInfo: ShareLinkData;
  onExportPDF: () => void;
  onPrint: () => void;
  onDownloadData: () => void;
}