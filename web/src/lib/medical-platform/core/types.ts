/**
 * CORE MEDICAL DATA TYPES
 * Enterprise-grade type system for medical data
 */

// ================================
// CORE MEDICAL VALUE TYPES
// ================================

export type MedicalValueID = string;
export type MetricName = string;
export type UnitName = string;
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'reject';
export type ValidationStatus = 'valid' | 'invalid' | 'warning' | 'error';
export type ProcessingStage = 'raw' | 'extracted' | 'normalized' | 'validated' | 'stored';

// Core medical value with full audit trail
export interface MedicalValue {
  // Identity
  id: MedicalValueID;
  metric: MetricName;
  
  // Value data
  raw: {
    value: number;
    unit: UnitName | null;
    source: 'ai_extraction' | 'manual_entry' | 'import' | 'api';
    extractedText?: string;
  };
  
  // Processed data
  processed: {
    value: number;
    unit: UnitName;
    confidence: ConfidenceLevel;
    processingMethod: 'explicit_unit' | 'pattern_match' | 'range_inference' | 'ai_suggestion';
    conversionFactor: number;
  };
  
  // Validation results
  validation: {
    status: ValidationStatus;
    isWithinNormalRange: boolean;
    isWithinCriticalRange: boolean;
    clinicalStatus: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
    warnings: string[];
    suggestions: string[];
  };
  
  // Metadata
  metadata: {
    reportId: string;
    userId: string;
    timestamp: Date;
    processingStage: ProcessingStage;
    processingVersion: string;
    auditTrail: ProcessingStep[];
  };
}

// Processing step for audit trail
export interface ProcessingStep {
  stage: ProcessingStage;
  timestamp: Date;
  operation: string;
  input: any;
  output: any;
  errors?: string[];
  warnings?: string[];
}

// ================================
// MEDICAL PARAMETER DEFINITIONS
// ================================

export interface MedicalParameter {
  // Identity
  metric: MetricName;
  name: string;
  description: string;
  category: MedicalCategory;
  priority: 1 | 2 | 3;
  
  // Medical properties
  clinical: {
    normalRange: Range;
    criticalRange: Range;
    significance: string;
    relatedConditions: string[];
    meldComponent: boolean;
    childPughComponent: boolean;
  };
  
  // Unit system
  units: {
    standard: UnitName;
    alternatives: UnitDefinition[];
    conversionRules: ConversionRule[];
  };
  
  // Processing rules
  processing: {
    patterns: ValuePattern[];
    validationRules: ValidationRule[];
    qualityChecks: QualityCheck[];
  };
  
  // Synonyms and aliases
  aliases: {
    names: string[];
    abbreviations: string[];
    alternativeSpellings: string[];
  };
}

// Supporting types
export type MedicalCategory = 
  | 'liver_function' 
  | 'kidney_function' 
  | 'blood_count' 
  | 'protein' 
  | 'electrolytes' 
  | 'coagulation' 
  | 'enzymes';

export interface Range {
  min: number;
  max: number;
}

export interface UnitDefinition {
  name: UnitName;
  conversionFactor: number;
  region: 'US' | 'International' | 'India' | 'Global';
  description: string;
  isCommon: boolean;
}

export interface ConversionRule {
  from: UnitName;
  to: UnitName;
  factor: number;
  condition?: (value: number) => boolean;
}

export interface ValuePattern {
  range: Range;
  likelyUnit: UnitName;
  confidence: number;
  description: string;
  examples: number[];
}

export interface ValidationRule {
  name: string;
  check: (value: MedicalValue) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
}

export interface QualityCheck {
  name: string;
  description: string;
  check: (value: MedicalValue) => QualityResult;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  suggestion?: string;
}

export interface QualityResult {
  score: number; // 0-1
  issues: string[];
  recommendations: string[];
}

// ================================
// REPORT AND DATA MANAGEMENT
// ================================

export interface MedicalReport {
  // Identity
  id: string;
  userId: string;
  
  // Report metadata
  metadata: {
    type: 'lab_report' | 'imaging' | 'clinical_note' | 'manual_entry';
    date: Date;
    source: string;
    version: number;
  };
  
  // Medical values
  values: Map<MetricName, MedicalValue>;
  
  // Quality metrics
  quality: {
    overallScore: number;
    completeness: number;
    confidence: number;
    issues: QualityIssue[];
  };
  
  // Processing status
  processing: {
    status: 'pending' | 'processing' | 'completed' | 'error';
    steps: ProcessingStep[];
    errors: string[];
    warnings: string[];
  };
}

export interface QualityIssue {
  type: 'missing_data' | 'invalid_value' | 'unit_mismatch' | 'outlier' | 'duplicate';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  affectedValues: MedicalValueID[];
}

// ================================
// PLATFORM CONFIGURATION
// ================================

export interface PlatformConfig {
  // Processing settings
  processing: {
    strictMode: boolean;
    autoCorrection: boolean;
    confidenceThreshold: number;
    validationLevel: 'strict' | 'normal' | 'lenient';
  };
  
  // Quality settings
  quality: {
    minimumConfidence: number;
    requiredFields: MetricName[];
    outlierDetection: boolean;
    duplicateHandling: 'merge' | 'replace' | 'keep_all' | 'ask_user';
  };
  
  // Regional settings
  regional: {
    primaryUnits: 'US' | 'International' | 'Mixed';
    timeZone: string;
    locale: string;
  };
  
  // Compliance
  compliance: {
    auditLevel: 'basic' | 'detailed' | 'comprehensive';
    dataRetention: number; // days
    encryptionRequired: boolean;
  };
}

// ================================
// API AND INTEGRATION TYPES
// ================================

export interface ProcessingRequest {
  source: 'ai_extraction' | 'manual_entry' | 'file_upload' | 'api';
  data: any;
  options?: Partial<PlatformConfig>;
}

export interface ProcessingResponse {
  success: boolean;
  report: MedicalReport;
  summary: ProcessingSummary;
  errors: string[];
  warnings: string[];
}

export interface ProcessingSummary {
  valuesProcessed: number;
  valuesValid: number;
  averageConfidence: number;
  processingTime: number;
  qualityScore: number;
}

// ================================
// CHART AND VISUALIZATION TYPES
// ================================

export interface ChartDataPoint {
  date: Date;
  value: number;
  confidence: ConfidenceLevel;
  source: string;
  metadata: {
    reportId: string;
    originalValue: number;
    originalUnit: string;
  };
}

export interface ChartSeries {
  metric: MetricName;
  data: ChartDataPoint[];
  statistics: {
    count: number;
    min: number;
    max: number;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  };
  quality: {
    completeness: number;
    reliability: number;
    gaps: Array<{ start: Date; end: Date }>;
  };
}
