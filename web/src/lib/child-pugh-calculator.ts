/**
 * Child-Pugh Score Calculator for Liver Function Assessment
 * 
 * The Child-Pugh score is a system for assessing the prognosis of chronic liver disease,
 * mainly cirrhosis. It provides a forecast of the increasing severity of your liver disease
 * and your expected survival rate.
 * 
 * Scoring Parameters:
 * - Total Bilirubin (mg/dL or μmol/L)
 * - Serum Albumin (g/dL or g/L)
 * - INR (International Normalized Ratio)
 * - Ascites (clinical assessment)
 * - Hepatic Encephalopathy (West Haven criteria)
 */

export interface ChildPughParameters {
  // Laboratory values
  bilirubin: number; // mg/dL
  albumin: number; // g/dL
  inr: number;
  
  // Clinical assessments
  ascites: 'none' | 'slight' | 'moderate';
  encephalopathy: 'none' | 'grade1-2' | 'grade3-4';
  
  // Optional metadata
  units?: {
    bilirubin?: 'mg/dL' | 'μmol/L';
    albumin?: 'g/dL' | 'g/L';
  };
}

export interface ChildPughResult {
  score: number;
  class: 'A' | 'B' | 'C';
  breakdown: {
    bilirubin: { value: number; points: number; interpretation: string };
    albumin: { value: number; points: number; interpretation: string };
    inr: { value: number; points: number; interpretation: string };
    ascites: { value: string; points: number; interpretation: string };
    encephalopathy: { value: string; points: number; interpretation: string };
  };
  interpretation: {
    mortality: string;
    survival: string;
    recommendations: string[];
    severity: 'Mild' | 'Moderate' | 'Severe';
  };
  confidence: number;
  warnings: string[];
}

/**
 * Convert units to standard format (mg/dL for bilirubin, g/dL for albumin)
 */
function convertUnits(params: ChildPughParameters): ChildPughParameters {
  const converted = { ...params };
  
  // Convert bilirubin from μmol/L to mg/dL if needed
  if (params.units?.bilirubin === 'μmol/L') {
    converted.bilirubin = params.bilirubin / 17.1; // μmol/L to mg/dL conversion
  }
  
  // Convert albumin from g/L to g/dL if needed
  if (params.units?.albumin === 'g/L') {
    converted.albumin = params.albumin / 10; // g/L to g/dL conversion
  }
  
  return converted;
}

/**
 * Calculate points for each Child-Pugh parameter
 */
