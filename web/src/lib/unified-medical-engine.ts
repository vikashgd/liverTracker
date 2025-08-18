/**
 * UNIFIED MEDICAL DATA PROCESSING ENGINE
 * Production-level system for handling all lab parameters consistently
 * 
 * This replaces the fragmented approach with a single source of truth
 */

import { CanonicalMetric } from "./metrics";

// ================================
// CORE TYPES
// ================================

export interface MedicalParameter {
  metric: CanonicalMetric;
  displayName: string;
  description: string;
  category: 'liver_function' | 'kidney_function' | 'blood_count' | 'protein' | 'electrolytes' | 'coagulation' | 'enzymes';
  
  // Unit system
  standardUnit: string;
  unitSystem: {
    [unit: string]: {
      factor: number; // Conversion factor to standard unit
      isStandard: boolean;
      isCommon: boolean;
      region: 'US' | 'International' | 'India' | 'Global';
      description?: string;
    };
  };
  
  // Reference ranges (in standard units)
  normalRange: { min: number; max: number };
  
  // Clinical significance thresholds
  clinicalRanges: {
    criticalLow: number;
    low: number;
    high: number;
    criticalHigh: number;
  };
  
  // Value patterns for intelligent detection
  patterns: Array<{
    range: { min: number; max: number };
    likelyUnit: string;
    confidence: number;
    description: string;
  }>;
  
  // Synonyms and alternative names
  synonyms: string[];
  
  // MELD/Clinical scoring relevance
  meldComponent?: boolean;
  childPughComponent?: boolean;
  priority: 1 | 2 | 3; // Clinical importance
}

export interface ProcessedMedicalValue {
  originalValue: number;
  originalUnit: string | null;
  
  normalizedValue: number;
  standardUnit: string;
  
  confidence: 'high' | 'medium' | 'low' | 'reject';
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
  
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  
  metadata: {
    conversionFactor: number;
    detectedUnit: string;
    patternMatch: string | null;
    processingMethod: 'explicit_unit' | 'pattern_match' | 'range_inference' | 'fallback';
  };
}

export interface MedicalReport {
  reportId: string;
  reportDate: Date;
  reportType: string;
  parameters: Map<CanonicalMetric, ProcessedMedicalValue>;
  
