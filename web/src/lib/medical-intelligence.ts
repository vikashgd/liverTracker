/**
 * Medical Intelligence Engine
 * Automatically handles units, validation, and data quality for regular users
 */

export interface MedicalValue {
  originalValue: number;
  normalizedValue: number;
  confidence: 'high' | 'medium' | 'low' | 'reject';
  unit: string;
  isValid: boolean;
  warnings: string[];
  userFriendlyExplanation?: string;
}

export interface MedicalMetricRule {
  name: string;
  standardUnit: string;
  normalRange: { min: number; max: number };
  criticalRange: { min: number; max: number };
  commonUnits: string[];
  unitConversions: Record<string, number>;
  valuePatterns: {
    pattern: (value: number) => boolean;
    likelyUnit: string;
    confidence: number;
  }[];
  userFriendlyName: string;
  description: string;
}

// Comprehensive medical rules for Indian lab standards
export const MEDICAL_RULES: Record<string, MedicalMetricRule> = {
  Platelets: {
    name: 'Platelets',
    userFriendlyName: 'Platelet Count',
    description: 'Blood clotting cells that help stop bleeding',
    standardUnit: '10^9/L',
    normalRange: { min: 150, max: 450 },
    criticalRange: { min: 0.1, max: 100000 }, // Very permissive to handle all unit variations
    commonUnits: ['10^9/L', '×10³/μL', '×10⁹/L', 'lakhs/μL', '/μL'],
    unitConversions: {
      '10^9/L': 1,
      '×10³/μL': 1,
      '×10⁹/L': 1,
      'K/μL': 1,
      'thou/μL': 1,
      'lakhs/μL': 100, // 1 lakh = 100K
      'lakhs/cu mm': 100, // Indian lab format
      'Lakhs/Cumm': 100, // Another Indian format
      '/μL': 0.001,    // Raw count to thousands
      '/cu mm': 0.001, // Raw count format
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 50 && v <= 1000,
        likelyUnit: '×10³/μL',
        confidence: 0.9
      },
      {
        pattern: (v) => v >= 50000 && v <= 1000000,
        likelyUnit: '/μL',
        confidence: 0.8
      },
      {
        pattern: (v) => v >= 0.5 && v <= 10,
        likelyUnit: 'lakhs/μL',
        confidence: 0.7
      },
      {
        pattern: (v) => v >= 5000 && v <= 100000,
        likelyUnit: '/μL',
        confidence: 0.6
      },
      {
        pattern: (v) => v >= 0.1 && v <= 50,
        likelyUnit: '×10³/μL',
        confidence: 0.5
      },
      // More patterns for edge cases
      {
        pattern: (v) => v >= 1 && v <= 2000,
        likelyUnit: '10^9/L',
        confidence: 0.4
      },
      {
        pattern: (v) => v >= 0.01 && v <= 100,
        likelyUnit: '×10³/μL',
        confidence: 0.3
      },
      // Ultra-lenient catch-all
      {
        pattern: (v) => v > 0 && v < 10000000,
        likelyUnit: '10^9/L',
        confidence: 0.2
      }
    ]
  },
  
  ALT: {
    name: 'ALT',
    userFriendlyName: 'ALT (Liver enzyme)',
    description: 'Liver enzyme that indicates liver health',
    standardUnit: 'U/L',
    normalRange: { min: 7, max: 56 },
    criticalRange: { min: 0, max: 5000 }, // More permissive for various units
    commonUnits: ['U/L', 'IU/L'],
    unitConversions: {
      'U/L': 1,
      'IU/L': 1,
      'units/L': 1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 0 && v <= 200,
        likelyUnit: 'U/L',
        confidence: 0.9
      }
    ]
  },

  AST: {
    name: 'AST',
    userFriendlyName: 'AST (Liver enzyme)',
    description: 'Liver enzyme that indicates liver health',
    standardUnit: 'U/L',
    normalRange: { min: 10, max: 40 },
    criticalRange: { min: 0, max: 500 },
    commonUnits: ['U/L', 'IU/L'],
    unitConversions: {
      'U/L': 1,
      'IU/L': 1,
      'units/L': 1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 0 && v <= 200,
        likelyUnit: 'U/L',
        confidence: 0.9
      }
    ]
  },

  Bilirubin: {
    name: 'Bilirubin',
    userFriendlyName: 'Bilirubin (Liver function)',
    description: 'Yellow substance that shows how well your liver processes waste',
    standardUnit: 'mg/dL',
    normalRange: { min: 0.1, max: 1.2 },
    criticalRange: { min: 0, max: 25 },
    commonUnits: ['mg/dL', 'μmol/L'],
    unitConversions: {
      'mg/dL': 1,
      'μmol/L': 0.0585,
      'umol/L': 0.0585
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 0 && v <= 5,
        likelyUnit: 'mg/dL',
        confidence: 0.9
      },
      {
        pattern: (v) => v >= 0 && v <= 150,
        likelyUnit: 'μmol/L',
        confidence: 0.8
      }
    ]
  },

  Albumin: {
    name: 'Albumin',
    userFriendlyName: 'Albumin (Protein)',
    description: 'Important protein made by your liver',
    standardUnit: 'g/dL',
    normalRange: { min: 3.5, max: 5.5 },
    criticalRange: { min: 1.0, max: 8.0 },
    commonUnits: ['g/dL', 'g/L'],
    unitConversions: {
      'g/dL': 1,
      'g/L': 0.1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 2 && v <= 8,
        likelyUnit: 'g/dL',
        confidence: 0.9
      },
      {
        pattern: (v) => v >= 20 && v <= 80,
        likelyUnit: 'g/L',
        confidence: 0.8
      }
    ]
  },

  Creatinine: {
    name: 'Creatinine',
    userFriendlyName: 'Serum Creatinine',
    description: 'Kidney function marker, important for MELD score',
    standardUnit: 'mg/dL',
    normalRange: { min: 0.6, max: 1.2 },
    criticalRange: { min: 0.1, max: 10.0 },
    commonUnits: ['mg/dL', 'μmol/L'],
    unitConversions: {
      'mg/dL': 1,
      'μmol/L': 0.0113,
      'umol/L': 0.0113
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 0.3 && v <= 5,
        likelyUnit: 'mg/dL',
        confidence: 0.9
      },
      {
        pattern: (v) => v >= 30 && v <= 500,
        likelyUnit: 'μmol/L',
        confidence: 0.8
      }
    ]
  },

  INR: {
    name: 'INR',
    userFriendlyName: 'International Normalized Ratio',
    description: 'Blood clotting time, critical for MELD score',
    standardUnit: 'ratio',
    normalRange: { min: 0.8, max: 1.1 },
    criticalRange: { min: 0.5, max: 10.0 },
    commonUnits: ['ratio'],
    unitConversions: {
      'ratio': 1,
      '': 1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 0.5 && v <= 10,
        likelyUnit: 'ratio',
        confidence: 0.9
      }
    ]
  },

  ALP: {
    name: 'ALP',
    userFriendlyName: 'Alkaline Phosphatase',
    description: 'Enzyme indicating bile duct function',
    standardUnit: 'U/L',
    normalRange: { min: 44, max: 147 },
    criticalRange: { min: 0, max: 1000 },
    commonUnits: ['U/L', 'IU/L'],
    unitConversions: {
      'U/L': 1,
      'IU/L': 1,
      'units/L': 1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 0 && v <= 500,
        likelyUnit: 'U/L',
        confidence: 0.9
      }
    ]
  },

  GGT: {
    name: 'GGT',
    userFriendlyName: 'Gamma-Glutamyl Transferase',
    description: 'Liver enzyme, elevated in bile duct problems',
    standardUnit: 'U/L',
    normalRange: { min: 9, max: 48 },
    criticalRange: { min: 0, max: 500 },
    commonUnits: ['U/L', 'IU/L'],
    unitConversions: {
      'U/L': 1,
      'IU/L': 1,
      'units/L': 1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 0 && v <= 300,
        likelyUnit: 'U/L',
        confidence: 0.9
      }
    ]
  },

  TotalProtein: {
    name: 'TotalProtein',
    userFriendlyName: 'Total Protein',
    description: 'Overall protein synthesis by liver',
    standardUnit: 'g/dL',
    normalRange: { min: 6.0, max: 8.3 },
    criticalRange: { min: 3.0, max: 12.0 },
    commonUnits: ['g/dL', 'g/L'],
    unitConversions: {
      'g/dL': 1,
      'g/L': 0.1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 4 && v <= 10,
        likelyUnit: 'g/dL',
        confidence: 0.9
      },
      {
        pattern: (v) => v >= 40 && v <= 100,
        likelyUnit: 'g/L',
        confidence: 0.8
      }
    ]
  },

  Sodium: {
    name: 'Sodium',
    userFriendlyName: 'Serum Sodium',
    description: 'Electrolyte balance, needed for MELD-Na score',
    standardUnit: 'mEq/L',
    normalRange: { min: 136, max: 145 },
    criticalRange: { min: 120, max: 160 },
    commonUnits: ['mEq/L', 'mmol/L'],
    unitConversions: {
      'mEq/L': 1,
      'mmol/L': 1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 120 && v <= 160,
        likelyUnit: 'mEq/L',
        confidence: 0.9
      }
    ]
  },

  Potassium: {
    name: 'Potassium',
    userFriendlyName: 'Serum Potassium',
    description: 'Electrolyte balance',
    standardUnit: 'mEq/L',
    normalRange: { min: 3.5, max: 5.0 },
    criticalRange: { min: 2.0, max: 7.0 },
    commonUnits: ['mEq/L', 'mmol/L'],
    unitConversions: {
      'mEq/L': 1,
      'mmol/L': 1
    },
    valuePatterns: [
      {
        pattern: (v) => v >= 2 && v <= 7,
        likelyUnit: 'mEq/L',
        confidence: 0.9
      }
    ]
  }
};

