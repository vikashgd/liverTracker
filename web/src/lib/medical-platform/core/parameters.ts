/**
 * MEDICAL PARAMETERS DEFINITION
 * Complete definition of all medical metrics with enterprise-grade specifications
 * Single source of truth for all medical parameters across the platform
 */

import type {
  MedicalParameter,
  MetricName,
  MedicalCategory,
  Range,
  UnitDefinition,
  ConversionRule,
  ValuePattern,
  ValidationRule,
  QualityCheck
} from './types';

// ================================
// VALIDATION RULES
// ================================

const createRangeValidation = (name: string, range: Range): ValidationRule => ({
  name: `${name}_range_check`,
  check: (value) => {
    const inRange = value.processed.value >= range.min && value.processed.value <= range.max;
    return {
      passed: inRange,
      message: inRange ? `${name} within acceptable range` : `${name} outside critical range (${range.min}-${range.max})`,
      suggestion: inRange ? undefined : `Review ${name} value for potential data entry error`
    };
  },
  severity: 'error'
});

const createUnitConsistencyCheck = (name: string): QualityCheck => ({
  name: `${name}_unit_consistency`,
  description: `Validates unit consistency for ${name}`,
  check: (value) => {
    const hasValidUnit = !!value.processed.unit;
    const conversionReasonable = value.processed.conversionFactor >= 0.001 && value.processed.conversionFactor <= 1000;
    
    let score = 1.0;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    if (!hasValidUnit) {
      score -= 0.3;
      issues.push('Missing unit information');
      recommendations.push('Verify unit specification');
    }
    
    if (!conversionReasonable) {
      score -= 0.4;
      issues.push('Unusual conversion factor detected');
      recommendations.push('Review unit conversion logic');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
});

// ================================
// MEDICAL PARAMETERS DATABASE
// ================================

export const MEDICAL_PARAMETERS: Record<MetricName, MedicalParameter> = {
  
  // ================================
  // LIVER FUNCTION TESTS
  // ================================
  
  ALT: {
    metric: 'ALT',
    name: 'Alanine Aminotransferase',
    description: 'Enzyme primarily found in liver cells, elevated when liver is damaged',
    category: 'liver_function',
    priority: 1,
    
    clinical: {
      normalRange: { min: 7, max: 56 },
      criticalRange: { min: 0, max: 5000 },
      significance: 'Primary marker of liver cell damage and hepatic function',
      relatedConditions: ['Hepatitis', 'Cirrhosis', 'Fatty Liver Disease', 'Drug-induced liver injury'],
      meldComponent: false,
      childPughComponent: false
    },
    
    units: {
      standard: 'U/L',
      alternatives: [
        { name: 'U/L', conversionFactor: 1, region: 'International', description: 'Units per liter (standard)', isCommon: true },
        { name: 'IU/L', conversionFactor: 1, region: 'International', description: 'International units per liter', isCommon: true },
        { name: 'μkat/L', conversionFactor: 60, region: 'International', description: 'Microkatal per liter', isCommon: false },
        { name: 'U/mL', conversionFactor: 1000, region: 'US', description: 'Units per milliliter', isCommon: false }
      ],
      conversionRules: [
        { from: 'U/L', to: 'U/L', factor: 1 },
        { from: 'IU/L', to: 'U/L', factor: 1 },
        { from: 'μkat/L', to: 'U/L', factor: 60 },
        { from: 'U/mL', to: 'U/L', factor: 1000 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 0, max: 200 }, likelyUnit: 'U/L', confidence: 0.9, description: 'Normal to moderately elevated range', examples: [25, 45, 120] },
        { range: { min: 200, max: 1000 }, likelyUnit: 'U/L', confidence: 0.8, description: 'Significantly elevated', examples: [350, 680] },
        { range: { min: 0.1, max: 3 }, likelyUnit: 'μkat/L', confidence: 0.7, description: 'SI unit range', examples: [0.8, 1.2] }
      ],
      validationRules: [createRangeValidation('ALT', { min: 0, max: 5000 })],
      qualityChecks: [createUnitConsistencyCheck('ALT')]
    },
    
    aliases: {
      names: ['Alanine Aminotransferase', 'ALAT', 'ALT'],
      abbreviations: ['ALT', 'ALAT', 'GPT'],
      alternativeSpellings: ['Alanine transaminase', 'SGPT']
    }
  },

  AST: {
    metric: 'AST',
    name: 'Aspartate Aminotransferase',
    description: 'Enzyme found in liver, heart, and muscle cells, elevated in tissue damage',
    category: 'liver_function',
    priority: 1,
    
    clinical: {
      normalRange: { min: 10, max: 40 },
      criticalRange: { min: 0, max: 5000 },
      significance: 'Marker of liver and cardiac muscle damage, used with ALT for liver assessment',
      relatedConditions: ['Hepatitis', 'Cirrhosis', 'Myocardial infarction', 'Muscle disorders'],
      meldComponent: false,
      childPughComponent: false
    },
    
    units: {
      standard: 'U/L',
      alternatives: [
        { name: 'U/L', conversionFactor: 1, region: 'International', description: 'Units per liter (standard)', isCommon: true },
        { name: 'IU/L', conversionFactor: 1, region: 'International', description: 'International units per liter', isCommon: true },
        { name: 'μkat/L', conversionFactor: 60, region: 'International', description: 'Microkatal per liter', isCommon: false }
      ],
      conversionRules: [
        { from: 'U/L', to: 'U/L', factor: 1 },
        { from: 'IU/L', to: 'U/L', factor: 1 },
        { from: 'μkat/L', to: 'U/L', factor: 60 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 0, max: 150 }, likelyUnit: 'U/L', confidence: 0.9, description: 'Normal to elevated range', examples: [20, 35, 80] },
        { range: { min: 150, max: 1000 }, likelyUnit: 'U/L', confidence: 0.8, description: 'Significantly elevated', examples: [250, 500] }
      ],
      validationRules: [createRangeValidation('AST', { min: 0, max: 5000 })],
      qualityChecks: [createUnitConsistencyCheck('AST')]
    },
    
    aliases: {
      names: ['Aspartate Aminotransferase', 'ASAT', 'AST'],
      abbreviations: ['AST', 'ASAT', 'GOT'],
      alternativeSpellings: ['SGOT', 'Aspartate transaminase']
    }
  },

  Bilirubin: {
    metric: 'Bilirubin',
    name: 'Total Bilirubin',
    description: 'Waste product from red blood cell breakdown, processed by liver',
    category: 'liver_function',
    priority: 1,
    
    clinical: {
      normalRange: { min: 0.2, max: 1.2 },
      criticalRange: { min: 0, max: 50 },
      significance: 'Key indicator of liver function and bile duct obstruction, MELD score component',
      relatedConditions: ['Jaundice', 'Hepatitis', 'Cirrhosis', 'Bile duct obstruction'],
      meldComponent: true,
      childPughComponent: true
    },
    
    units: {
      standard: 'mg/dL',
      alternatives: [
        { name: 'mg/dL', conversionFactor: 1, region: 'US', description: 'Milligrams per deciliter (US standard)', isCommon: true },
        { name: 'μmol/L', conversionFactor: 17.1, region: 'International', description: 'Micromoles per liter (SI unit)', isCommon: true },
        { name: 'mg/L', conversionFactor: 0.1, region: 'Global', description: 'Milligrams per liter', isCommon: false }
      ],
      conversionRules: [
        { from: 'mg/dL', to: 'mg/dL', factor: 1 },
        { from: 'μmol/L', to: 'mg/dL', factor: 1/17.1 },
        { from: 'mg/L', to: 'mg/dL', factor: 10 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 0.1, max: 20 }, likelyUnit: 'mg/dL', confidence: 0.9, description: 'Normal to elevated US range', examples: [0.8, 2.5, 15] },
        { range: { min: 5, max: 500 }, likelyUnit: 'μmol/L', confidence: 0.9, description: 'International SI unit range', examples: [15, 45, 200] },
        { range: { min: 1, max: 200 }, likelyUnit: 'mg/L', confidence: 0.6, description: 'Alternative unit range', examples: [8, 25] }
      ],
      validationRules: [createRangeValidation('Bilirubin', { min: 0, max: 50 })],
      qualityChecks: [createUnitConsistencyCheck('Bilirubin')]
    },
    
    aliases: {
      names: ['Total Bilirubin', 'Bilirubin Total', 'T.Bil', 'TBIL'],
      abbreviations: ['TBIL', 'T.BIL', 'BIL'],
      alternativeSpellings: ['Bilirubin', 'Total bilirubin']
    }
  },

  Albumin: {
    metric: 'Albumin',
    name: 'Serum Albumin',
    description: 'Major protein produced by liver, indicates synthetic liver function',
    category: 'protein',
    priority: 1,
    
    clinical: {
      normalRange: { min: 3.5, max: 5.0 },
      criticalRange: { min: 1.0, max: 8.0 },
      significance: 'Primary indicator of liver synthetic function, nutritional status, and protein balance',
      relatedConditions: ['Cirrhosis', 'Malnutrition', 'Chronic liver disease', 'Nephrotic syndrome'],
      meldComponent: false,
      childPughComponent: true
    },
    
    units: {
      standard: 'g/dL',
      alternatives: [
        { name: 'g/dL', conversionFactor: 1, region: 'US', description: 'Grams per deciliter (US standard)', isCommon: true },
        { name: 'g/L', conversionFactor: 0.1, region: 'International', description: 'Grams per liter (SI unit)', isCommon: true },
        { name: 'mg/dL', conversionFactor: 1000, region: 'Global', description: 'Milligrams per deciliter', isCommon: false }
      ],
      conversionRules: [
        { from: 'g/dL', to: 'g/dL', factor: 1 },
        { from: 'g/L', to: 'g/dL', factor: 10 },
        { from: 'mg/dL', to: 'g/dL', factor: 0.001 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 1.5, max: 7 }, likelyUnit: 'g/dL', confidence: 0.9, description: 'US standard range', examples: [3.8, 4.2, 2.1] },
        { range: { min: 15, max: 70 }, likelyUnit: 'g/L', confidence: 0.9, description: 'International SI range', examples: [38, 42, 21] },
        { range: { min: 1500, max: 7000 }, likelyUnit: 'mg/dL', confidence: 0.7, description: 'Alternative unit range', examples: [3800, 4200] }
      ],
      validationRules: [createRangeValidation('Albumin', { min: 1.0, max: 8.0 })],
      qualityChecks: [createUnitConsistencyCheck('Albumin')]
    },
    
    aliases: {
      names: ['Serum Albumin', 'Albumin', 'ALB'],
      abbreviations: ['ALB', 'SA'],
      alternativeSpellings: ['Albumin']
    }
  },

  // ================================
  // HEMATOLOGY
  // ================================

  Platelets: {
    metric: 'Platelets',
    name: 'Platelet Count',
    description: 'Blood cells responsible for clotting, decreased in liver disease and portal hypertension',
    category: 'blood_count',
    priority: 1,
    
    clinical: {
      normalRange: { min: 150, max: 450 },
      criticalRange: { min: 20, max: 1000 },
      significance: 'Critical for bleeding risk assessment, portal hypertension indicator',
      relatedConditions: ['Portal hypertension', 'Splenomegaly', 'Thrombocytopenia', 'Bleeding disorders'],
      meldComponent: false,
      childPughComponent: false
    },
    
    units: {
      standard: '10^9/L',
      alternatives: [
        { name: '10^9/L', conversionFactor: 1, region: 'International', description: 'Billion per liter (SI standard)', isCommon: true },
        { name: '×10³/μL', conversionFactor: 1, region: 'US', description: 'Thousand per microliter', isCommon: true },
        { name: '/μL', conversionFactor: 0.001, region: 'US', description: 'Per microliter (raw count)', isCommon: true },
        { name: 'lakhs/μL', conversionFactor: 100, region: 'India', description: 'Lakhs per microliter (1 lakh = 100,000)', isCommon: true },
        { name: '×10⁹/L', conversionFactor: 1, region: 'International', description: 'Alternative notation for 10^9/L', isCommon: true }
      ],
      conversionRules: [
        { from: '10^9/L', to: '10^9/L', factor: 1 },
        { from: '×10³/μL', to: '10^9/L', factor: 1 },
        { from: '/μL', to: '10^9/L', factor: 0.001 },
        { from: 'lakhs/μL', to: '10^9/L', factor: 100 },
        { from: '×10⁹/L', to: '10^9/L', factor: 1 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 50, max: 1000 }, likelyUnit: '10^9/L', confidence: 0.9, description: 'Standard international range', examples: [150, 300, 450] },
        { range: { min: 50, max: 1000 }, likelyUnit: '×10³/μL', confidence: 0.9, description: 'US laboratory range', examples: [150, 300, 450] },
        { range: { min: 50000, max: 1000000 }, likelyUnit: '/μL', confidence: 0.8, description: 'Raw count range', examples: [150000, 300000] },
        { range: { min: 0.5, max: 10 }, likelyUnit: 'lakhs/μL', confidence: 0.8, description: 'Indian lab range', examples: [1.5, 3.0, 4.5] }
      ],
      validationRules: [createRangeValidation('Platelets', { min: 20, max: 1000 })],
      qualityChecks: [createUnitConsistencyCheck('Platelets')]
    },
    
    aliases: {
      names: ['Platelet Count', 'Platelets', 'PLT'],
      abbreviations: ['PLT', 'PLAT'],
      alternativeSpellings: ['Platelet', 'Thrombocytes']
    }
  },

  // ================================
  // KIDNEY FUNCTION
  // ================================

  Creatinine: {
    metric: 'Creatinine',
    name: 'Serum Creatinine',
    description: 'Waste product filtered by kidneys, indicator of kidney function',
    category: 'kidney_function',
    priority: 2,
    
    clinical: {
      normalRange: { min: 0.6, max: 1.2 },
      criticalRange: { min: 0.1, max: 15 },
      significance: 'Key kidney function marker, MELD score component, affects liver transplant priority',
      relatedConditions: ['Chronic kidney disease', 'Acute kidney injury', 'Hepatorenal syndrome'],
      meldComponent: true,
      childPughComponent: false
    },
    
    units: {
      standard: 'mg/dL',
      alternatives: [
        { name: 'mg/dL', conversionFactor: 1, region: 'US', description: 'Milligrams per deciliter (US standard)', isCommon: true },
        { name: 'μmol/L', conversionFactor: 88.4, region: 'International', description: 'Micromoles per liter (SI unit)', isCommon: true },
        { name: 'mg/L', conversionFactor: 0.1, region: 'Global', description: 'Milligrams per liter', isCommon: false }
      ],
      conversionRules: [
        { from: 'mg/dL', to: 'mg/dL', factor: 1 },
        { from: 'μmol/L', to: 'mg/dL', factor: 1/88.4 },
        { from: 'mg/L', to: 'mg/dL', factor: 10 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 0.3, max: 10 }, likelyUnit: 'mg/dL', confidence: 0.9, description: 'US clinical range', examples: [0.8, 1.1, 3.5] },
        { range: { min: 30, max: 900 }, likelyUnit: 'μmol/L', confidence: 0.9, description: 'International SI range', examples: [75, 100, 300] },
        { range: { min: 3, max: 100 }, likelyUnit: 'mg/L', confidence: 0.6, description: 'Alternative unit range', examples: [8, 11, 35] }
      ],
      validationRules: [createRangeValidation('Creatinine', { min: 0.1, max: 15 })],
      qualityChecks: [createUnitConsistencyCheck('Creatinine')]
    },
    
    aliases: {
      names: ['Serum Creatinine', 'Creatinine', 'CREA'],
      abbreviations: ['CREA', 'CR', 'SCR'],
      alternativeSpellings: ['Creatinin']
    }
  },

  // ================================
  // COAGULATION
  // ================================

  INR: {
    metric: 'INR',
    name: 'International Normalized Ratio',
    description: 'Standardized measure of blood clotting time, reflects liver synthetic function',
    category: 'coagulation',
    priority: 1,
    
    clinical: {
      normalRange: { min: 0.8, max: 1.1 },
      criticalRange: { min: 0.5, max: 10 },
      significance: 'Critical MELD score component, indicates liver synthetic function and bleeding risk',
      relatedConditions: ['Liver failure', 'Coagulopathy', 'Warfarin therapy', 'Bleeding disorders'],
      meldComponent: true,
      childPughComponent: true
    },
    
    units: {
      standard: 'ratio',
      alternatives: [
        { name: 'ratio', conversionFactor: 1, region: 'Global', description: 'Dimensionless ratio (standard)', isCommon: true },
        { name: '', conversionFactor: 1, region: 'Global', description: 'No unit (dimensionless)', isCommon: true }
      ],
      conversionRules: [
        { from: 'ratio', to: 'ratio', factor: 1 },
        { from: '', to: 'ratio', factor: 1 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 0.5, max: 8 }, likelyUnit: 'ratio', confidence: 0.95, description: 'Standard clinical range', examples: [0.9, 1.2, 2.5] }
      ],
      validationRules: [createRangeValidation('INR', { min: 0.5, max: 10 })],
      qualityChecks: [createUnitConsistencyCheck('INR')]
    },
    
    aliases: {
      names: ['International Normalized Ratio', 'INR'],
      abbreviations: ['INR'],
      alternativeSpellings: ['PT INR', 'Prothrombin time INR']
    }
  },

  // ================================
  // ADDITIONAL LIVER ENZYMES
  // ================================

  ALP: {
    metric: 'ALP',
    name: 'Alkaline Phosphatase',
    description: 'Enzyme elevated in bile duct obstruction and liver disease',
    category: 'enzymes',
    priority: 2,
    
    clinical: {
      normalRange: { min: 44, max: 147 },
      criticalRange: { min: 0, max: 2000 },
      significance: 'Indicator of bile duct obstruction, cholestasis, and liver disease',
      relatedConditions: ['Cholestasis', 'Bile duct obstruction', 'Primary biliary cirrhosis'],
      meldComponent: false,
      childPughComponent: false
    },
    
    units: {
      standard: 'U/L',
      alternatives: [
        { name: 'U/L', conversionFactor: 1, region: 'International', description: 'Units per liter (standard)', isCommon: true },
        { name: 'IU/L', conversionFactor: 1, region: 'International', description: 'International units per liter', isCommon: true }
      ],
      conversionRules: [
        { from: 'U/L', to: 'U/L', factor: 1 },
        { from: 'IU/L', to: 'U/L', factor: 1 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 20, max: 500 }, likelyUnit: 'U/L', confidence: 0.9, description: 'Standard clinical range', examples: [80, 120, 200] }
      ],
      validationRules: [createRangeValidation('ALP', { min: 0, max: 2000 })],
      qualityChecks: [createUnitConsistencyCheck('ALP')]
    },
    
    aliases: {
      names: ['Alkaline Phosphatase', 'ALP', 'ALKP'],
      abbreviations: ['ALP', 'ALKP', 'AP'],
      alternativeSpellings: ['Alk Phos']
    }
  },

  GGT: {
    metric: 'GGT',
    name: 'Gamma-Glutamyl Transferase',
    description: 'Liver enzyme sensitive to alcohol and bile duct problems',
    category: 'enzymes',
    priority: 3,
    
    clinical: {
      normalRange: { min: 9, max: 48 },
      criticalRange: { min: 0, max: 1000 },
      significance: 'Sensitive marker for alcohol-related liver disease and biliary obstruction',
      relatedConditions: ['Alcoholic liver disease', 'Cholestasis', 'Drug-induced liver injury'],
      meldComponent: false,
      childPughComponent: false
    },
    
    units: {
      standard: 'U/L',
      alternatives: [
        { name: 'U/L', conversionFactor: 1, region: 'International', description: 'Units per liter (standard)', isCommon: true },
        { name: 'IU/L', conversionFactor: 1, region: 'International', description: 'International units per liter', isCommon: true }
      ],
      conversionRules: [
        { from: 'U/L', to: 'U/L', factor: 1 },
        { from: 'IU/L', to: 'U/L', factor: 1 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 5, max: 300 }, likelyUnit: 'U/L', confidence: 0.9, description: 'Standard clinical range', examples: [25, 45, 120] }
      ],
      validationRules: [createRangeValidation('GGT', { min: 0, max: 1000 })],
      qualityChecks: [createUnitConsistencyCheck('GGT')]
    },
    
    aliases: {
      names: ['Gamma-Glutamyl Transferase', 'GGT', 'Gamma GT'],
      abbreviations: ['GGT', 'γ-GT'],
      alternativeSpellings: ['Gamma-glutamyltransferase']
    }
  },

  TotalProtein: {
    metric: 'TotalProtein',
    name: 'Total Protein',
    description: 'Sum of all proteins in blood, indicates liver synthetic function',
    category: 'protein',
    priority: 3,
    
    clinical: {
      normalRange: { min: 6.0, max: 8.3 },
      criticalRange: { min: 3.0, max: 12.0 },
      significance: 'Overall protein production indicator, nutritional status marker',
      relatedConditions: ['Liver disease', 'Malnutrition', 'Multiple myeloma'],
      meldComponent: false,
      childPughComponent: false
    },
    
    units: {
      standard: 'g/dL',
      alternatives: [
        { name: 'g/dL', conversionFactor: 1, region: 'US', description: 'Grams per deciliter (US standard)', isCommon: true },
        { name: 'g/L', conversionFactor: 0.1, region: 'International', description: 'Grams per liter (SI unit)', isCommon: true }
      ],
      conversionRules: [
        { from: 'g/dL', to: 'g/dL', factor: 1 },
        { from: 'g/L', to: 'g/dL', factor: 10 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 4, max: 12 }, likelyUnit: 'g/dL', confidence: 0.9, description: 'US standard range', examples: [6.5, 7.2, 8.0] },
        { range: { min: 40, max: 120 }, likelyUnit: 'g/L', confidence: 0.9, description: 'International SI range', examples: [65, 72, 80] }
      ],
      validationRules: [createRangeValidation('TotalProtein', { min: 3.0, max: 12.0 })],
      qualityChecks: [createUnitConsistencyCheck('TotalProtein')]
    },
    
    aliases: {
      names: ['Total Protein', 'TP', 'Total Proteins'],
      abbreviations: ['TP', 'TPROT'],
      alternativeSpellings: ['Total protein']
    }
  },

  // ================================
  // ELECTROLYTES
  // ================================

  Sodium: {
    metric: 'Sodium',
    name: 'Serum Sodium',
    description: 'Primary electrolyte, used in MELD-Na score calculation',
    category: 'electrolytes',
    priority: 2,
    
    clinical: {
      normalRange: { min: 136, max: 145 },
      criticalRange: { min: 120, max: 160 },
      significance: 'Essential electrolyte, component of MELD-Na score, affects liver transplant priority',
      relatedConditions: ['Hyponatremia', 'Hypernatremia', 'Fluid retention', 'Liver failure'],
      meldComponent: true,
      childPughComponent: false
    },
    
    units: {
      standard: 'mEq/L',
      alternatives: [
        { name: 'mEq/L', conversionFactor: 1, region: 'US', description: 'Milliequivalents per liter (US standard)', isCommon: true },
        { name: 'mmol/L', conversionFactor: 1, region: 'International', description: 'Millimoles per liter (SI unit)', isCommon: true }
      ],
      conversionRules: [
        { from: 'mEq/L', to: 'mEq/L', factor: 1 },
        { from: 'mmol/L', to: 'mEq/L', factor: 1 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 120, max: 160 }, likelyUnit: 'mEq/L', confidence: 0.95, description: 'Standard electrolyte range', examples: [135, 140, 142] }
      ],
      validationRules: [createRangeValidation('Sodium', { min: 120, max: 160 })],
      qualityChecks: [createUnitConsistencyCheck('Sodium')]
    },
    
    aliases: {
      names: ['Serum Sodium', 'Sodium', 'Na'],
      abbreviations: ['Na', 'Na+'],
      alternativeSpellings: ['Sodium']
    }
  },

  Potassium: {
    metric: 'Potassium',
    name: 'Serum Potassium',
    description: 'Essential electrolyte for cellular function and cardiac rhythm',
    category: 'electrolytes',
    priority: 3,
    
    clinical: {
      normalRange: { min: 3.5, max: 5.1 },
      criticalRange: { min: 2.0, max: 7.0 },
      significance: 'Critical electrolyte affecting cardiac function and cellular processes',
      relatedConditions: ['Hyperkalemia', 'Hypokalemia', 'Cardiac arrhythmias', 'Kidney disease'],
      meldComponent: false,
      childPughComponent: false
    },
    
    units: {
      standard: 'mEq/L',
      alternatives: [
        { name: 'mEq/L', conversionFactor: 1, region: 'US', description: 'Milliequivalents per liter (US standard)', isCommon: true },
        { name: 'mmol/L', conversionFactor: 1, region: 'International', description: 'Millimoles per liter (SI unit)', isCommon: true }
      ],
      conversionRules: [
        { from: 'mEq/L', to: 'mEq/L', factor: 1 },
        { from: 'mmol/L', to: 'mEq/L', factor: 1 }
      ]
    },
    
    processing: {
      patterns: [
        { range: { min: 2.0, max: 7.0 }, likelyUnit: 'mEq/L', confidence: 0.95, description: 'Standard electrolyte range', examples: [3.8, 4.2, 4.5] }
      ],
      validationRules: [createRangeValidation('Potassium', { min: 2.0, max: 7.0 })],
      qualityChecks: [createUnitConsistencyCheck('Potassium')]
    },
    
    aliases: {
      names: ['Serum Potassium', 'Potassium', 'K'],
      abbreviations: ['K', 'K+'],
      alternativeSpellings: ['Potassium']
    }
  }
};

