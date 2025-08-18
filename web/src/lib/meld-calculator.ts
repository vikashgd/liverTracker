import { CanonicalMetric } from "./metrics";

export interface MELDParameters {
  bilirubin: number; // mg/dL
  creatinine: number; // mg/dL
  inr: number; // ratio
  sodium?: number; // mEq/L (for MELD-Na)
}

export interface MELDResult {
  meld: number;
  meldNa?: number;
  interpretation: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  transplantPriority: string;
}

/**
 * Calculate MELD Score
 * Formula: MELD = 3.78 × ln(serum bilirubin) + 11.2 × ln(INR) + 9.57 × ln(serum creatinine) + 6.43
 * 
 * Reference ranges for interpretation:
 * - 6-9: Minimal disease severity
 * - 10-19: Moderate disease severity  
 * - 20-29: Severe disease severity
 * - 30-40: Very severe, high transplant priority
 * - >40: Extremely severe, critical
 */
export function calculateMELD(params: MELDParameters): MELDResult {
  const { bilirubin, creatinine, inr, sodium } = params;
  
  // Ensure minimum values to avoid negative logarithms
  const safeBilirubin = Math.max(bilirubin, 1.0);
  const safeCreatinine = Math.max(creatinine, 1.0);
  const safeINR = Math.max(inr, 1.0);
  
  // Calculate MELD score
  const meldRaw = 3.78 * Math.log(safeBilirubin) + 
                  11.2 * Math.log(safeINR) + 
                  9.57 * Math.log(safeCreatinine) + 
                  6.43;
  
  // Round to nearest integer, minimum 6, maximum 40
  const meld = Math.max(6, Math.min(40, Math.round(meldRaw)));
  
  // Calculate MELD-Na if sodium is provided
  let meldNa: number | undefined;
  if (sodium !== undefined) {
    const safeSodium = Math.max(125, Math.min(137, sodium)); // Clamp sodium between 125-137
    meldNa = meld + 1.32 * (137 - safeSodium) - (0.033 * meld * (137 - safeSodium));
    meldNa = Math.max(6, Math.min(40, Math.round(meldNa)));
  }
  
  // Determine urgency and interpretation
  let urgency: MELDResult['urgency'];
  let interpretation: string;
  let transplantPriority: string;
  
  const scoreToEvaluate = meldNa || meld;
  
  if (scoreToEvaluate <= 9) {
    urgency = 'Low';
    interpretation = 'Minimal liver disease severity. Low risk of 3-month mortality (~2%).';
    transplantPriority = 'Not eligible for transplant listing';
  } else if (scoreToEvaluate <= 19) {
    urgency = 'Medium';
    interpretation = 'Moderate liver disease severity. Moderate risk of 3-month mortality (~6-20%).';
    transplantPriority = 'May be considered for transplant evaluation';
  } else if (scoreToEvaluate <= 29) {
    urgency = 'High';
    interpretation = 'Severe liver disease. High risk of 3-month mortality (~20-45%).';
    transplantPriority = 'High priority for liver transplantation';
  } else {
    urgency = 'Critical';
    interpretation = 'Very severe liver disease. Very high risk of 3-month mortality (>45%).';
    transplantPriority = 'Urgent liver transplantation required';
  }
  
  return {
    meld,
    meldNa,
    interpretation,
    urgency,
    transplantPriority
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
 * Extract MELD parameters from lab entries
 */
export function extractMELDParameters(entries: Array<{name: CanonicalMetric, value: string, unit: string}>): MELDParameters | null {
  const bilirubin = entries.find(e => e.name === 'Bilirubin');
  const creatinine = entries.find(e => e.name === 'Creatinine');
  const inr = entries.find(e => e.name === 'INR');
  const sodium = entries.find(e => e.name === 'Sodium');
  
  if (!bilirubin?.value || !creatinine?.value || !inr?.value) {
    return null;
  }
  
  const bilirubinValue = parseFloat(bilirubin.value);
  const creatinineValue = parseFloat(creatinine.value);
  const inrValue = parseFloat(inr.value);
  const sodiumValue = sodium?.value ? parseFloat(sodium.value) : undefined;
  
  if (isNaN(bilirubinValue) || isNaN(creatinineValue) || isNaN(inrValue)) {
    return null;
  }
  
  return {
    bilirubin: bilirubinValue,
    creatinine: creatinineValue,
    inr: inrValue,
    sodium: sodiumValue
  };
}