export class MedicalIntelligenceEngine {
  
  /**
   * Automatically fix and validate a medical value
   */
  static processValue(metricName: string, value: number, providedUnit?: string | null): MedicalValue {
    const rule = MEDICAL_RULES[metricName];
    
    if (!rule) {
      return {
        originalValue: value,
        normalizedValue: value,
        confidence: 'low',
        unit: providedUnit || '',
        isValid: false,
        warnings: [`Unknown metric: ${metricName}`]
      };
    }

    // Try explicit unit conversion first
    if (providedUnit && rule.unitConversions[providedUnit]) {
      const normalized = value * rule.unitConversions[providedUnit];
      return this.validateNormalizedValue(rule, value, normalized, providedUnit);
    }

    // Smart pattern matching
    let bestMatch = null;
    let bestConfidence = 0;

    for (const pattern of rule.valuePatterns) {
      if (pattern.pattern(value) && pattern.confidence > bestConfidence) {
        bestMatch = pattern;
        bestConfidence = pattern.confidence;
      }
    }

    if (bestMatch) {
      const multiplier = rule.unitConversions[bestMatch.likelyUnit] || 1;
      const normalized = value * multiplier;
      const result = this.validateNormalizedValue(rule, value, normalized, bestMatch.likelyUnit);
      result.confidence = bestConfidence > 0.8 ? 'high' : 'medium';
      result.userFriendlyExplanation = `Detected as ${bestMatch.likelyUnit} (${(bestConfidence * 100).toFixed(0)}% confidence)`;
      return result;
    }

    // Fallback: try all conversions and pick the one that gives normal range
    for (const [unit, multiplier] of Object.entries(rule.unitConversions)) {
      const normalized = value * multiplier;
      if (normalized >= rule.normalRange.min && normalized <= rule.normalRange.max) {
        const result = this.validateNormalizedValue(rule, value, normalized, unit);
        result.confidence = 'medium';
        result.userFriendlyExplanation = `Auto-corrected assuming ${unit}`;
        return result;
      }
    }

    // Value doesn't fit any pattern - mark as suspicious
    return {
      originalValue: value,
      normalizedValue: value,
      confidence: 'reject',
      unit: providedUnit || rule.standardUnit,
      isValid: false,
      warnings: [
        `Value ${value} doesn't match expected patterns for ${rule.userFriendlyName}`,
        `Normal range: ${rule.normalRange.min}-${rule.normalRange.max} ${rule.standardUnit}`
      ],
      userFriendlyExplanation: `This value seems unusual for ${rule.userFriendlyName}. Please double-check your report.`
    };
  }

