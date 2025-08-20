/**
 * Additional Liver Function Calculators
 * 
 * This module contains various liver function assessment tools:
 * - FIB-4 Score (Fibrosis-4 Index)
 * - APRI Score (AST to Platelet Ratio Index)
 * - AST/ALT Ratio
 * - NAFLD Fibrosis Score
 * - BARD Score
 */

export interface LiverFunctionParameters {
  age?: number;
  ast?: number; // U/L
  alt?: number; // U/L
  platelets?: number; // x10^9/L or x1000/μL
  albumin?: number; // g/dL
  bilirubin?: number; // mg/dL
  glucose?: number; // mg/dL
  diabetes?: boolean;
  gender?: 'male' | 'female';
  bmi?: number;
}

export interface FIB4Result {
  score: number;
  interpretation: 'low_fibrosis' | 'intermediate' | 'high_fibrosis';
  fibrosisProbability: string;
  recommendation: string;
  confidence: number;
}

export interface APRIResult {
  score: number;
  interpretation: 'low_fibrosis' | 'intermediate' | 'high_fibrosis';
  cirrhosisRisk: string;
  recommendation: string;
  confidence: number;
}

export interface ASTALTRatioResult {
  ratio: number;
  interpretation: string;
  clinicalSignificance: string;
  recommendations: string[];
  confidence: number;
}

export interface NAFLDFibrosisResult {
  score: number;
  interpretation: 'low_risk' | 'intermediate' | 'high_risk';
  recommendation: string;
  confidence: number;
}

export interface BARDResult {
  score: number;
  interpretation: 'low_risk' | 'high_risk';
  recommendation: string;
  confidence: number;
}

export interface ComprehensiveLiverAssessment {
  fib4?: FIB4Result | null;
  apri?: APRIResult | null;
  astAltRatio?: ASTALTRatioResult | null;
  nafldFibrosis?: NAFLDFibrosisResult | null;
  bard?: BARDResult | null;
  
  summary: {
    overallRisk: 'low' | 'intermediate' | 'high';
    keyFindings: string[];
    recommendations: string[];
    conflictingResults: string[];
  };
}

/**
 * Calculate FIB-4 Score
 * Formula: (Age × AST) / (Platelets × √ALT)
 */
export function calculateFIB4(params: LiverFunctionParameters): FIB4Result | null {
  if (!params.age || !params.ast || !params.alt || !params.platelets) {
    return null;
  }
  
  const score = (params.age * params.ast) / (params.platelets * Math.sqrt(params.alt));
  
  let interpretation: 'low_fibrosis' | 'intermediate' | 'high_fibrosis';
  let fibrosisProbability: string;
  let recommendation: string;
  
  if (score < 1.45) {
    interpretation = 'low_fibrosis';
    fibrosisProbability = 'Low probability of advanced fibrosis (<10%)';
    recommendation = 'Routine monitoring. Consider repeat assessment in 2-3 years.';
  } else if (score <= 3.25) {
    interpretation = 'intermediate';
    fibrosisProbability = 'Intermediate probability of advanced fibrosis (10-40%)';
    recommendation = 'Consider liver biopsy or advanced imaging (FibroScan/MR elastography).';
  } else {
    interpretation = 'high_fibrosis';
    fibrosisProbability = 'High probability of advanced fibrosis (>65%)';
    recommendation = 'High likelihood of advanced fibrosis. Hepatology referral recommended.';
  }
  
  // Calculate confidence based on parameter ranges
  let confidence = 1.0;
  if (params.platelets < 50 || params.platelets > 500) confidence -= 0.1;
  if (params.ast > 200 || params.alt > 200) confidence -= 0.1;
  if (params.age < 18 || params.age > 80) confidence -= 0.1;
  
  return {
    score: Math.round(score * 100) / 100,
    interpretation,
    fibrosisProbability,
    recommendation,
    confidence: Math.max(confidence, 0.7)
  };
}

/**
 * Calculate APRI Score
 * Formula: (AST / ULN) / Platelets × 100
 * ULN for AST typically 35 U/L
 */
export function calculateAPRI(params: LiverFunctionParameters): APRIResult | null {
  if (!params.ast || !params.platelets) {
    return null;
  }
  
  const astULN = 35; // Upper limit of normal for AST
  const score = (params.ast / astULN) / params.platelets * 100;
  
  let interpretation: 'low_fibrosis' | 'intermediate' | 'high_fibrosis';
  let cirrhosisRisk: string;
  let recommendation: string;
  
  if (score < 0.5) {
    interpretation = 'low_fibrosis';
    cirrhosisRisk = 'Low risk of significant fibrosis and cirrhosis';
    recommendation = 'Routine monitoring sufficient.';
  } else if (score <= 1.5) {
    interpretation = 'intermediate';
    cirrhosisRisk = 'Intermediate risk - further evaluation needed';
    recommendation = 'Consider additional testing or hepatology consultation.';
  } else {
    interpretation = 'high_fibrosis';
    cirrhosisRisk = 'High risk of cirrhosis (>50% probability)';
    recommendation = 'Hepatology referral and further evaluation recommended.';
  }
  
  // Calculate confidence
  let confidence = 1.0;
  if (params.platelets < 50 || params.platelets > 500) confidence -= 0.1;
  if (params.ast > 200) confidence -= 0.1;
  
  return {
    score: Math.round(score * 100) / 100,
    interpretation,
    cirrhosisRisk,
    recommendation,
    confidence: Math.max(confidence, 0.7)
  };
}

