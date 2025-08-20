/**
 * Esophageal Varices Risk Assessment Calculator
 * 
 * This module calculates the risk of developing esophageal varices and
 * the risk of variceal bleeding in patients with liver cirrhosis.
 * 
 * Includes:
 * - Varices presence prediction (Baveno VI criteria)
 * - Bleeding risk assessment
 * - Portal hypertension severity scoring
 */

export interface VaricealRiskParameters {
  // Laboratory values
  platelets: number; // x10^9/L
  spleen?: number; // cm (spleen diameter)
  
  // Imaging findings
  imaging?: {
    spleenSize: 'normal' | 'mild_enlargement' | 'moderate_enlargement' | 'massive_enlargement';
    portalVeinDiameter?: number; // mm
    ascites: 'none' | 'mild' | 'moderate' | 'severe';
    collaterals: 'none' | 'minimal' | 'moderate' | 'extensive';
  };
  
  // Endoscopic findings (if available)
  endoscopy?: {
    varicesPresent: boolean;
    varicesSize: 'small' | 'medium' | 'large';
    redWhaleSigns: boolean; // Red color signs
    cherryRedSpots: boolean;
    hematocysticSpots: boolean;
    telangiectasias: boolean;
  };
  
  // Clinical factors
  clinical: {
    childPughClass: 'A' | 'B' | 'C';
    meldScore?: number;
    albumin?: number; // g/dL
    bilirubin?: number; // mg/dL
    inr?: number;
    previousBleeding: boolean;
    alcoholUse: 'none' | 'past' | 'current';
    betaBlockerUse: boolean;
  };
  
  // Physical examination
  physical?: {
    spleenPalpable: boolean;
    spleenSizeCm?: number; // cm below costal margin
    spider_angiomata: number;
    palmarErythema: boolean;
    caputMedusae: boolean;
  };
}

export interface VaricealRiskResult {
  varicesPresenceRisk: {
    probability: number; // 0-100%
    risk: 'low' | 'intermediate' | 'high';
    recommendation: string;
    baveno6Criteria: {
      eligible: boolean;
      explanation: string;
    };
  };
  
  bleedingRisk: {
    oneYearRisk: number; // 0-100%
    risk: 'low' | 'intermediate' | 'high';
    riskFactors: string[];
    protectiveFactors: string[];
  };
  
  portalHypertension: {
    severity: 'mild' | 'moderate' | 'severe';
    clinicallySignificant: boolean; // HVPG ≥10 mmHg equivalent
    indicators: string[];
  };
  
  recommendations: {
    screening: string;
    prophylaxis: string[];
    monitoring: string;
    urgency: 'routine' | 'expedited' | 'urgent';
  };
  
  confidence: number;
}

/**
 * Calculate platelet count to spleen size ratio (PSR)
 */
function calculatePSR(platelets: number, spleenSize: number): number {
  return platelets / spleenSize;
}

/**
 * Assess varices presence risk using Baveno VI criteria and other predictors
 */
function assessVaricesPresenceRisk(params: VaricealRiskParameters): VaricealRiskResult['varicesPresenceRisk'] {
  let probability: number;
  let risk: 'low' | 'intermediate' | 'high';
  let recommendation: string;
  
  // Baveno VI Criteria Assessment
  const baveno6Eligible = params.platelets > 150 && 
                         params.clinical.childPughClass === 'A' && 
                         (!params.imaging?.ascites || params.imaging.ascites === 'none');
  
  if (baveno6Eligible) {
    probability = 5; // Very low risk
    risk = 'low';
    recommendation = 'Endoscopy can be safely avoided. Repeat assessment in 2-3 years or if clinical decompensation occurs.';
  } else {
    // Calculate risk based on multiple factors
    let riskScore = 0;
    
    // Platelet count
    if (params.platelets < 100) riskScore += 3;
    else if (params.platelets < 150) riskScore += 2;
    else if (params.platelets < 200) riskScore += 1;
    
    // Child-Pugh class
    if (params.clinical.childPughClass === 'C') riskScore += 3;
    else if (params.clinical.childPughClass === 'B') riskScore += 2;
    
    // Spleen size
    if (params.imaging?.spleenSize === 'massive_enlargement') riskScore += 3;
    else if (params.imaging?.spleenSize === 'moderate_enlargement') riskScore += 2;
    else if (params.imaging?.spleenSize === 'mild_enlargement') riskScore += 1;
    
    // Ascites
    if (params.imaging?.ascites === 'severe') riskScore += 2;
    else if (params.imaging?.ascites === 'moderate') riskScore += 1;
    
    // Convert risk score to probability
    if (riskScore <= 2) {
      probability = 20;
      risk = 'low';
      recommendation = 'Consider endoscopy within 1-2 years or if clinical deterioration occurs.';
    } else if (riskScore <= 5) {
      probability = 50;
      risk = 'intermediate';
      recommendation = 'Endoscopy recommended within 6-12 months.';
    } else {
      probability = 80;
      risk = 'high';
      recommendation = 'Endoscopy recommended within 3-6 months.';
    }
  }
  
  return {
    probability,
    risk,
    recommendation,
    baveno6Criteria: {
      eligible: baveno6Eligible,
      explanation: baveno6Eligible 
        ? 'Meets Baveno VI criteria: Platelets >150, Child-Pugh A, no ascites'
        : 'Does not meet Baveno VI criteria for avoiding endoscopy'
    }
  };
}