  // Derived scores
  meldScore?: {
    score: number;
    naScore?: number;
    risk: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  
  // Quality metrics
  overallConfidence: 'high' | 'medium' | 'low';
  dataQuality: number; // 0-1 score
  completeness: number; // 0-1 score
}

// ================================
// UNIFIED PARAMETER DEFINITIONS
// ================================

export const UNIFIED_MEDICAL_PARAMETERS: Record<CanonicalMetric, MedicalParameter> = {
  // LIVER FUNCTION TESTS
  ALT: {
    metric: 'ALT',
    displayName: 'ALT (Alanine Aminotransferase)',
    description: 'Liver enzyme that indicates liver cell damage',
    category: 'liver_function',
    standardUnit: 'U/L',
    unitSystem: {
      'U/L': { factor: 1, isStandard: true, isCommon: true, region: 'Global' },
      'IU/L': { factor: 1, isStandard: false, isCommon: true, region: 'International', description: 'International Units per Liter' },
      'UI/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
      'units/L': { factor: 1, isStandard: false, isCommon: false, region: 'Global' },
    },
    normalRange: { min: 7, max: 56 },
    clinicalRanges: {
      criticalLow: 0,
      low: 7,
      high: 56,
      criticalHigh: 300
    },
    patterns: [
      { range: { min: 5, max: 200 }, likelyUnit: 'U/L', confidence: 0.9, description: 'Typical ALT range' },
      { range: { min: 200, max: 1000 }, likelyUnit: 'U/L', confidence: 0.8, description: 'Elevated ALT' },
      { range: { min: 0.01, max: 5 }, likelyUnit: 'U/L', confidence: 0.3, description: 'Unlikely low ALT' },
    ],
    synonyms: ['SGPT', 'Alanine Aminotransferase', 'ALT (SGPT)', 'Serum ALT'],
    meldComponent: false,
    childPughComponent: false,
    priority: 1
  },

  AST: {
    metric: 'AST',
    displayName: 'AST (Aspartate Aminotransferase)',
    description: 'Liver enzyme present in liver, heart, and muscle cells',
    category: 'liver_function',
    standardUnit: 'U/L',
    unitSystem: {
      'U/L': { factor: 1, isStandard: true, isCommon: true, region: 'Global' },
      'IU/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
      'UI/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
      'units/L': { factor: 1, isStandard: false, isCommon: false, region: 'Global' },
    },
    normalRange: { min: 10, max: 40 },
    clinicalRanges: {
      criticalLow: 0,
      low: 10,
      high: 40,
      criticalHigh: 300
    },
    patterns: [
      { range: { min: 5, max: 150 }, likelyUnit: 'U/L', confidence: 0.9, description: 'Typical AST range' },
      { range: { min: 150, max: 1000 }, likelyUnit: 'U/L', confidence: 0.8, description: 'Elevated AST' },
    ],
    synonyms: ['SGOT', 'Aspartate Aminotransferase', 'AST (SGOT)', 'Serum AST'],
    meldComponent: false,
    childPughComponent: false,
    priority: 1
  },

  Platelets: {
    metric: 'Platelets',
    displayName: 'Platelet Count',
    description: 'Blood clotting cells essential for hemostasis',
    category: 'blood_count',
    standardUnit: '10^9/L',
    unitSystem: {
      '10^9/L': { factor: 1, isStandard: true, isCommon: true, region: 'International' },
      '×10³/μL': { factor: 1, isStandard: false, isCommon: true, region: 'US' },
      '×10⁹/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
      'K/μL': { factor: 1, isStandard: false, isCommon: true, region: 'US' },
      'thou/μL': { factor: 1, isStandard: false, isCommon: false, region: 'US' },
      '/μL': { factor: 0.001, isStandard: false, isCommon: true, region: 'Global', description: 'Raw count per microliter' },
      '/cu mm': { factor: 0.001, isStandard: false, isCommon: true, region: 'India' },
      'cells/μL': { factor: 0.001, isStandard: false, isCommon: false, region: 'Global' },
      'lakhs/μL': { factor: 100, isStandard: false, isCommon: true, region: 'India', description: 'Indian lakh units (1 lakh = 100,000)' },
      'lakhs/cu mm': { factor: 100, isStandard: false, isCommon: true, region: 'India' },
      'Lakhs/Cumm': { factor: 100, isStandard: false, isCommon: true, region: 'India' },
    },
    normalRange: { min: 150, max: 450 },
    clinicalRanges: {
      criticalLow: 20,
      low: 150,
      high: 450,
      criticalHigh: 1000
    },
    patterns: [
      { range: { min: 50, max: 1000 }, likelyUnit: '10^9/L', confidence: 0.95, description: 'Standard platelet count range' },
      { range: { min: 50000, max: 1000000 }, likelyUnit: '/μL', confidence: 0.9, description: 'Raw count format' },
      { range: { min: 0.5, max: 10 }, likelyUnit: 'lakhs/μL', confidence: 0.85, description: 'Indian lakh format' },
      { range: { min: 5000, max: 100000 }, likelyUnit: '/μL', confidence: 0.7, description: 'Possible raw count' },
      { range: { min: 1, max: 2000 }, likelyUnit: '10^9/L', confidence: 0.6, description: 'Broad platelet range' },
    ],
    synonyms: ['PLT', 'Platelet Count', 'Platelets', 'PC'],
    meldComponent: false,
    childPughComponent: false,
    priority: 1
  },

  Bilirubin: {
    metric: 'Bilirubin',
    displayName: 'Total Bilirubin',
    description: 'Breakdown product of red blood cells, indicates liver function',
    category: 'liver_function',
    standardUnit: 'mg/dL',
    unitSystem: {
      'mg/dL': { factor: 1, isStandard: true, isCommon: true, region: 'US' },
      'mg/dl': { factor: 1, isStandard: false, isCommon: true, region: 'US' },
      'μmol/L': { factor: 0.0585, isStandard: false, isCommon: true, region: 'International', description: 'Micromoles per liter' },
      'umol/L': { factor: 0.0585, isStandard: false, isCommon: true, region: 'International' },
      'micromol/L': { factor: 0.0585, isStandard: false, isCommon: false, region: 'International' },
    },
    normalRange: { min: 0.1, max: 1.2 },
    clinicalRanges: {
      criticalLow: 0,
      low: 0.1,
      high: 1.2,
      criticalHigh: 20
    },
    patterns: [
      { range: { min: 0.1, max: 50 }, likelyUnit: 'mg/dL', confidence: 0.9, description: 'Typical bilirubin range in mg/dL' },
      { range: { min: 1, max: 500 }, likelyUnit: 'μmol/L', confidence: 0.85, description: 'Typical bilirubin range in μmol/L' },
    ],
    synonyms: ['Total Bilirubin', 'T.Bil', 'TBIL', 'Bilirubin Total'],
    meldComponent: true,
    childPughComponent: true,
    priority: 1
  },

  Albumin: {
    metric: 'Albumin',
    displayName: 'Albumin',
    description: 'Major protein made by the liver, indicates synthetic function',
    category: 'protein',
    standardUnit: 'g/dL',
    unitSystem: {
      'g/dL': { factor: 1, isStandard: true, isCommon: true, region: 'US' },
      'g/dl': { factor: 1, isStandard: false, isCommon: true, region: 'US' },
      'g/L': { factor: 0.1, isStandard: false, isCommon: true, region: 'International', description: 'Grams per liter' },
    },
    normalRange: { min: 3.5, max: 5.0 },
    clinicalRanges: {
      criticalLow: 2.0,
      low: 3.5,
      high: 5.0,
      criticalHigh: 6.0
    },
    patterns: [
      { range: { min: 2, max: 6 }, likelyUnit: 'g/dL', confidence: 0.9, description: 'Typical albumin range in g/dL' },
      { range: { min: 20, max: 60 }, likelyUnit: 'g/L', confidence: 0.85, description: 'Typical albumin range in g/L' },
    ],
    synonyms: ['Serum Albumin', 'ALB'],
    meldComponent: false,
    childPughComponent: true,
    priority: 1
  },

  Creatinine: {
    metric: 'Creatinine',
    displayName: 'Serum Creatinine',
    description: 'Waste product filtered by kidneys, indicates kidney function',
    category: 'kidney_function',
    standardUnit: 'mg/dL',
    unitSystem: {
      'mg/dL': { factor: 1, isStandard: true, isCommon: true, region: 'US' },
      'mg/dl': { factor: 1, isStandard: false, isCommon: true, region: 'US' },
      'μmol/L': { factor: 0.0113, isStandard: false, isCommon: true, region: 'International' },
      'umol/L': { factor: 0.0113, isStandard: false, isCommon: true, region: 'International' },
      'micromol/L': { factor: 0.0113, isStandard: false, isCommon: false, region: 'International' },
    },
    normalRange: { min: 0.6, max: 1.2 },
    clinicalRanges: {
      criticalLow: 0.1,
      low: 0.6,
      high: 1.2,
      criticalHigh: 10.0
    },
    patterns: [
      { range: { min: 0.3, max: 15 }, likelyUnit: 'mg/dL', confidence: 0.9, description: 'Typical creatinine range in mg/dL' },
      { range: { min: 30, max: 1500 }, likelyUnit: 'μmol/L', confidence: 0.85, description: 'Typical creatinine range in μmol/L' },
    ],
    synonyms: ['Serum Creatinine', 'SCr', 'Creat', 'S.Creatinine'],
    meldComponent: true,
    childPughComponent: false,
    priority: 1
  },

  INR: {
    metric: 'INR',
    displayName: 'INR (International Normalized Ratio)',
    description: 'Standardized measure of blood clotting time',
    category: 'coagulation',
    standardUnit: 'ratio',
    unitSystem: {
      'ratio': { factor: 1, isStandard: true, isCommon: true, region: 'Global' },
      '': { factor: 1, isStandard: false, isCommon: true, region: 'Global' },
      'dimensionless': { factor: 1, isStandard: false, isCommon: false, region: 'Global' },
    },
    normalRange: { min: 0.8, max: 1.1 },
    clinicalRanges: {
      criticalLow: 0.5,
      low: 0.8,
      high: 1.1,
      criticalHigh: 5.0
    },
    patterns: [
      { range: { min: 0.5, max: 8 }, likelyUnit: 'ratio', confidence: 0.95, description: 'Standard INR range' },
    ],
    synonyms: ['PT INR', 'International Normalized Ratio'],
    meldComponent: true,
    childPughComponent: true,
    priority: 1
  },

  ALP: {
    metric: 'ALP',
    displayName: 'ALP (Alkaline Phosphatase)',
    description: 'Enzyme found in liver, bone, and other tissues',
    category: 'enzymes',
    standardUnit: 'U/L',
    unitSystem: {
      'U/L': { factor: 1, isStandard: true, isCommon: true, region: 'Global' },
      'IU/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
      'UI/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
    },
    normalRange: { min: 44, max: 147 },
    clinicalRanges: {
      criticalLow: 0,
      low: 44,
      high: 147,
      criticalHigh: 500
    },
    patterns: [
      { range: { min: 20, max: 800 }, likelyUnit: 'U/L', confidence: 0.9, description: 'Typical ALP range' },
    ],
    synonyms: ['Alkaline Phosphatase', 'Alk Phos'],
    meldComponent: false,
    childPughComponent: false,
    priority: 2
  },

  GGT: {
    metric: 'GGT',
    displayName: 'GGT (Gamma-Glutamyl Transferase)',
    description: 'Liver enzyme sensitive to bile duct problems',
    category: 'liver_function',
    standardUnit: 'U/L',
    unitSystem: {
      'U/L': { factor: 1, isStandard: true, isCommon: true, region: 'Global' },
      'IU/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
      'UI/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
    },
    normalRange: { min: 9, max: 48 },
    clinicalRanges: {
      criticalLow: 0,
      low: 9,
      high: 48,
      criticalHigh: 300
    },
    patterns: [
      { range: { min: 5, max: 500 }, likelyUnit: 'U/L', confidence: 0.9, description: 'Typical GGT range' },
    ],
    synonyms: ['Gamma GT', 'γ-GT', 'Gamma-Glutamyl Transferase'],
    meldComponent: false,
    childPughComponent: false,
    priority: 2
  },

  TotalProtein: {
    metric: 'TotalProtein',
    displayName: 'Total Protein',
    description: 'Sum of all proteins in blood serum',
    category: 'protein',
    standardUnit: 'g/dL',
    unitSystem: {
      'g/dL': { factor: 1, isStandard: true, isCommon: true, region: 'US' },
      'g/dl': { factor: 1, isStandard: false, isCommon: true, region: 'US' },
      'g/L': { factor: 0.1, isStandard: false, isCommon: true, region: 'International' },
    },
    normalRange: { min: 6.0, max: 8.3 },
    clinicalRanges: {
      criticalLow: 4.0,
      low: 6.0,
      high: 8.3,
      criticalHigh: 10.0
    },
    patterns: [
      { range: { min: 4, max: 12 }, likelyUnit: 'g/dL', confidence: 0.9, description: 'Typical total protein range in g/dL' },
      { range: { min: 40, max: 120 }, likelyUnit: 'g/L', confidence: 0.85, description: 'Typical total protein range in g/L' },
    ],
    synonyms: ['Serum Protein', 'TP', 'Total Serum Protein'],
    meldComponent: false,
    childPughComponent: false,
    priority: 2
  },

  Sodium: {
    metric: 'Sodium',
    displayName: 'Sodium',
    description: 'Major electrolyte important for MELD-Na calculation',
    category: 'electrolytes',
    standardUnit: 'mEq/L',
    unitSystem: {
      'mEq/L': { factor: 1, isStandard: true, isCommon: true, region: 'US' },
      'mmol/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
    },
    normalRange: { min: 136, max: 145 },
    clinicalRanges: {
      criticalLow: 120,
      low: 136,
      high: 145,
      criticalHigh: 160
    },
    patterns: [
      { range: { min: 120, max: 160 }, likelyUnit: 'mEq/L', confidence: 0.95, description: 'Standard sodium range' },
    ],
    synonyms: ['Na', 'Serum Sodium'],
    meldComponent: true,
    childPughComponent: false,
    priority: 2
  },

  Potassium: {
    metric: 'Potassium',
    displayName: 'Potassium',
    description: 'Essential electrolyte for cellular function',
    category: 'electrolytes',
    standardUnit: 'mEq/L',
    unitSystem: {
      'mEq/L': { factor: 1, isStandard: true, isCommon: true, region: 'US' },
      'mmol/L': { factor: 1, isStandard: false, isCommon: true, region: 'International' },
    },
    normalRange: { min: 3.5, max: 5.1 },
    clinicalRanges: {
      criticalLow: 2.5,
      low: 3.5,
      high: 5.1,
      criticalHigh: 6.5
    },
    patterns: [
      { range: { min: 2, max: 8 }, likelyUnit: 'mEq/L', confidence: 0.95, description: 'Standard potassium range' },
    ],
    synonyms: ['K', 'Serum Potassium'],
    meldComponent: false,
    childPughComponent: false,
    priority: 3
  }
};

// ================================
// UNIFIED PROCESSING ENGINE
// ================================

export class UnifiedMedicalEngine {
  