/**
 * Calculate AST/ALT Ratio
 */
export function calculateASTALTRatio(params: LiverFunctionParameters): ASTALTRatioResult | null {
  if (!params.ast || !params.alt) {
    return null;
  }
  
  const ratio = params.ast / params.alt;
  
  let interpretation: string;
  let clinicalSignificance: string;
  const recommendations: string[] = [];
  
  if (ratio < 1.0) {
    interpretation = 'AST < ALT (Normal pattern)';
    clinicalSignificance = 'Typical pattern in most liver diseases, particularly viral hepatitis and NAFLD';
    recommendations.push('Monitor liver enzymes periodically');
    recommendations.push('Consider underlying cause of elevation');
  } else if (ratio >= 1.0 && ratio < 2.0) {
    interpretation = 'AST ≥ ALT (Concerning pattern)';
    clinicalSignificance = 'May suggest alcoholic liver disease, advanced fibrosis, or cirrhosis';
    recommendations.push('Evaluate for alcohol use disorder');
    recommendations.push('Consider fibrosis assessment');
    recommendations.push('Hepatology consultation if persistent');
  } else {
    interpretation = 'AST >> ALT (High concern pattern)';
    clinicalSignificance = 'Strongly suggests alcoholic liver disease, cirrhosis, or acute liver injury';
    recommendations.push('Urgent evaluation for alcoholic liver disease');
    recommendations.push('Assessment for cirrhosis and complications');
    recommendations.push('Consider immediate hepatology consultation');
  }
  
  // Calculate confidence
  let confidence = 1.0;
  if (params.ast > 300 || params.alt > 300) confidence -= 0.1;
  if (params.ast < 20 || params.alt < 20) confidence -= 0.05;
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    interpretation,
    clinicalSignificance,
    recommendations,
    confidence: Math.max(confidence, 0.8)
  };
}

/**
 * Calculate NAFLD Fibrosis Score
 * Formula: -1.675 + 0.037 × age + 0.094 × BMI + 1.13 × IFG/diabetes + 0.99 × AST/ALT ratio - 0.013 × platelet - 0.66 × albumin
 */
export function calculateNAFLDFibrosis(params: LiverFunctionParameters): NAFLDFibrosisResult | null {
  if (!params.age || !params.bmi || !params.ast || !params.alt || !params.platelets || !params.albumin) {
    return null;
  }
  
  const astAltRatio = params.ast / params.alt;
  const diabetesScore = params.diabetes ? 1 : 0;
  
  const score = -1.675 + 
                (0.037 * params.age) + 
                (0.094 * params.bmi) + 
                (1.13 * diabetesScore) + 
                (0.99 * astAltRatio) - 
                (0.013 * params.platelets) - 
                (0.66 * params.albumin);
  
  let interpretation: 'low_risk' | 'intermediate' | 'high_risk';
  let recommendation: string;
  
  if (score < -1.455) {
    interpretation = 'low_risk';
    recommendation = 'Low risk of advanced fibrosis. Routine monitoring and lifestyle modifications.';
  } else if (score <= 0.676) {
    interpretation = 'intermediate';
    recommendation = 'Intermediate risk. Consider FibroScan or liver biopsy for further evaluation.';
  } else {
    interpretation = 'high_risk';
    recommendation = 'High risk of advanced fibrosis. Hepatology referral recommended.';
  }
  
  // Calculate confidence
  let confidence = 1.0;
  if (params.bmi < 18 || params.bmi > 50) confidence -= 0.1;
  if (params.age < 18 || params.age > 80) confidence -= 0.1;
  
  return {
    score: Math.round(score * 100) / 100,
    interpretation,
    recommendation,
    confidence: Math.max(confidence, 0.7)
  };
}

/**
 * Calculate BARD Score
 * BARD = BMI ≥28 (1 point) + AST/ALT ratio ≥0.8 (2 points) + Diabetes (1 point)
 */
export function calculateBARD(params: LiverFunctionParameters): BARDResult | null {
  if (!params.bmi || !params.ast || !params.alt || params.diabetes === undefined) {
    return null;
  }
  
  let score = 0;
  
  if (params.bmi >= 28) score += 1;
  if ((params.ast / params.alt) >= 0.8) score += 2;
  if (params.diabetes) score += 1;
  
  let interpretation: 'low_risk' | 'high_risk';
  let recommendation: string;
  
  if (score <= 2) {
    interpretation = 'low_risk';
    recommendation = 'Low risk of advanced fibrosis (NPV 96%). Routine monitoring sufficient.';
  } else {
    interpretation = 'high_risk';
    recommendation = 'Higher risk of advanced fibrosis. Consider further evaluation with FibroScan or biopsy.';
  }
  
  return {
    score,
    interpretation,
    recommendation,
    confidence: 0.9 // BARD has good validation
  };
}