/**
 * Assess bleeding risk for existing varices
 */
function assessBleedingRisk(params: VaricealRiskParameters): VaricealRiskResult['bleedingRisk'] {
  let oneYearRisk: number;
  let risk: 'low' | 'intermediate' | 'high';
  const riskFactors: string[] = [];
  const protectiveFactors: string[] = [];
  
  // Base risk depends on varices size
  if (params.endoscopy?.varicesSize === 'large') {
    oneYearRisk = 25; // High baseline risk
    riskFactors.push('Large varices size');
  } else if (params.endoscopy?.varicesSize === 'medium') {
    oneYearRisk = 15; // Moderate baseline risk
    riskFactors.push('Medium varices size');
  } else if (params.endoscopy?.varicesSize === 'small') {
    oneYearRisk = 5; // Low baseline risk
  } else if (params.endoscopy?.varicesPresent) {
    oneYearRisk = 10; // Unknown size
  } else {
    oneYearRisk = 0; // No varices
  }
  
  // Risk modifiers
  if (params.endoscopy?.redWhaleSigns) {
    oneYearRisk += 10;
    riskFactors.push('Red whale signs (high-risk stigmata)');
  }
  
  if (params.endoscopy?.cherryRedSpots) {
    oneYearRisk += 8;
    riskFactors.push('Cherry red spots');
  }
  
  if (params.clinical.childPughClass === 'C') {
    oneYearRisk += 15;
    riskFactors.push('Child-Pugh Class C liver disease');
  } else if (params.clinical.childPughClass === 'B') {
    oneYearRisk += 8;
    riskFactors.push('Child-Pugh Class B liver disease');
  }
  
  if (params.clinical.previousBleeding) {
    oneYearRisk += 20;
    riskFactors.push('Previous variceal bleeding');
  }
  
  if (params.clinical.alcoholUse === 'current') {
    oneYearRisk += 10;
    riskFactors.push('Current alcohol use');
  }
  
  // Protective factors
  if (params.clinical.betaBlockerUse) {
    oneYearRisk -= 8;
    protectiveFactors.push('Beta-blocker prophylaxis');
  }
  
  // Ensure risk doesn't go negative or exceed 100%
  oneYearRisk = Math.max(0, Math.min(100, oneYearRisk));
  
  // Categorize risk
  if (oneYearRisk < 10) {
    risk = 'low';
  } else if (oneYearRisk < 25) {
    risk = 'intermediate';
  } else {
    risk = 'high';
  }
  
  return {
    oneYearRisk,
    risk,
    riskFactors,
    protectiveFactors
  };
}

/**
 * Assess portal hypertension severity
 */
function assessPortalHypertension(params: VaricealRiskParameters) {
  let severity: 'mild' | 'moderate' | 'severe';
  let clinicallySignificant = false;
  const indicators: string[] = [];
  
  // Indicators of portal hypertension
  if (params.platelets < 100) {
    indicators.push('Thrombocytopenia (<100)');
    clinicallySignificant = true;
  }
  
  if (params.imaging?.spleenSize === 'moderate_enlargement' || 
      params.imaging?.spleenSize === 'massive_enlargement') {
    indicators.push('Significant splenomegaly');
    clinicallySignificant = true;
  }
  
  if (params.imaging?.ascites && params.imaging.ascites !== 'none') {
    indicators.push('Ascites');
    clinicallySignificant = true;
  }
  
  if (params.imaging?.collaterals === 'moderate' || 
      params.imaging?.collaterals === 'extensive') {
    indicators.push('Portal-systemic collaterals');
    clinicallySignificant = true;
  }
  
  if (params.endoscopy?.varicesPresent) {
    indicators.push('Esophageal varices');
    clinicallySignificant = true;
  }
  
  // Determine severity
  const severityScore = indicators.length;
  if (severityScore >= 4) {
    severity = 'severe';
  } else if (severityScore >= 2) {
    severity = 'moderate';
  } else {
    severity = 'mild';
  }
  
  return {
    severity,
    clinicallySignificant,
    indicators
  };
}

/**
 * Generate recommendations based on risk assessment
 */