  /**
   * Process a single medical value with full intelligence
   */
  static processValue(
    metric: CanonicalMetric, 
    value: number, 
    providedUnit?: string | null
  ): ProcessedMedicalValue {
    const parameter = UNIFIED_MEDICAL_PARAMETERS[metric];
    
    if (!parameter) {
      return this.createErrorResult(metric, value, providedUnit || null, 'Unknown medical parameter');
    }

    // 1. Try explicit unit conversion first
    if (providedUnit && parameter.unitSystem[providedUnit]) {
      return this.processWithExplicitUnit(parameter, value, providedUnit);
    }

    // 2. Intelligent pattern matching
    const patternResult = this.processWithPatternMatching(parameter, value);
    if (patternResult.confidence !== 'reject') {
      return patternResult;
    }

    // 3. Range-based inference
    const rangeResult = this.processWithRangeInference(parameter, value);
    if (rangeResult.confidence !== 'reject') {
      return rangeResult;
    }

    // 4. Fallback: mark as suspicious
    return this.createSuspiciousResult(parameter, value, providedUnit || null);
  }

  /**
   * Process explicit unit conversion
   */
  private static processWithExplicitUnit(
    parameter: MedicalParameter, 
    value: number, 
    unit: string
  ): ProcessedMedicalValue {
    const unitInfo = parameter.unitSystem[unit];
    const normalizedValue = value * unitInfo.factor;
    
    return {
      originalValue: value,
      originalUnit: unit,
      normalizedValue,
      standardUnit: parameter.standardUnit,
      confidence: unitInfo.isStandard ? 'high' : 'high',
      status: this.determineStatus(parameter, normalizedValue),
      isValid: this.validateValue(parameter, normalizedValue),
      warnings: [],
      suggestions: [],
      metadata: {
        conversionFactor: unitInfo.factor,
        detectedUnit: unit,
        patternMatch: null,
        processingMethod: 'explicit_unit'
      }
    };
  }