/**
 * Comprehensive liver function assessment
 */
export function calculateComprehensiveLiverAssessment(params: LiverFunctionParameters): ComprehensiveLiverAssessment {
  const fib4 = calculateFIB4(params);
  const apri = calculateAPRI(params);
  const astAltRatio = calculateASTALTRatio(params);
  const nafldFibrosis = calculateNAFLDFibrosis(params);
  const bard = calculateBARD(params);
  
  // Analyze results for summary
  const results = [fib4, apri, nafldFibrosis, bard].filter((r): r is NonNullable<typeof r> => r !== null);
  const highRiskCount = results.filter(r => 
    ('interpretation' in r) && 
    (r.interpretation === 'high_fibrosis' || r.interpretation === 'high_risk')
  ).length;
  
  const lowRiskCount = results.filter(r => 
    ('interpretation' in r) && 
    (r.interpretation === 'low_fibrosis' || r.interpretation === 'low_risk')
  ).length;
  
  // Determine overall risk
  let overallRisk: 'low' | 'intermediate' | 'high';
  if (highRiskCount >= 2) {
    overallRisk = 'high';
  } else if (lowRiskCount >= 2) {
    overallRisk = 'low';
  } else {
    overallRisk = 'intermediate';
  }
  
  // Generate key findings
  const keyFindings: string[] = [];
  const recommendations: string[] = [];
  const conflictingResults: string[] = [];
  
  if (fib4) {
    keyFindings.push(`FIB-4: ${fib4.score} (${fib4.interpretation.replace('_', ' ')})`);
  }
  
  if (apri) {
    keyFindings.push(`APRI: ${apri.score} (${apri.interpretation.replace('_', ' ')})`);
  }
  
  if (astAltRatio) {
    keyFindings.push(`AST/ALT ratio: ${astAltRatio.ratio}`);
    if (astAltRatio.ratio >= 2.0) {
      keyFindings.push('⚠️ Very high AST/ALT ratio suggests advanced disease');
    }
  }
  
  // Check for conflicting results
  if (fib4 && apri) {
    if ((fib4.interpretation === 'high_fibrosis' && apri.interpretation === 'low_fibrosis') ||
        (fib4.interpretation === 'low_fibrosis' && apri.interpretation === 'high_fibrosis')) {
      conflictingResults.push('FIB-4 and APRI scores show conflicting results - consider additional testing');
    }
  }
  
  // Generate recommendations based on overall risk
  switch (overallRisk) {
    case 'high':
      recommendations.push('Hepatology referral recommended');
      recommendations.push('Consider liver biopsy or FibroScan');
      recommendations.push('Monitor for complications of cirrhosis');
      break;
    case 'intermediate':
      recommendations.push('Consider additional testing (FibroScan, MR elastography)');
      recommendations.push('Repeat assessment in 6-12 months');
      recommendations.push('Address modifiable risk factors');
      break;
    case 'low':
      recommendations.push('Routine monitoring sufficient');
      recommendations.push('Focus on lifestyle modifications');
      recommendations.push('Repeat assessment in 2-3 years');
      break;
  }
  
  return {
    fib4,
    apri,
    astAltRatio,
    nafldFibrosis,
    bard,
    summary: {
      overallRisk,
      keyFindings,
      recommendations,
      conflictingResults
    }
  };
}

/**
 * Extract liver function parameters from chart data
 */
export function extractLiverFunctionParameters(charts: any[], patientAge?: number, patientGender?: 'male' | 'female'): LiverFunctionParameters {
  const params: LiverFunctionParameters = {};
  
  if (patientAge) params.age = patientAge;
  if (patientGender) params.gender = patientGender;
  
  // Find relevant charts and extract latest values
  const astChart = charts.find(c => c.title === 'AST');
  const altChart = charts.find(c => c.title === 'ALT');
  const plateletsChart = charts.find(c => c.title === 'Platelets');
  const albuminChart = charts.find(c => c.title === 'Albumin');
  const bilirubinChart = charts.find(c => c.title === 'Bilirubin' || c.title === 'Total Bilirubin');
  
  if (astChart?.data?.length > 0) {
    const latest = astChart.data.filter((d: any) => d.value !== null).pop();
    if (latest) params.ast = latest.value;
  }
  
  if (altChart?.data?.length > 0) {
    const latest = altChart.data.filter((d: any) => d.value !== null).pop();
    if (latest) params.alt = latest.value;
  }
  
  if (plateletsChart?.data?.length > 0) {
    const latest = plateletsChart.data.filter((d: any) => d.value !== null).pop();
    if (latest) params.platelets = latest.value;
  }
  
  if (albuminChart?.data?.length > 0) {
    const latest = albuminChart.data.filter((d: any) => d.value !== null).pop();
    if (latest) params.albumin = latest.value;
  }
  
  if (bilirubinChart?.data?.length > 0) {
    const latest = bilirubinChart.data.filter((d: any) => d.value !== null).pop();
    if (latest) params.bilirubin = latest.value;
  }
  
  return params;
}