function calculateParameterPoints(params: ChildPughParameters) {
  const converted = convertUnits(params);
  
  // Bilirubin points
  let bilirubinPoints: number;
  let bilirubinInterpretation: string;
  if (converted.bilirubin < 2.0) {
    bilirubinPoints = 1;
    bilirubinInterpretation = 'Normal';
  } else if (converted.bilirubin <= 3.0) {
    bilirubinPoints = 2;
    bilirubinInterpretation = 'Mildly elevated';
  } else {
    bilirubinPoints = 3;
    bilirubinInterpretation = 'Significantly elevated';
  }
  
  // Albumin points
  let albuminPoints: number;
  let albuminInterpretation: string;
  if (converted.albumin > 3.5) {
    albuminPoints = 1;
    albuminInterpretation = 'Normal';
  } else if (converted.albumin >= 2.8) {
    albuminPoints = 2;
    albuminInterpretation = 'Mildly decreased';
  } else {
    albuminPoints = 3;
    albuminInterpretation = 'Significantly decreased';
  }
  
  // INR points
  let inrPoints: number;
  let inrInterpretation: string;
  if (converted.inr < 1.7) {
    inrPoints = 1;
    inrInterpretation = 'Normal coagulation';
  } else if (converted.inr <= 2.3) {
    inrPoints = 2;
    inrInterpretation = 'Mild coagulopathy';
  } else {
    inrPoints = 3;
    inrInterpretation = 'Severe coagulopathy';
  }
  
  // Ascites points
  let ascitesPoints: number;
  let ascitesInterpretation: string;
  switch (params.ascites) {
    case 'none':
      ascitesPoints = 1;
      ascitesInterpretation = 'No ascites';
      break;
    case 'slight':
      ascitesPoints = 2;
      ascitesInterpretation = 'Slight ascites (controlled with diuretics)';
      break;
    case 'moderate':
      ascitesPoints = 3;
      ascitesInterpretation = 'Moderate ascites (despite diuretics)';
      break;
  }
  
  // Encephalopathy points
  let encephalopathyPoints: number;
  let encephalopathyInterpretation: string;
  switch (params.encephalopathy) {
    case 'none':
      encephalopathyPoints = 1;
      encephalopathyInterpretation = 'No encephalopathy';
      break;
    case 'grade1-2':
      encephalopathyPoints = 2;
      encephalopathyInterpretation = 'Grade 1-2 encephalopathy (mild-moderate)';
      break;
    case 'grade3-4':
      encephalopathyPoints = 3;
      encephalopathyInterpretation = 'Grade 3-4 encephalopathy (severe)';
      break;
  }
  
  return {
    bilirubin: { value: converted.bilirubin, points: bilirubinPoints, interpretation: bilirubinInterpretation },
    albumin: { value: converted.albumin, points: albuminPoints, interpretation: albuminInterpretation },
    inr: { value: converted.inr, points: inrPoints, interpretation: inrInterpretation },
    ascites: { value: params.ascites, points: ascitesPoints, interpretation: ascitesInterpretation },
    encephalopathy: { value: params.encephalopathy, points: encephalopathyPoints, interpretation: encephalopathyInterpretation }
  };
}

/**
 * Get interpretation based on Child-Pugh score and class
 */
function getInterpretation(score: number, childPughClass: 'A' | 'B' | 'C') {
  switch (childPughClass) {
    case 'A':
      return {
        mortality: '1-year mortality: 0-10%',
        survival: '2-year survival: >95%',
        recommendations: [
          'Continue regular monitoring',
          'Focus on lifestyle modifications',
          'Screen for complications every 6-12 months',
          'Consider hepatitis vaccination if indicated'
        ],
        severity: 'Mild' as const
      };
    case 'B':
      return {
        mortality: '1-year mortality: 10-30%',
        survival: '2-year survival: 80-90%',
        recommendations: [
          'More frequent monitoring (every 3-6 months)',
          'Screen for varices and complications',
          'Consider transplant evaluation',
          'Optimize medical management',
          'Avoid hepatotoxic medications'
        ],
        severity: 'Moderate' as const
      };
    case 'C':
      return {
        mortality: '1-year mortality: 30-100%',
        survival: '2-year survival: 35-65%',
        recommendations: [
          'Urgent transplant evaluation',
          'Frequent monitoring (monthly)',
          'Aggressive management of complications',
          'Consider palliative care consultation',
          'Family counseling and support'
        ],
        severity: 'Severe' as const
      };
  }
}

/**
 * Calculate confidence based on parameter reliability
 */
function calculateConfidence(params: ChildPughParameters): number {
  let confidence = 1.0;
  
  // Reduce confidence for extreme values that might indicate measurement error
  if (params.bilirubin > 20 || params.bilirubin < 0.1) confidence -= 0.1;
  if (params.albumin > 6 || params.albumin < 1) confidence -= 0.1;
  if (params.inr > 5 || params.inr < 0.8) confidence -= 0.1;
  
  return Math.max(confidence, 0.7); // Minimum 70% confidence
}

/**
 * Generate warnings for unusual values or clinical considerations
 */