  /**
   * Intelligent pattern matching
   */
  private static processWithPatternMatching(
    parameter: MedicalParameter, 
    value: number
  ): ProcessedMedicalValue {
    let bestMatch: typeof parameter.patterns[0] | null = null;
    let bestConfidence = 0;

    for (const pattern of parameter.patterns) {
      if (value >= pattern.range.min && value <= pattern.range.max && pattern.confidence > bestConfidence) {
        bestMatch = pattern;
        bestConfidence = pattern.confidence;
      }
    }

    if (!bestMatch) {
      return this.createErrorResult(parameter.metric, value, null, 'No pattern match found');
    }

    const unitInfo = parameter.unitSystem[bestMatch.likelyUnit];
    const normalizedValue = value * unitInfo.factor;
    
    return {
      originalValue: value,
      originalUnit: null,
      normalizedValue,
      standardUnit: parameter.standardUnit,
      confidence: bestConfidence > 0.8 ? 'high' : bestConfidence > 0.6 ? 'medium' : 'low',
      status: this.determineStatus(parameter, normalizedValue),
      isValid: this.validateValue(parameter, normalizedValue),
      warnings: bestConfidence < 0.7 ? [`Low confidence pattern match (${(bestConfidence * 100).toFixed(0)}%)`] : [],
      suggestions: [`Detected as ${bestMatch.likelyUnit} - ${bestMatch.description}`],
      metadata: {
        conversionFactor: unitInfo.factor,
        detectedUnit: bestMatch.likelyUnit,
        patternMatch: bestMatch.description,
        processingMethod: 'pattern_match'
      }
    };
  }

