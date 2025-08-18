export interface NormalizedMetric {
  value: number;
  normalizedValue: number;
  originalUnit: string | null;
  normalizedUnit: string;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

export interface MetricUnitRule {
  metric: string;
  standardUnit: string;
  conversions: Record<string, number>; // unit -> multiplier
  normalRanges: {
    min: number;
    max: number;
    criticalMin?: number;
    criticalMax?: number;
  };
  commonUnits: string[];
}

// Medical unit conversion rules
export const UNIT_RULES: Record<string, MetricUnitRule> = {
  // MELD Score Components
  Bilirubin: {
    metric: 'Bilirubin',
    standardUnit: 'mg/dL',
    conversions: {
      'mg/dL': 1,
      'mg/dl': 1,
      'μmol/L': 0.0585, // μmol/L to mg/dL
      'umol/L': 0.0585,
      'micromol/L': 0.0585,
    },
    normalRanges: {
      min: 0.1,
      max: 1.2,
      criticalMin: 0,
      criticalMax: 20,
    },
    commonUnits: ['mg/dL', 'μmol/L'],
  },
  Creatinine: {
    metric: 'Creatinine',
    standardUnit: 'mg/dL',
    conversions: {
      'mg/dL': 1,
      'mg/dl': 1,
      'μmol/L': 0.0113, // μmol/L to mg/dL
      'umol/L': 0.0113,
      'micromol/L': 0.0113,
    },
    normalRanges: {
      min: 0.6,
      max: 1.2,
      criticalMin: 0.1,
      criticalMax: 10.0,
    },
    commonUnits: ['mg/dL', 'μmol/L'],
  },
  INR: {
    metric: 'INR',
    standardUnit: 'ratio',
    conversions: {
      'ratio': 1,
      '': 1,
      'dimensionless': 1,
    },
    normalRanges: {
      min: 0.8,
      max: 1.1,
      criticalMin: 0.5,
      criticalMax: 10.0,
    },
    commonUnits: ['ratio'],
  },

  // Core Liver Function Tests
  ALT: {
    metric: 'ALT',
    standardUnit: 'U/L',
    conversions: {
      'U/L': 1,
      'IU/L': 1,
      'units/L': 1,
      'UI/L': 1,
    },
    normalRanges: {
      min: 7,
      max: 56,
      criticalMin: 0,
      criticalMax: 500,
    },
    commonUnits: ['U/L', 'IU/L'],
  },
  AST: {
    metric: 'AST',
    standardUnit: 'U/L',
    conversions: {
      'U/L': 1,
      'IU/L': 1,
      'units/L': 1,
      'UI/L': 1,
    },
    normalRanges: {
      min: 10,
      max: 40,
      criticalMin: 0,
      criticalMax: 500,
    },
    commonUnits: ['U/L', 'IU/L'],
  },
  Albumin: {
    metric: 'Albumin',
    standardUnit: 'g/dL',
    conversions: {
      'g/dL': 1,
      'g/dl': 1,
      'g/L': 0.1, // g/L to g/dL
    },
    normalRanges: {
      min: 3.5,
      max: 5.5,
      criticalMin: 1.0,
      criticalMax: 8.0,
    },
    commonUnits: ['g/dL', 'g/L'],
  },
  Platelets: {
    metric: 'Platelets',
    standardUnit: '10^9/L',
    conversions: {
      '10^9/L': 1,
      '×10³/μL': 1,
      '×10⁹/L': 1,
      '10^3/μL': 1,
      '10^3/uL': 1,
      'K/μL': 1,
      'K/uL': 1,
      '/μL': 0.001, // Raw count to 10^9/L
      '/uL': 0.001,
      'thou/mm3': 1,
      'x10^3/mm3': 1,
      'lakhs/μL': 100, // Indian format
      'lakhs/cu mm': 100,
    },
    normalRanges: {
      min: 150,
      max: 450,
      criticalMin: 50,
      criticalMax: 1000,
    },
    commonUnits: ['10^9/L', '×10³/μL', '/μL'],
  },

  // Additional Liver Function Tests
  ALP: {
    metric: 'ALP',
    standardUnit: 'U/L',
    conversions: {
      'U/L': 1,
      'IU/L': 1,
      'units/L': 1,
      'UI/L': 1,
    },
    normalRanges: {
      min: 44,
      max: 147,
      criticalMin: 0,
      criticalMax: 1000,
    },
    commonUnits: ['U/L', 'IU/L'],
  },
  GGT: {
    metric: 'GGT',
    standardUnit: 'U/L',
    conversions: {
      'U/L': 1,
      'IU/L': 1,
      'units/L': 1,
      'UI/L': 1,
    },
    normalRanges: {
      min: 9,
      max: 48,
      criticalMin: 0,
      criticalMax: 500,
    },
    commonUnits: ['U/L', 'IU/L'],
  },
  TotalProtein: {
    metric: 'TotalProtein',
    standardUnit: 'g/dL',
    conversions: {
      'g/dL': 1,
      'g/dl': 1,
      'g/L': 0.1, // g/L to g/dL
    },
    normalRanges: {
      min: 6.0,
      max: 8.3,
      criticalMin: 3.0,
      criticalMax: 12.0,
    },
    commonUnits: ['g/dL', 'g/L'],
  },

  // Electrolytes
  Sodium: {
    metric: 'Sodium',
    standardUnit: 'mEq/L',
    conversions: {
      'mEq/L': 1,
      'mmol/L': 1,
      'mEq/l': 1,
      'mmol/l': 1,
    },
    normalRanges: {
      min: 136,
      max: 145,
      criticalMin: 120,
      criticalMax: 160,
    },
    commonUnits: ['mEq/L', 'mmol/L'],
  },
  Potassium: {
    metric: 'Potassium',
    standardUnit: 'mEq/L',
    conversions: {
      'mEq/L': 1,
      'mmol/L': 1,
      'mEq/l': 1,
      'mmol/l': 1,
    },
    normalRanges: {
      min: 3.5,
      max: 5.0,
      criticalMin: 2.0,
      criticalMax: 7.0,
    },
    commonUnits: ['mEq/L', 'mmol/L'],
  },
};

export function normalizeMetricValue(
  metricName: string,
  value: number,
  unit: string | null
): NormalizedMetric {
  const rule = UNIT_RULES[metricName];
  if (!rule) {
    return {
      value,
      normalizedValue: value,
      originalUnit: unit,
      normalizedUnit: unit || '',
      confidence: 'low',
      warnings: [`Unknown metric: ${metricName}`],
    };
  }

  const warnings: string[] = [];
  let normalizedValue = value;
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  
  // Try to convert based on explicit unit
  if (unit && rule.conversions[unit]) {
    normalizedValue = value * rule.conversions[unit];
    confidence = 'high';
  } else {
    // Smart inference based on value ranges
    confidence = 'low';
    
    // For Platelets: common confusion between raw counts and proper units
    if (metricName === 'Platelets') {
      if (value >= 10000 && value <= 1000000) {
        // Likely raw count (/μL) - convert to 10^9/L
        normalizedValue = value * 0.001;
        warnings.push(`Inferred unit conversion: ${value}/μL → ${normalizedValue} 10^9/L`);
        confidence = 'medium';
      } else if (value >= 10 && value <= 1000) {
        // Likely already in 10^9/L
        normalizedValue = value;
        confidence = 'medium';
      }
    }
    
    // For other metrics, try to infer based on normal ranges
    const { min, max, criticalMin = 0, criticalMax = Infinity } = rule.normalRanges;
    
    if (value >= min && value <= max) {
      // Value is in normal range, likely correct unit
      confidence = 'high';
    } else if (value >= criticalMin && value <= criticalMax) {
      // Value is possible but outside normal range
      confidence = 'medium';
      warnings.push(`Value ${value} is outside normal range (${min}-${max})`);
    } else {
      // Value is extreme - likely unit issue
      confidence = 'low';
      warnings.push(`Extreme value ${value} - possible unit conversion needed`);
      
      // Try common conversions
      for (const [unitName, multiplier] of Object.entries(rule.conversions)) {
        const converted = value * multiplier;
        if (converted >= min && converted <= max) {
          normalizedValue = converted;
          warnings.push(`Auto-converted assuming ${unitName}: ${value} → ${converted}`);
          confidence = 'medium';
          break;
        }
      }
    }
  }

  // Final validation
  const { criticalMin = 0, criticalMax = Infinity } = rule.normalRanges;
  if (normalizedValue < criticalMin || normalizedValue > criticalMax) {
    warnings.push(`CRITICAL: Value ${normalizedValue} is outside safe range`);
    confidence = 'low';
  }

  return {
    value,
    normalizedValue,
    originalUnit: unit,
    normalizedUnit: rule.standardUnit,
    confidence,
    warnings,
  };
}

export function detectOutliers(values: number[]): number[] {
  if (values.length < 3) return [];
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(v => v < lowerBound || v > upperBound);
}

export function validateMetricSeries(metricName: string, dataPoints: Array<{ value: number; unit: string | null }>): {
  normalized: Array<{ value: number; normalizedValue: number; confidence: string; warnings: string[] }>;
  outliers: number[];
  recommendations: string[];
} {
  const normalized = dataPoints.map(point => 
    normalizeMetricValue(metricName, point.value, point.unit)
  );
  
  const values = normalized.map(n => n.normalizedValue);
  const outliers = detectOutliers(values);
  
  const recommendations: string[] = [];
  
  // Check for low confidence normalizations
  const lowConfidence = normalized.filter(n => n.confidence === 'low');
  if (lowConfidence.length > 0) {
    recommendations.push(`${lowConfidence.length} values have low confidence - review units`);
  }
  
  // Check for outliers
  if (outliers.length > 0) {
    recommendations.push(`${outliers.length} outlier values detected - verify data accuracy`);
  }
  
  // Check for unit inconsistency
  const units = new Set(dataPoints.map(p => p.unit).filter(Boolean));
  if (units.size > 2) {
    recommendations.push(`Multiple units detected: ${Array.from(units).join(', ')} - standardize units`);
  }
  
  return {
    normalized,
    outliers,
    recommendations,
  };
}