function generateWarnings(params: ChildPughParameters): string[] {
  const warnings: string[] = [];
  const converted = convertUnits(params);
  
  if (converted.bilirubin > 10) {
    warnings.push('Extremely high bilirubin - verify measurement and consider acute hepatic failure');
  }
  
  if (converted.albumin < 2.0) {
    warnings.push('Very low albumin - consider nutritional support and protein supplementation');
  }
  
  if (params.inr > 3.0) {
    warnings.push('Severe coagulopathy - bleeding risk assessment needed');
  }
  
  if (params.ascites === 'moderate' && params.encephalopathy === 'grade3-4') {
    warnings.push('Both moderate ascites and severe encephalopathy present - urgent medical attention required');
  }
  
  if (converted.bilirubin > 3 && converted.albumin < 2.5 && params.inr > 2.0) {
    warnings.push('Multiple severe parameters - consider immediate hepatology consultation');
  }
  
  return warnings;
}

/**
 * Main Child-Pugh calculator function
 */
export function calculateChildPugh(params: ChildPughParameters): ChildPughResult {
  // Validate input parameters
  if (!params.bilirubin || !params.albumin || !params.inr) {
    throw new Error('Missing required laboratory values for Child-Pugh calculation');
  }
  
  if (params.bilirubin <= 0 || params.albumin <= 0 || params.inr <= 0) {
    throw new Error('Laboratory values must be positive numbers');
  }
  
  // Calculate points for each parameter
  const breakdown = calculateParameterPoints(params);
  
  // Calculate total score
  const score = breakdown.bilirubin.points + 
                breakdown.albumin.points + 
                breakdown.inr.points + 
                breakdown.ascites.points + 
                breakdown.encephalopathy.points;
  
  // Determine Child-Pugh class
  let childPughClass: 'A' | 'B' | 'C';
  if (score <= 6) {
    childPughClass = 'A';
  } else if (score <= 9) {
    childPughClass = 'B';
  } else {
    childPughClass = 'C';
  }
  
  // Get interpretation
  const interpretation = getInterpretation(score, childPughClass);
  
  // Calculate confidence and generate warnings
  const confidence = calculateConfidence(params);
  const warnings = generateWarnings(params);
  
  return {
    score,
    class: childPughClass,
    breakdown,
    interpretation,
    confidence,
    warnings
  };
}

/**
 * Extract Child-Pugh parameters from available chart data
 */
export function extractChildPughParameters(charts: any[]): Partial<ChildPughParameters> {
  const params: Partial<ChildPughParameters> = {};
  
  // Find relevant lab values
  const bilirubinChart = charts.find(c => c.title === 'Bilirubin' || c.title === 'Total Bilirubin');
  const albuminChart = charts.find(c => c.title === 'Albumin');
  const inrChart = charts.find(c => c.title === 'INR');
  
  // Get most recent values
  if (bilirubinChart?.data?.length > 0) {
    const latestBilirubin = bilirubinChart.data
      .filter((d: any) => d.value !== null)
      .pop();
    if (latestBilirubin) {
      params.bilirubin = latestBilirubin.value;
    }
  }
  
  if (albuminChart?.data?.length > 0) {
    const latestAlbumin = albuminChart.data
      .filter((d: any) => d.value !== null)
      .pop();
    if (latestAlbumin) {
      params.albumin = latestAlbumin.value;
    }
  }
  
  if (inrChart?.data?.length > 0) {
    const latestINR = inrChart.data
      .filter((d: any) => d.value !== null)
      .pop();
    if (latestINR) {
      params.inr = latestINR.value;
    }
  }
  
  return params;
}

/**
 * Validate if Child-Pugh calculation is possible with available data
 */
export function validateChildPughData(params: Partial<ChildPughParameters>): {
  canCalculate: boolean;
  missingLabs: string[];
  missingClinical: string[];
} {
  const missingLabs: string[] = [];
  const missingClinical: string[] = [];
  
  if (!params.bilirubin) missingLabs.push('Total Bilirubin');
  if (!params.albumin) missingLabs.push('Albumin');
  if (!params.inr) missingLabs.push('INR');
  
  if (!params.ascites) missingClinical.push('Ascites Assessment');
  if (!params.encephalopathy) missingClinical.push('Hepatic Encephalopathy Assessment');
  
  const canCalculate = missingLabs.length === 0 && missingClinical.length === 0;
  
  return {
    canCalculate,
    missingLabs,
    missingClinical
  };
}