// ================================
// UTILITY FUNCTIONS
// ================================

export function getParameterByName(name: string): MedicalParameter | null {
  // Direct match
  if (MEDICAL_PARAMETERS[name as MetricName]) {
    return MEDICAL_PARAMETERS[name as MetricName];
  }
  
  // Search through aliases
  for (const [metric, parameter] of Object.entries(MEDICAL_PARAMETERS)) {
    const allNames = [
      ...parameter.aliases.names,
      ...parameter.aliases.abbreviations,
      ...parameter.aliases.alternativeSpellings
    ];
    
    if (allNames.some(alias => 
      alias.toLowerCase() === name.toLowerCase() ||
      alias.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(alias.toLowerCase())
    )) {
      return parameter;
    }
  }
  
  return null;
}

export function getAllMetricNames(): MetricName[] {
  return Object.keys(MEDICAL_PARAMETERS) as MetricName[];
}

export function getParametersByCategory(category: MedicalCategory): MedicalParameter[] {
  return Object.values(MEDICAL_PARAMETERS).filter(param => param.category === category);
}

export function getMELDComponents(): MedicalParameter[] {
  return Object.values(MEDICAL_PARAMETERS).filter(param => param.clinical.meldComponent);
}

export function getChildPughComponents(): MedicalParameter[] {
  return Object.values(MEDICAL_PARAMETERS).filter(param => param.clinical.childPughComponent);
}