  /**
   * Range-based inference as fallback
   */
  private static processWithRangeInference(
    parameter: MedicalParameter, 
    value: number
  ): ProcessedMedicalValue {
    // Try each unit system to see if any gives a normal value
    for (const [unit, unitInfo] of Object.entries(parameter.unitSystem)) {
      const normalizedValue = value * unitInfo.factor;
      
      if (normalizedValue >= parameter.normalRange.min && normalizedValue <= parameter.normalRange.max) {
        return {
          originalValue: value,
          originalUnit: null,
          normalizedValue,
          standardUnit: parameter.standardUnit,
          confidence: 'medium',
          status: 'normal',
          isValid: true,
          warnings: ['Inferred unit based on normal range'],
          suggestions: [`Assumed ${unit} to achieve normal range`],
          metadata: {
            conversionFactor: unitInfo.factor,
            detectedUnit: unit,
            patternMatch: null,
            processingMethod: 'range_inference'
          }
        };
      }
    }

    return this.createErrorResult(parameter.metric, value, null, 'Could not infer appropriate unit');
  }

  /**
   * Determine clinical status
   */
  private static determineStatus(parameter: MedicalParameter, normalizedValue: number): ProcessedMedicalValue['status'] {
    if (normalizedValue <= parameter.clinicalRanges.criticalLow) return 'critical_low';
    if (normalizedValue < parameter.normalRange.min) return 'low';
    if (normalizedValue > parameter.clinicalRanges.criticalHigh) return 'critical_high';
    if (normalizedValue > parameter.normalRange.max) return 'high';
    return 'normal';
  }

