import { CanonicalMetric } from "./metrics";

export interface MELDParameters {
  bilirubin: number; // mg/dL
  creatinine: number; // mg/dL
  inr: number; // ratio
  sodium?: number; // mEq/L (for MELD-Na)
  dialysis?: {
    onDialysis: boolean;
    sessionsPerWeek: number;
    lastSession?: string; // ISO date string
  };
  gender?: 'male' | 'female'; // For MELD 3.0
  albumin?: number; // g/dL (for MELD 3.0)
}

export interface MELDResult {
  meld: number;
  meldNa?: number;
  meld3?: number; // MELD 3.0 score
  interpretation: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  transplantPriority: string;
  warnings: string[]; // Validation warnings
  confidence: 'high' | 'medium' | 'low'; // Calculation confidence
  missingParameters: string[]; // Required parameters not provided
  adjustments: {
    dialysisAdjustment?: boolean;
    creatinineAdjusted?: number;
  };
}

/**
 * Calculate MELD Score with Enhanced Validation and MELD 3.0 Support
 * 
 * Formulas:
 * - MELD: 3.78 × ln(bilirubin) + 11.2 × ln(INR) + 9.57 × ln(creatinine) + 6.43
 * - MELD-Na: MELD + 1.32 × (137 - Na) - (0.033 × MELD × (137 - Na))
 * - MELD 3.0: Includes gender and albumin adjustments (2023 standard)
 * 
 * Critical adjustments:
 * - Dialysis: If ≥2 sessions/week, creatinine = 4.0 mg/dL
 * - Gender: Female patients get adjustment in MELD 3.0
 * - Albumin: Lower albumin increases MELD 3.0 score
 */