function generateRecommendations(
  varicesRisk: VaricealRiskResult['varicesPresenceRisk'],
  bleedingRisk: VaricealRiskResult['bleedingRisk'],
  params: VaricealRiskParameters
): VaricealRiskResult['recommendations'] {
  const prophylaxis: string[] = [];
  let screening: string;
  let monitoring: string;
  let urgency: 'routine' | 'expedited' | 'urgent';
  
  // Screening recommendations
  if (varicesRisk.baveno6Criteria.eligible) {
    screening = 'Endoscopy not required. Reassess in 2-3 years or if clinical decompensation.';
    urgency = 'routine';
  } else if (varicesRisk.risk === 'high') {
    screening = 'Upper endoscopy recommended within 3-6 months.';
    urgency = 'expedited';
  } else if (varicesRisk.risk === 'intermediate') {
    screening = 'Upper endoscopy recommended within 6-12 months.';
    urgency = 'routine';
  } else {
    screening = 'Consider endoscopy within 1-2 years.';
    urgency = 'routine';
  }
  
  // Prophylaxis recommendations
  if (params.endoscopy?.varicesPresent) {
    if (params.endoscopy.varicesSize === 'large' || 
        params.endoscopy.redWhaleSigns ||
        params.clinical.childPughClass === 'C') {
      prophylaxis.push('Primary prophylaxis with non-selective beta-blockers (propranolol or nadolol)');
      prophylaxis.push('Consider endoscopic band ligation for large varices');
    } else if (params.endoscopy.varicesSize === 'medium') {
      prophylaxis.push('Consider beta-blocker prophylaxis');
      prophylaxis.push('Monitor for progression');
    } else {
      prophylaxis.push('Beta-blocker prophylaxis may be considered');
      prophylaxis.push('Close monitoring for progression');
    }
    
    if (params.clinical.previousBleeding) {
      prophylaxis.push('Secondary prophylaxis mandatory: beta-blockers + endoscopic band ligation');
      urgency = 'urgent';
    }
  }
  
  // Monitoring recommendations
  if (params.endoscopy?.varicesPresent) {
    if (bleedingRisk.risk === 'high') {
      monitoring = 'Endoscopic surveillance every 6-12 months';
    } else if (bleedingRisk.risk === 'intermediate') {
      monitoring = 'Endoscopic surveillance every 1-2 years';
    } else {
      monitoring = 'Endoscopic surveillance every 2-3 years';
    }
  } else {
    monitoring = 'Screen for varices development every 2-3 years in cirrhotic patients';
  }
  
  return {
    screening,
    prophylaxis,
    monitoring,
    urgency
  };
}

/**
 * Main varices risk calculator function
 */
export function calculateVaricealRisk(params: VaricealRiskParameters): VaricealRiskResult {
  // Assess varices presence risk
  const varicesPresenceRisk = assessVaricesPresenceRisk(params);
  
  // Assess bleeding risk
  const bleedingRisk = assessBleedingRisk(params);
  
  // Assess portal hypertension
  const portalHypertension = assessPortalHypertension(params);
  
  // Generate recommendations
  const recommendations = generateRecommendations(varicesPresenceRisk, bleedingRisk, params);
  
  // Calculate confidence based on available data
  let confidence = 1.0;
  
  if (!params.imaging) confidence -= 0.1;
  if (!params.endoscopy && varicesPresenceRisk.risk !== 'low') confidence -= 0.2;
  if (!params.clinical.meldScore && !params.clinical.albumin) confidence -= 0.1;
  
  return {
    varicesPresenceRisk,
    bleedingRisk,
    portalHypertension,
    recommendations,
    confidence: Math.max(confidence, 0.6)
  };
}

/**
 * Quick risk assessment with minimal parameters
 */
export function quickVaricealRisk(
  platelets: number,
  childPughClass: 'A' | 'B' | 'C',
  hasAscites: boolean,
  previousBleeding: boolean = false
): VaricealRiskResult {
  const params: VaricealRiskParameters = {
    platelets,
    clinical: {
      childPughClass,
      previousBleeding,
      alcoholUse: 'none',
      betaBlockerUse: false
    },
    imaging: {
      spleenSize: platelets < 100 ? 'moderate_enlargement' : 'normal',
      ascites: hasAscites ? 'mild' : 'none',
      collaterals: 'none'
    }
  };
  
  return calculateVaricealRisk(params);
}

/**
 * Extract varices risk parameters from available data
 */
export function extractVaricealRiskParameters(
  charts: any[],
  childPughClass?: 'A' | 'B' | 'C',
  meldScore?: number
): Partial<VaricealRiskParameters> {
  const params: Partial<VaricealRiskParameters> = {};
  
  // Extract platelet count
  const plateletsChart = charts.find(c => c.title === 'Platelets');
  if (plateletsChart?.data?.length > 0) {
    const latest = plateletsChart.data.filter((d: any) => d.value !== null).pop();
    if (latest) {
      params.platelets = latest.value;
    }
  }
  
  // Add clinical data if available
  if (childPughClass || meldScore) {
    params.clinical = {
      childPughClass: childPughClass || 'A',
      meldScore,
      previousBleeding: false,
      alcoholUse: 'none',
      betaBlockerUse: false
    };
  }
  
  return params;
}