  /**
   * Validate if value is clinically reasonable
   */
  private static validateValue(parameter: MedicalParameter, normalizedValue: number): boolean {
    return normalizedValue >= parameter.clinicalRanges.criticalLow && 
           normalizedValue <= parameter.clinicalRanges.criticalHigh;
  }

  /**
   * Create error result
   */
  private static createErrorResult(
    metric: CanonicalMetric, 
    value: number, 
    unit: string | null, 
    error: string
  ): ProcessedMedicalValue {
    return {
      originalValue: value,
      originalUnit: unit,
      normalizedValue: value,
      standardUnit: unit || '',
      confidence: 'reject',
      status: 'normal',
      isValid: false,
      warnings: [error],
      suggestions: [],
      metadata: {
        conversionFactor: 1,
        detectedUnit: unit || 'unknown',
        patternMatch: null,
        processingMethod: 'fallback'
      }
    };
  }

  /**
   * Create suspicious result for unprocessable values
   */
  private static createSuspiciousResult(
    parameter: MedicalParameter, 
    value: number, 
    unit: string | null
  ): ProcessedMedicalValue {
    return {
      originalValue: value,
      originalUnit: unit,
      normalizedValue: value,
      standardUnit: parameter.standardUnit,
      confidence: 'reject',
      status: 'normal',
      isValid: false,
      warnings: ['Value does not match any expected pattern', 'Manual review recommended'],
      suggestions: [`Expected range for ${parameter.metric}: ${parameter.normalRange.min}-${parameter.normalRange.max} ${parameter.standardUnit}`],
      metadata: {
        conversionFactor: 1,
        detectedUnit: unit || 'unknown',
        patternMatch: null,
        processingMethod: 'fallback'
      }
    };
  }