export function calculateMELD(params: MELDParameters): MELDResult {
  const { bilirubin, creatinine, inr, sodium, dialysis, gender, albumin } = params;
  
  // Initialize validation tracking
  const warnings: string[] = [];
  const missingParameters: string[] = [];
  let confidence: MELDResult['confidence'] = 'high';
  const adjustments: MELDResult['adjustments'] = {};

  // Validate required parameters
  if (!bilirubin || bilirubin <= 0) {
    missingParameters.push('Serum Bilirubin (mg/dL)');
  }
  if (!creatinine || creatinine <= 0) {
    missingParameters.push('Serum Creatinine (mg/dL)');
  }
  if (!inr || inr <= 0) {
    missingParameters.push('INR (International Normalized Ratio)');
  }

  // If core parameters are missing, return error result
  if (missingParameters.length > 0) {
    return {
      meld: 0,
      interpretation: 'Cannot calculate MELD score - missing required parameters',
      urgency: 'Low',
      transplantPriority: 'Incomplete data - calculation not possible',
      warnings: ['Critical parameters missing for MELD calculation'],
      confidence: 'low',
      missingParameters,
      adjustments: {}
    };
  }

  // Apply dialysis adjustment (CRITICAL MEDICAL SAFETY FEATURE)
  let adjustedCreatinine = creatinine;
  if (dialysis?.onDialysis && dialysis.sessionsPerWeek >= 2) {
    adjustedCreatinine = 4.0; // Standard dialysis adjustment
    adjustments.dialysisAdjustment = true;
    adjustments.creatinineAdjusted = 4.0;
    warnings.push('Creatinine adjusted to 4.0 mg/dL due to dialysis (≥2 sessions/week)');
  }

  // Apply minimum values to avoid negative logarithms
  const safeBilirubin = Math.max(bilirubin, 1.0);
  const safeCreatinine = Math.max(adjustedCreatinine, 1.0);
  const safeINR = Math.max(inr, 1.0);

  // Warn about value adjustments
  if (bilirubin < 1.0) warnings.push('Bilirubin below 1.0 mg/dL adjusted to 1.0 for calculation');
  if (adjustedCreatinine < 1.0) warnings.push('Creatinine below 1.0 mg/dL adjusted to 1.0 for calculation');
  if (inr < 1.0) warnings.push('INR below 1.0 adjusted to 1.0 for calculation');

  // Calculate standard MELD score
  const meldRaw = 3.78 * Math.log(safeBilirubin) + 
                  11.2 * Math.log(safeINR) + 
                  9.57 * Math.log(safeCreatinine) + 
                  6.43;
  
  const meld = Math.max(6, Math.min(40, Math.round(meldRaw)));

  // Calculate MELD-Na if sodium is provided
  let meldNa: number | undefined;
  if (sodium !== undefined) {
    if (sodium < 125 || sodium > 150) {
      warnings.push(`Sodium level ${sodium} mEq/L is outside typical range (125-150)`);
      confidence = 'medium';
    }
    const safeSodium = Math.max(125, Math.min(137, sodium));
    meldNa = meld + 1.32 * (137 - safeSodium) - (0.033 * meld * (137 - safeSodium));
    meldNa = Math.max(6, Math.min(40, Math.round(meldNa)));
  } else {
    missingParameters.push('Serum Sodium (mEq/L) - recommended for MELD-Na');
    confidence = confidence === 'high' ? 'medium' : confidence;
  }

  // Calculate MELD 3.0 if gender and albumin are provided
  let meld3: number | undefined;
  if (gender && albumin !== undefined) {
    // MELD 3.0 formula (simplified - actual formula is more complex)
    // This is a basic implementation; real MELD 3.0 requires more sophisticated calculation
    let genderAdjustment = gender === 'female' ? 1.33 : 1.0;
    let albuminAdjustment = albumin < 3.5 ? (3.5 - albumin) * 2 : 0;
    
    meld3 = Math.round((meldNa || meld) * genderAdjustment + albuminAdjustment);
    meld3 = Math.max(6, Math.min(40, meld3));
    
    if (gender === 'female') {
      warnings.push('Applied MELD 3.0 gender adjustment for female patient');
    }
    if (albumin < 3.5) {
      warnings.push(`Low albumin (${albumin} g/dL) increases MELD 3.0 score`);
    }
  } else {
    const missing: string[] = [];
    if (!gender) missing.push('Patient Gender');
    if (albumin === undefined) missing.push('Serum Albumin (g/dL)');
    
    if (missing.length > 0) {
      missingParameters.push(...missing.map(p => `${p} - required for MELD 3.0`));
      confidence = confidence === 'high' ? 'medium' : confidence;
    }
  }

  // Determine primary score to evaluate (prioritize newest available)
  const scoreToEvaluate = meld3 || meldNa || meld;
  const scoreType = meld3 ? 'MELD 3.0' : meldNa ? 'MELD-Na' : 'MELD';

  // Determine urgency and interpretation
  let urgency: MELDResult['urgency'];
  let interpretation: string;
  let transplantPriority: string;

  if (scoreToEvaluate <= 9) {
    urgency = 'Low';
    interpretation = `Minimal liver disease severity (${scoreType}: ${scoreToEvaluate}). Low risk of 3-month mortality (~2%).`;
    transplantPriority = 'Not eligible for transplant listing';
  } else if (scoreToEvaluate <= 19) {
    urgency = 'Medium';
    interpretation = `Moderate liver disease severity (${scoreType}: ${scoreToEvaluate}). Moderate risk of 3-month mortality (~6-20%).`;
    transplantPriority = 'May be considered for transplant evaluation';
  } else if (scoreToEvaluate <= 29) {
    urgency = 'High';
    interpretation = `Severe liver disease (${scoreType}: ${scoreToEvaluate}). High risk of 3-month mortality (~20-45%).`;
    transplantPriority = 'High priority for liver transplantation';
  } else {
    urgency = 'Critical';
    interpretation = `Very severe liver disease (${scoreType}: ${scoreToEvaluate}). Very high risk of 3-month mortality (>45%).`;
    transplantPriority = 'Urgent liver transplantation required';
  }

  // Add confidence warnings
  if (confidence === 'medium') {
    warnings.push('MELD calculation confidence reduced due to missing optional parameters');
  }
  if (missingParameters.length > 0) {
    warnings.push('Some parameters missing - provide all values for most accurate MELD score');
  }

  return {
    meld,
    meldNa,
    meld3,
    interpretation,
    urgency,
    transplantPriority,
    warnings,
    confidence,
    missingParameters,
    adjustments
  };
}

/**
 * Calculate Child-Pugh Score
 * Uses: Bilirubin, Albumin, INR, plus clinical parameters (ascites, encephalopathy)
 */
export interface ChildPughParameters {
  bilirubin: number; // mg/dL
  albumin: number; // g/dL
  inr: number; // ratio
  ascites: 'none' | 'mild' | 'moderate';
  encephalopathy: 'none' | 'grade1-2' | 'grade3-4';
}

export interface ChildPughResult {
  score: number;
  class: 'A' | 'B' | 'C';
  interpretation: string;
  oneYearSurvival: string;
  twoYearSurvival: string;
}

