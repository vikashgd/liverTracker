/**
 * Liver Transplant Readiness Assessment Tool
 * 
 * This tool evaluates a patient's readiness for liver transplantation based on:
 * - UNOS (United Network for Organ Sharing) criteria
 * - Medical contraindications
 * - Psychosocial factors
 * - Comorbidity assessment
 * 
 * Used in conjunction with MELD and Child-Pugh scores for comprehensive evaluation.
 */

export interface TransplantReadinessParameters {
  // Demographics
  age: number;
  
  // Primary liver disease
  primaryDiagnosis: 'hepatitis_c' | 'hepatitis_b' | 'alcoholic_liver_disease' | 'nash' | 'pbc' | 'psc' | 'autoimmune' | 'wilson' | 'hemochromatosis' | 'other';
  
  // Laboratory values (most recent)
  meldScore?: number;
  childPughClass?: 'A' | 'B' | 'C';
  
  // Complications
  complications: {
    varicesWithBleeding: boolean;
    ascites: 'none' | 'controlled' | 'refractory';
    hepaticEncephalopathy: 'none' | 'episodic' | 'persistent';
    spontaneousBacterialPeritonitis: boolean;
    hepatocellularCarcinoma: boolean;
    hepatopulmonarySyndrome: boolean;
    portopulmonaryHypertension: boolean;
  };
  
  // Comorbidities
  comorbidities: {
    cardiovascularDisease: 'none' | 'mild' | 'moderate' | 'severe';
    pulmonaryDisease: 'none' | 'mild' | 'moderate' | 'severe';
    renalDisease: 'none' | 'mild' | 'moderate' | 'severe';
    diabetes: boolean;
    osteoporosis: boolean;
    activeInfection: boolean;
    malignancy: 'none' | 'treated' | 'active';
  };
  
  // Psychosocial factors
  psychosocial: {
    substanceAbuse: {
      alcohol: 'none' | 'past' | 'current';
      drugs: 'none' | 'past' | 'current';
      sobrietyDuration?: number; // months
    };
    socialSupport: 'excellent' | 'good' | 'fair' | 'poor';
    mentalHealth: 'stable' | 'mild_issues' | 'moderate_issues' | 'severe_issues';
    compliance: 'excellent' | 'good' | 'fair' | 'poor';
  };
  
  // Functional status
  functionalStatus: {
    karnofskyScore?: number; // 0-100
    ecogStatus?: 0 | 1 | 2 | 3 | 4;
    independentLiving: boolean;
  };
}

export interface TransplantReadinessResult {
  overallStatus: 'excellent_candidate' | 'good_candidate' | 'marginal_candidate' | 'poor_candidate' | 'contraindicated';
  score: number; // 0-100 scale
  
  breakdown: {
    medicalCriteria: {
      score: number;
      factors: Array<{
        category: string;
        status: 'favorable' | 'neutral' | 'concerning' | 'contraindication';
        impact: string;
      }>;
    };
    psychosocialCriteria: {
      score: number;
      factors: Array<{
        category: string;
        status: 'favorable' | 'neutral' | 'concerning' | 'contraindication';
        impact: string;
      }>;
    };
    functionalCriteria: {
      score: number;
      factors: Array<{
        category: string;
        status: 'favorable' | 'neutral' | 'concerning' | 'contraindication';
        impact: string;
      }>;
    };
  };
  
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  
  contraindications: {
    absolute: string[];
    relative: string[];
  };
  
  priorityFactors: Array<{
    factor: string;
    urgency: 'immediate' | 'urgent' | 'routine';
    description: string;
  }>;
  
  estimatedWaitTime: {
    bloodType: string;
    region: string;
    estimate: string;
    factors: string[];
  } | null;
}

/**
 * Evaluate medical criteria for transplant readiness
 */