  /**
   * Process multiple values into a complete medical report
   */
  static processReport(
    reportData: Array<{ metric: CanonicalMetric; value: number; unit?: string | null }>,
    reportId: string,
    reportDate: Date,
    reportType: string
  ): MedicalReport {
    const parameters = new Map<CanonicalMetric, ProcessedMedicalValue>();
    
    // Process each parameter
    for (const { metric, value, unit } of reportData) {
      const processed = this.processValue(metric, value, unit);
      parameters.set(metric, processed);
    }

    // Calculate overall quality metrics
    const validParameterCount = Array.from(parameters.values()).filter(p => p.isValid).length;
    const highConfidenceCount = Array.from(parameters.values()).filter(p => p.confidence === 'high').length;
    const totalCount = parameters.size;

    const dataQuality = totalCount > 0 ? (validParameterCount + highConfidenceCount) / (totalCount * 2) : 0;
    const completeness = totalCount / Object.keys(UNIFIED_MEDICAL_PARAMETERS).length;
    
    const overallConfidence: 'high' | 'medium' | 'low' = 
      dataQuality > 0.8 ? 'high' : 
      dataQuality > 0.5 ? 'medium' : 'low';

    // Calculate MELD score if possible
    const meldScore = this.calculateMELDFromReport(parameters);

    return {
      reportId,
      reportDate,
      reportType,
      parameters,
      meldScore,
      overallConfidence,
      dataQuality,
      completeness
    };
  }

  /**
   * Calculate MELD score from processed parameters
   */
  private static calculateMELDFromReport(parameters: Map<CanonicalMetric, ProcessedMedicalValue>) {
    const bilirubin = parameters.get('Bilirubin');
    const creatinine = parameters.get('Creatinine');
    const inr = parameters.get('INR');
    const sodium = parameters.get('Sodium');

    if (!bilirubin?.isValid || !creatinine?.isValid || !inr?.isValid) {
      return undefined;
    }

    // Calculate MELD-Na score
    const meldScore = 3.78 * Math.log(bilirubin.normalizedValue) +
                     11.2 * Math.log(inr.normalizedValue) +
                     9.57 * Math.log(creatinine.normalizedValue) +
                     6.43;

    const cappedScore = Math.max(6, Math.min(40, Math.round(meldScore)));

    let naScore = cappedScore;
    if (sodium?.isValid) {
      const naValue = Math.max(125, Math.min(137, sodium.normalizedValue));
      naScore = cappedScore + 1.32 * (137 - naValue) - (0.033 * cappedScore * (137 - naValue));
      naScore = Math.max(6, Math.min(40, Math.round(naScore)));
    }

    const risk: 'Low' | 'Medium' | 'High' | 'Critical' = 
      naScore < 15 ? 'Low' :
      naScore < 25 ? 'Medium' :
      naScore < 35 ? 'High' : 'Critical';

    return {
      score: cappedScore,
      naScore: sodium?.isValid ? naScore : undefined,
      risk
    };
  }

  /**
   * Get chart data with intelligent filtering
   */
  static getChartData(
    rawData: Array<{ metric: CanonicalMetric; value: number; unit?: string | null; date: string; reportId: string }>
  ): Map<CanonicalMetric, Array<{ date: string; value: number; confidence: string; reportId: string }>> {
    const chartData = new Map<CanonicalMetric, Array<{ date: string; value: number; confidence: string; reportId: string }>>();

    // Group by metric
    const groupedData = new Map<CanonicalMetric, typeof rawData>();
    for (const item of rawData) {
      if (!groupedData.has(item.metric)) {
        groupedData.set(item.metric, []);
      }
      groupedData.get(item.metric)!.push(item);
    }

    // Process each metric
    for (const [metric, values] of groupedData) {
      const processedValues: Array<{ date: string; value: number; confidence: string; reportId: string }> = [];

      for (const item of values) {
        const processed = this.processValue(metric, item.value, item.unit);
        
        // Include data based on confidence and validity
        if (processed.confidence === 'high' || 
            processed.confidence === 'medium' || 
            (processed.confidence === 'low' && processed.isValid)) {
          
          processedValues.push({
            date: item.date,
            value: processed.normalizedValue,
            confidence: processed.confidence,
            reportId: item.reportId
          });
        }
      }

      // Sort by date
      processedValues.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      chartData.set(metric, processedValues);
    }

    return chartData;
  }
}