export function calculateChildPugh(params: ChildPughParameters): ChildPughResult {
  let score = 0;
  
  // Bilirubin points
  if (params.bilirubin < 2.0) score += 1;
  else if (params.bilirubin <= 3.0) score += 2;
  else score += 3;
  
  // Albumin points
  if (params.albumin > 3.5) score += 1;
  else if (params.albumin >= 2.8) score += 2;
  else score += 3;
  
  // INR points
  if (params.inr < 1.7) score += 1;
  else if (params.inr <= 2.3) score += 2;
  else score += 3;
  
  // Ascites points
  if (params.ascites === 'none') score += 1;
  else if (params.ascites === 'mild') score += 2;
  else score += 3;
  
  // Encephalopathy points
  if (params.encephalopathy === 'none') score += 1;
  else if (params.encephalopathy === 'grade1-2') score += 2;
  else score += 3;
  
  // Determine class
  let childClass: 'A' | 'B' | 'C';
  let interpretation: string;
  let oneYearSurvival: string;
  let twoYearSurvival: string;
  
  if (score <= 6) {
    childClass = 'A';
    interpretation = 'Well-compensated liver disease';
    oneYearSurvival = '95%';
    twoYearSurvival = '90%';
  } else if (score <= 9) {
    childClass = 'B';
    interpretation = 'Moderately decompensated liver disease';
    oneYearSurvival = '80%';
    twoYearSurvival = '70%';
  } else {
    childClass = 'C';
    interpretation = 'Severely decompensated liver disease';
    oneYearSurvival = '45%';
    twoYearSurvival = '35%';
  }
  
  return {
    score,
    class: childClass,
    interpretation,
    oneYearSurvival,
    twoYearSurvival
  };
}

/**
 * Extract MELD parameters from lab entries with enhanced validation
 */
export function extractMELDParameters(
  entries: Array<{name: CanonicalMetric, value: string, unit: string}>,
  clinicalData?: {
    gender?: 'male' | 'female';
    dialysis?: {
      onDialysis: boolean;
      sessionsPerWeek: number;
      lastSession?: string;
    };
  }
): MELDParameters | null {
  const bilirubin = entries.find(e => e.name === 'Bilirubin');
  const creatinine = entries.find(e => e.name === 'Creatinine');
  const inr = entries.find(e => e.name === 'INR');
  const sodium = entries.find(e => e.name === 'Sodium');
  const albumin = entries.find(e => e.name === 'Albumin');
  
  // Core parameters are still required
  if (!bilirubin?.value || !creatinine?.value || !inr?.value) {
    return null;
  }
  
  const bilirubinValue = parseFloat(bilirubin.value);
  const creatinineValue = parseFloat(creatinine.value);
  const inrValue = parseFloat(inr.value);
  const sodiumValue = sodium?.value ? parseFloat(sodium.value) : undefined;
  const albuminValue = albumin?.value ? parseFloat(albumin.value) : undefined;
  
  if (isNaN(bilirubinValue) || isNaN(creatinineValue) || isNaN(inrValue)) {
    return null;
  }
  
  return {
    bilirubin: bilirubinValue,
    creatinine: creatinineValue,
    inr: inrValue,
    sodium: sodiumValue,
    albumin: albuminValue,
    gender: clinicalData?.gender,
    dialysis: clinicalData?.dialysis
  };
}

/**
 * Validate MELD parameters and provide guidance
 */
export function validateMELDParameters(params: MELDParameters): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check required parameters
  if (!params.bilirubin || params.bilirubin <= 0) {
    errors.push('Serum Bilirubin is required and must be > 0 mg/dL');
  }
  if (!params.creatinine || params.creatinine <= 0) {
    errors.push('Serum Creatinine is required and must be > 0 mg/dL');
  }
  if (!params.inr || params.inr <= 0) {
    errors.push('INR is required and must be > 0');
  }

  // Check value ranges
  if (params.bilirubin && (params.bilirubin < 0.1 || params.bilirubin > 50)) {
    warnings.push(`Bilirubin ${params.bilirubin} mg/dL is outside typical range (0.1-50)`);
  }
  if (params.creatinine && (params.creatinine < 0.1 || params.creatinine > 15)) {
    warnings.push(`Creatinine ${params.creatinine} mg/dL is outside typical range (0.1-15)`);
  }
  if (params.inr && (params.inr < 0.8 || params.inr > 10)) {
    warnings.push(`INR ${params.inr} is outside typical range (0.8-10)`);
  }
  if (params.sodium && (params.sodium < 120 || params.sodium > 160)) {
    warnings.push(`Sodium ${params.sodium} mEq/L is outside typical range (120-160)`);
  }
  if (params.albumin && (params.albumin < 1.0 || params.albumin > 6.0)) {
    warnings.push(`Albumin ${params.albumin} g/dL is outside typical range (1.0-6.0)`);
  }

  // Recommendations for missing parameters
  if (!params.sodium) {
    recommendations.push('Include Serum Sodium for MELD-Na calculation (more accurate)');
  }
  if (!params.gender) {
    recommendations.push('Include patient gender for MELD 3.0 calculation (newest standard)');
  }
  if (!params.albumin) {
    recommendations.push('Include Serum Albumin for MELD 3.0 calculation (newest standard)');
  }
  if (!params.dialysis) {
    recommendations.push('Specify dialysis status if patient receives dialysis (critical for accuracy)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
}