function evaluateMedicalCriteria(params: TransplantReadinessParameters) {
  const factors: Array<{
    category: string;
    status: 'favorable' | 'neutral' | 'concerning' | 'contraindication';
    impact: string;
  }> = [];
  
  let score = 50; // Start with neutral score
  
  // Age assessment
  if (params.age < 18) {
    factors.push({
      category: 'Age',
      status: 'concerning',
      impact: 'Pediatric transplant requires specialized evaluation'
    });
    score -= 10;
  } else if (params.age <= 65) {
    factors.push({
      category: 'Age',
      status: 'favorable',
      impact: 'Age within optimal range for transplantation'
    });
    score += 10;
  } else if (params.age <= 75) {
    factors.push({
      category: 'Age',
      status: 'concerning',
      impact: 'Advanced age requires careful evaluation of comorbidities'
    });
    score -= 5;
  } else {
    factors.push({
      category: 'Age',
      status: 'contraindication',
      impact: 'Age >75 is relative contraindication'
    });
    score -= 20;
  }
  
  // MELD Score assessment
  if (params.meldScore) {
    if (params.meldScore >= 15) {
      factors.push({
        category: 'MELD Score',
        status: 'favorable',
        impact: `MELD ${params.meldScore} indicates appropriate transplant timing`
      });
      score += 15;
    } else if (params.meldScore >= 10) {
      factors.push({
        category: 'MELD Score',
        status: 'neutral',
        impact: `MELD ${params.meldScore} - monitor for progression`
      });
    } else {
      factors.push({
        category: 'MELD Score',
        status: 'concerning',
        impact: `MELD ${params.meldScore} may be too low for transplant listing`
      });
      score -= 10;
    }
  }
  
  // Complications assessment
  if (params.complications.varicesWithBleeding) {
    factors.push({
      category: 'Variceal Bleeding',
      status: 'favorable',
      impact: 'History of variceal bleeding supports transplant indication'
    });
    score += 5;
  }
  
  if (params.complications.ascites === 'refractory') {
    factors.push({
      category: 'Refractory Ascites',
      status: 'favorable',
      impact: 'Refractory ascites supports transplant indication'
    });
    score += 5;
  }
  
  if (params.complications.hepaticEncephalopathy === 'persistent') {
    factors.push({
      category: 'Hepatic Encephalopathy',
      status: 'favorable',
      impact: 'Persistent encephalopathy supports transplant indication'
    });
    score += 5;
  }
  
  if (params.complications.hepatocellularCarcinoma) {
    factors.push({
      category: 'Hepatocellular Carcinoma',
      status: 'concerning',
      impact: 'HCC requires Milan criteria evaluation and oncology clearance'
    });
    score -= 5;
  }
  
  // Comorbidities assessment
  if (params.comorbidities.cardiovascularDisease === 'severe') {
    factors.push({
      category: 'Cardiovascular Disease',
      status: 'contraindication',
      impact: 'Severe cardiovascular disease may preclude transplantation'
    });
    score -= 25;
  } else if (params.comorbidities.cardiovascularDisease === 'moderate') {
    factors.push({
      category: 'Cardiovascular Disease',
      status: 'concerning',
      impact: 'Requires cardiac clearance and risk stratification'
    });
    score -= 10;
  }
  
  if (params.comorbidities.pulmonaryDisease === 'severe') {
    factors.push({
      category: 'Pulmonary Disease',
      status: 'contraindication',
      impact: 'Severe pulmonary disease may preclude transplantation'
    });
    score -= 25;
  }
  
  if (params.comorbidities.renalDisease === 'severe') {
    factors.push({
      category: 'Renal Disease',
      status: 'concerning',
      impact: 'May require combined liver-kidney transplantation'
    });
    score -= 15;
  }
  
  if (params.comorbidities.activeInfection) {
    factors.push({
      category: 'Active Infection',
      status: 'contraindication',
      impact: 'Active infection must be resolved before transplantation'
    });
    score -= 30;
  }
  
  if (params.comorbidities.malignancy === 'active') {
    factors.push({
      category: 'Active Malignancy',
      status: 'contraindication',
      impact: 'Active malignancy (except HCC within criteria) precludes transplantation'
    });
    score -= 40;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
}

/**
 * Evaluate psychosocial criteria for transplant readiness
 */
function evaluatePsychosocialCriteria(params: TransplantReadinessParameters) {
  const factors: Array<{
    category: string;
    status: 'favorable' | 'neutral' | 'concerning' | 'contraindication';
    impact: string;
  }> = [];
  
  let score = 50; // Start with neutral score
  
  // Substance abuse assessment
  if (params.psychosocial.substanceAbuse.alcohol === 'current') {
    factors.push({
      category: 'Alcohol Use',
      status: 'contraindication',
      impact: 'Current alcohol use is absolute contraindication'
    });
    score -= 40;
  } else if (params.psychosocial.substanceAbuse.alcohol === 'past') {
    const sobrietyMonths = params.psychosocial.substanceAbuse.sobrietyDuration || 0;
    if (sobrietyMonths >= 6) {
      factors.push({
        category: 'Alcohol Sobriety',
        status: 'favorable',
        impact: `${sobrietyMonths} months sobriety demonstrates commitment`
      });
      score += 10;
    } else {
      factors.push({
        category: 'Alcohol Sobriety',
        status: 'concerning',
        impact: 'Minimum 6 months sobriety typically required'
      });
      score -= 15;
    }
  }
  
  if (params.psychosocial.substanceAbuse.drugs === 'current') {
    factors.push({
      category: 'Drug Use',
      status: 'contraindication',
      impact: 'Current illicit drug use is contraindication'
    });
    score -= 30;
  }
  
  // Social support assessment
  switch (params.psychosocial.socialSupport) {
    case 'excellent':
      factors.push({
        category: 'Social Support',
        status: 'favorable',
        impact: 'Strong support system improves outcomes'
      });
      score += 15;
      break;
    case 'poor':
      factors.push({
        category: 'Social Support',
        status: 'concerning',
        impact: 'Poor social support may affect post-transplant care'
      });
      score -= 10;
      break;
  }
  
  // Mental health assessment
  if (params.psychosocial.mentalHealth === 'severe_issues') {
    factors.push({
      category: 'Mental Health',
      status: 'concerning',
      impact: 'Severe mental health issues require psychiatric evaluation'
    });
    score -= 15;
  }
  
  // Compliance assessment
  if (params.psychosocial.compliance === 'poor') {
    factors.push({
      category: 'Medical Compliance',
      status: 'concerning',
      impact: 'Poor compliance affects post-transplant outcomes'
    });
    score -= 20;
  } else if (params.psychosocial.compliance === 'excellent') {
    factors.push({
      category: 'Medical Compliance',
      status: 'favorable',
      impact: 'Excellent compliance supports successful outcomes'
    });
    score += 10;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
}

/**
 * Evaluate functional criteria for transplant readiness
 */
function evaluateFunctionalCriteria(params: TransplantReadinessParameters) {
  const factors: Array<{
    category: string;
    status: 'favorable' | 'neutral' | 'concerning' | 'contraindication';
    impact: string;
  }> = [];
  
  let score = 50; // Start with neutral score
  
  // Karnofsky score assessment
  if (params.functionalStatus.karnofskyScore) {
    const karnofsky = params.functionalStatus.karnofskyScore;
    if (karnofsky >= 70) {
      factors.push({
        category: 'Functional Status',
        status: 'favorable',
        impact: `Karnofsky ${karnofsky}% indicates good functional capacity`
      });
      score += 15;
    } else if (karnofsky >= 50) {
      factors.push({
        category: 'Functional Status',
        status: 'concerning',
        impact: `Karnofsky ${karnofsky}% indicates limited functional capacity`
      });
      score -= 10;
    } else {
      factors.push({
        category: 'Functional Status',
        status: 'contraindication',
        impact: `Karnofsky ${karnofsky}% may preclude transplantation`
      });
      score -= 25;
    }
  }
  
  // ECOG status assessment
  if (params.functionalStatus.ecogStatus !== undefined) {
    const ecog = params.functionalStatus.ecogStatus;
    if (ecog <= 1) {
      factors.push({
        category: 'ECOG Performance',
        status: 'favorable',
        impact: `ECOG ${ecog} indicates good performance status`
      });
      score += 10;
    } else if (ecog <= 2) {
      factors.push({
        category: 'ECOG Performance',
        status: 'concerning',
        impact: `ECOG ${ecog} indicates limited activity tolerance`
      });
      score -= 10;
    } else {
      factors.push({
        category: 'ECOG Performance',
        status: 'contraindication',
        impact: `ECOG ${ecog} may preclude transplantation`
      });
      score -= 25;
    }
  }
  
  // Independent living assessment
  if (params.functionalStatus.independentLiving) {
    factors.push({
      category: 'Independent Living',
      status: 'favorable',
      impact: 'Independent living demonstrates functional capacity'
    });
    score += 5;
  } else {
    factors.push({
      category: 'Independent Living',
      status: 'concerning',
      impact: 'Assisted living may indicate functional limitations'
    });
    score -= 5;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
}

/**
 * Generate recommendations based on assessment
 */
function generateRecommendations(
  overallStatus: string,
  medicalFactors: any[],
  psychosocialFactors: any[],
  functionalFactors: any[]
) {
  const immediate: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];
  
  // Check for immediate contraindications
  const allFactors = [...medicalFactors, ...psychosocialFactors, ...functionalFactors];
  const contraindications = allFactors.filter(f => f.status === 'contraindication');
  
  contraindications.forEach(factor => {
    if (factor.category === 'Active Infection') {
      immediate.push('Treat active infection before proceeding with evaluation');
    }
    if (factor.category === 'Alcohol Use') {
      immediate.push('Initiate alcohol cessation program and addiction counseling');
    }
    if (factor.category === 'Drug Use') {
      immediate.push('Address substance abuse with addiction medicine specialist');
    }
  });
  
  // Short-term recommendations
  if (overallStatus !== 'contraindicated') {
    shortTerm.push('Complete comprehensive transplant evaluation');
    shortTerm.push('Obtain multidisciplinary team assessment');
    shortTerm.push('Update vaccination status');
    shortTerm.push('Dental clearance examination');
  }
  
  const concerningFactors = allFactors.filter(f => f.status === 'concerning');
  concerningFactors.forEach(factor => {
    if (factor.category === 'Cardiovascular Disease') {
      shortTerm.push('Cardiac evaluation and risk stratification');
    }
    if (factor.category === 'Mental Health') {
      shortTerm.push('Psychiatric evaluation and treatment optimization');
    }
    if (factor.category === 'Social Support') {
      shortTerm.push('Social work assessment and support system strengthening');
    }
  });
  
  // Long-term recommendations
  longTerm.push('Regular monitoring of liver function and MELD score');
  longTerm.push('Maintenance of optimal medical management');
  longTerm.push('Lifestyle modifications to optimize health');
  longTerm.push('Ongoing psychosocial support and monitoring');
  
  return { immediate, shortTerm, longTerm };
}

/**
 * Main transplant readiness calculator function
 */
export function calculateTransplantReadiness(params: TransplantReadinessParameters): TransplantReadinessResult {
  // Evaluate each criteria category
  const medicalCriteria = evaluateMedicalCriteria(params);
  const psychosocialCriteria = evaluatePsychosocialCriteria(params);
  const functionalCriteria = evaluateFunctionalCriteria(params);
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (medicalCriteria.score * 0.5) + 
    (psychosocialCriteria.score * 0.3) + 
    (functionalCriteria.score * 0.2)
  );
  
  // Determine overall status
  let overallStatus: 'excellent_candidate' | 'good_candidate' | 'marginal_candidate' | 'poor_candidate' | 'contraindicated';
  
  const allFactors = [
    ...medicalCriteria.factors,
    ...psychosocialCriteria.factors,
    ...functionalCriteria.factors
  ];
  
  const hasAbsoluteContraindication = allFactors.some(f => 
    f.status === 'contraindication' && 
    (f.category === 'Active Infection' || f.category === 'Alcohol Use' || f.category === 'Active Malignancy')
  );
  
  if (hasAbsoluteContraindication) {
    overallStatus = 'contraindicated';
  } else if (overallScore >= 80) {
    overallStatus = 'excellent_candidate';
  } else if (overallScore >= 65) {
    overallStatus = 'good_candidate';
  } else if (overallScore >= 50) {
    overallStatus = 'marginal_candidate';
  } else {
    overallStatus = 'poor_candidate';
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    overallStatus,
    medicalCriteria.factors,
    psychosocialCriteria.factors,
    functionalCriteria.factors
  );
  
  // Identify contraindications
  const absolute: string[] = [];
  const relative: string[] = [];
  
  allFactors.forEach(factor => {
    if (factor.status === 'contraindication') {
      if (['Active Infection', 'Alcohol Use', 'Active Malignancy'].includes(factor.category)) {
        absolute.push(factor.impact);
      } else {
        relative.push(factor.impact);
      }
    }
  });
  
  // Priority factors
  const priorityFactors = allFactors
    .filter(f => f.status === 'contraindication' || f.status === 'concerning')
    .map(f => ({
      factor: f.category,
      urgency: (f.status === 'contraindication' ? 'immediate' : 'urgent') as 'immediate' | 'urgent',
      description: f.impact
    }));
  
  return {
    overallStatus,
    score: overallScore,
    breakdown: {
      medicalCriteria,
      psychosocialCriteria,
      functionalCriteria
    },
    recommendations,
    contraindications: {
      absolute,
      relative
    },
    priorityFactors,
    estimatedWaitTime: null // Would require integration with UNOS data
  };
}