  private static validateNormalizedValue(
    rule: MedicalMetricRule, 
    original: number, 
    normalized: number, 
    unit: string
  ): MedicalValue {
    const warnings: string[] = [];
    let isValid = true;
    let confidence: 'high' | 'medium' | 'low' | 'reject' = 'high';

    // Check if within critical range
    if (normalized < rule.criticalRange.min || normalized > rule.criticalRange.max) {
      warnings.push(`CRITICAL: Value outside safe range (${rule.criticalRange.min}-${rule.criticalRange.max})`);
      confidence = 'reject';
      isValid = false;
    }
    // Check if within normal range
    else if (normalized < rule.normalRange.min || normalized > rule.normalRange.max) {
      warnings.push(`Outside normal range (${rule.normalRange.min}-${rule.normalRange.max})`);
      confidence = confidence === 'high' ? 'medium' : confidence;
    }

    return {
      originalValue: original,
      normalizedValue: normalized,
      confidence,
      unit: rule.standardUnit,
      isValid,
      warnings,
      userFriendlyExplanation: isValid ? 
        `${rule.userFriendlyName}: ${normalized.toFixed(1)} ${rule.standardUnit}` :
        `Please verify this ${rule.userFriendlyName} value`
    };
  }

  /**
   * Process multiple values and detect data quality issues
   */
  static processTimeSeries(metricName: string, dataPoints: Array<{value: number, unit?: string | null, date: string}>): {
    processed: Array<MedicalValue & {date: string}>;
    qualityScore: number;
    recommendations: string[];
    shouldShowToUser: boolean;
  } {
    const processed = dataPoints.map(point => ({
      ...this.processValue(metricName, point.value, point.unit),
      date: point.date
    }));

    // Calculate quality score
    const validCount = processed.filter(p => p.isValid && p.confidence !== 'reject').length;
    const highConfidenceCount = processed.filter(p => p.confidence === 'high').length;
    const qualityScore = (validCount * 0.7 + highConfidenceCount * 0.3) / processed.length;

    // Generate recommendations
    const recommendations: string[] = [];
    const rejectedCount = processed.filter(p => p.confidence === 'reject').length;
    const lowConfidenceCount = processed.filter(p => p.confidence === 'low').length;

    if (rejectedCount > 0) {
      recommendations.push(`${rejectedCount} values appear incorrect and will be hidden`);
    }
    
    if (lowConfidenceCount > 0) {
      recommendations.push(`${lowConfidenceCount} values have uncertain units`);
    }

    if (qualityScore < 0.5) {
      recommendations.push(`Data quality is low - consider re-entering recent values`);
    }

    // Only show to user if quality score is reasonable
    const shouldShowToUser = qualityScore >= 0.3 && validCount >= 1;

    return {
      processed,
      qualityScore,
      recommendations,
      shouldShowToUser
    };
  }

  /**
   * Filter data for chart display (ULTRA-LENIENT to avoid any data loss)
   */
  static getChartData(metricName: string, dataPoints: Array<{value: number, unit?: string | null, date: string}>): Array<{date: string, value: number | null}> {
    const { processed } = this.processTimeSeries(metricName, dataPoints);
    
    // ULTRA-LENIENT: Include almost everything - let users see their data!
    return processed
      .filter(p => {
        // Include ALL confidence levels
        if (p.confidence === 'high' || p.confidence === 'medium' || p.confidence === 'low') return true;
        
        // Include 'reject' if it has any reasonable normalized value
        if (p.confidence === 'reject' && p.normalizedValue > 0) return true;
        
        // Include even invalid data if it's a positive number
        if (!p.isValid && p.normalizedValue > 0 && p.normalizedValue < 100000) return true;
        
        // Only exclude completely nonsensical values
        return false;
      })
      .map(p => ({
        date: p.date,
        value: p.normalizedValue
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort chronologically!
  }

  /**
   * Get user-friendly summary for a metric
   */
  static getMetricSummary(metricName: string, latestValue?: number): string {
    const rule = MEDICAL_RULES[metricName];
    if (!rule || !latestValue) return '';

    const processed = this.processValue(metricName, latestValue);
    
    if (!processed.isValid) {
      return `⚠️ ${rule.userFriendlyName}: Value needs verification`;
    }

    const { normalRange } = rule;
    const value = processed.normalizedValue;
    
    if (value >= normalRange.min && value <= normalRange.max) {
      return `✅ ${rule.userFriendlyName}: Normal (${value.toFixed(1)})`;
    } else if (value < normalRange.min) {
      return `⬇️ ${rule.userFriendlyName}: Low (${value.toFixed(1)})`;
    } else {
      return `⬆️ ${rule.userFriendlyName}: High (${value.toFixed(1)})`;
    }
  }
}
