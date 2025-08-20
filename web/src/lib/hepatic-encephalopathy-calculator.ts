/**
 * Hepatic Encephalopathy Assessment - West Haven Criteria
 * 
 * The West Haven Criteria is the most widely used classification system
 * for hepatic encephalopathy, categorizing severity from Grade 0 to Grade 4.
 */

export interface HepaticEncephalopathyAssessment {
  // Clinical observations
  mentalState: {
    consciousness: 'normal' | 'drowsy' | 'stuporous' | 'comatose';
    orientation: 'oriented' | 'mild_confusion' | 'moderate_confusion' | 'severe_confusion' | 'disoriented';
    attentionSpan: 'normal' | 'shortened' | 'very_poor' | 'absent';
  };
  
  // Neurological signs
  neurologicalSigns: {
    asterixis: 'absent' | 'mild' | 'moderate' | 'severe';
    tremor: 'absent' | 'present';
    reflexes: 'normal' | 'hyperreflexia' | 'hyporeflexia' | 'absent';
    muscularCoordination: 'normal' | 'impaired' | 'severely_impaired';
  };
  
  // Behavioral changes
  behavioral: {
    personality: 'normal' | 'mild_changes' | 'moderate_changes' | 'severe_changes';
    sleepPattern: 'normal' | 'mild_disturbance' | 'day_night_reversal' | 'severe_disturbance';
    speechPattern: 'normal' | 'slow' | 'slurred' | 'incomprehensible' | 'absent';
  };
  
  // Psychometric tests (if available)
  psychometric?: {
    numberConnectionTest: number; // seconds to complete
    digitSymbolTest?: number; // score
    blockDesignTest?: number; // score
  };
  
  // Precipitating factors
  precipitatingFactors: {
    infection: boolean;
    gastrointestinalBleeding: boolean;
    constipation: boolean;
    dehydration: boolean;
    electrolyteImbalance: boolean;
    medicationNoncompliance: boolean;
    alcoholIntake: boolean;
    sedativeMedications: boolean;
    proteinOverload: boolean;
    surgicalStress: boolean;
  };
}

export interface HepaticEncephalopathyResult {
  grade: 0 | 1 | 2 | 3 | 4;
  severity: 'none' | 'minimal' | 'mild' | 'moderate' | 'severe';
  description: string;
  clinicalFeatures: string[];
  managementRecommendations: string[];
  monitoringGuidelines: string[];
  precipitatingFactors: string[];
  prognosis: {
    reversibility: 'fully_reversible' | 'mostly_reversible' | 'partially_reversible' | 'poor_reversibility';
    urgency: 'routine' | 'urgent' | 'emergency';
    mortality: string;
  };
  confidence: number;
}

/**
 * Assess hepatic encephalopathy grade based on West Haven Criteria
 */
export function assessHepaticEncephalopathy(assessment: HepaticEncephalopathyAssessment): HepaticEncephalopathyResult {
  let grade: 0 | 1 | 2 | 3 | 4;
  let severity: 'none' | 'minimal' | 'mild' | 'moderate' | 'severe';
  let description: string;
  let clinicalFeatures: string[];
  let reversibility: 'fully_reversible' | 'mostly_reversible' | 'partially_reversible' | 'poor_reversibility';
  let urgency: 'routine' | 'urgent' | 'emergency';
  let mortality: string;
  
  // Determine grade based on clinical presentation
  if (assessment.mentalState.consciousness === 'comatose') {
    grade = 4;
    severity = 'severe';
    description = 'Coma with or without response to painful stimuli';
    clinicalFeatures = [
      'Comatose state',
      'No response to verbal stimuli',
      'May respond to painful stimuli',
      'Decerebrate or decorticate posturing possible',
      'Absent asterixis'
    ];
    reversibility = 'poor_reversibility';
    urgency = 'emergency';
    mortality = '50-80% without immediate intervention';
  } else if (assessment.mentalState.consciousness === 'stuporous') {
    grade = 3;
    severity = 'moderate';
    description = 'Stupor, semi-coma, marked confusion, incoherent speech';
    clinicalFeatures = [
      'Stuporous but arousable',
      'Marked confusion and disorientation',
      'Incoherent or incomprehensible speech',
      'Severe behavioral changes',
      'Asterixis usually present'
    ];
    reversibility = 'partially_reversible';
    urgency = 'emergency';
    mortality = '20-40% if untreated';
  } else if (assessment.mentalState.orientation === 'severe_confusion' || 
             assessment.mentalState.orientation === 'disoriented') {
    grade = 2;
    severity = 'mild';
    description = 'Drowsiness, inappropriate behavior, obvious disorientation';
    clinicalFeatures = [
      'Drowsiness and lethargy',
      'Obvious disorientation to time and place',
      'Inappropriate social behavior',
      'Marked asterixis',
      'Slurred or slow speech'
    ];
    reversibility = 'mostly_reversible';
    urgency = 'urgent';
    mortality = '5-15% with treatment';
  } else if (assessment.mentalState.orientation === 'mild_confusion' || 
             assessment.mentalState.orientation === 'moderate_confusion' ||
             assessment.behavioral.personality !== 'normal' ||
             assessment.neurologicalSigns.asterixis !== 'absent') {
    grade = 1;
    severity = 'minimal';
    description = 'Subtle changes in behavior, mild confusion, irritability';
    clinicalFeatures = [
      'Subtle personality changes',
      'Mild confusion or forgetfulness',
      'Irritability or euphoria',
      'Disturbed sleep pattern',
      'Mild asterixis may be present'
    ];
    reversibility = 'fully_reversible';
    urgency = 'urgent';
    mortality = '<5% with appropriate treatment';
  } else {
    grade = 0;
    severity = 'none';
    description = 'No detectable personality or behavioral abnormality';
    clinicalFeatures = [
      'Normal mental state',
      'Normal neurological examination',
      'No asterixis',
      'Normal psychometric tests (if performed)'
    ];
    reversibility = 'fully_reversible';
    urgency = 'routine';
    mortality = 'Not applicable';
  }
  
  // Generate management recommendations based on grade
  const managementRecommendations: string[] = [];
  const monitoringGuidelines: string[] = [];
  
  switch (grade) {
    case 4:
    case 3:
      managementRecommendations.push(
        'Immediate ICU admission',
        'Intubation and mechanical ventilation if needed',
        'Lactulose via nasogastric tube',
        'Rifaximin 550mg twice daily',
        'L-ornithine L-aspartate if available',
        'Identify and treat precipitating factors',
        'Consider liver transplant evaluation'
      );
      monitoringGuidelines.push(
        'Continuous neurological monitoring',
        'Frequent vital signs and Glasgow Coma Scale',
        'Monitor for cerebral edema signs',
        'Arterial blood gas monitoring',
        'Electrolyte and ammonia levels'
      );
      break;
    case 2:
      managementRecommendations.push(
        'Hospital admission recommended',
        'Lactulose 15-30ml every 6-8 hours',
        'Rifaximin 550mg twice daily',
        'Protein restriction (0.8-1.0 g/kg/day)',
        'Identify and treat precipitating factors',
        'Consider zinc supplementation'
      );
      monitoringGuidelines.push(
        'Neurological checks every 4-6 hours',
        'Daily mental status assessment',
        'Monitor bowel movements (target 2-3 soft stools/day)',
        'Daily electrolyte monitoring'
      );
      break;
    case 1:
      managementRecommendations.push(
        'Outpatient management usually possible',
        'Lactulose 15-30ml twice daily',
        'Consider rifaximin 550mg twice daily',
        'Moderate protein restriction if needed',
        'Address precipitating factors',
        'Patient and family education'
      );
      monitoringGuidelines.push(
        'Weekly clinical assessment initially',
        'Monitor for progression of symptoms',
        'Assess compliance with medications',
        'Follow-up in 1-2 weeks'
      );
      break;
    case 0:
      managementRecommendations.push(
        'No specific treatment required',
        'Monitor for development of symptoms',
        'Optimize general liver care',
        'Prevent precipitating factors'
      );
      monitoringGuidelines.push(
        'Routine follow-up as per liver disease management',
        'Educate patient and family about warning signs',
        'Regular assessment during clinic visits'
      );
      break;
  }
  
  // Identify precipitating factors
  const precipitatingFactors: string[] = [];
  Object.entries(assessment.precipitatingFactors).forEach(([factor, present]) => {
    if (present) {
      precipitatingFactors.push(factor.replace(/([A-Z])/g, ' $1').toLowerCase());
    }
  });
  
  // Calculate confidence based on assessment completeness
  let confidence = 1.0;
  
  // Reduce confidence if key assessments are missing or unclear
  if (assessment.mentalState.consciousness === 'normal' && 
      assessment.neurologicalSigns.asterixis === 'absent' && 
      grade > 0) {
    confidence -= 0.2; // Conflicting findings
  }
  
  if (!assessment.psychometric && grade <= 1) {
    confidence -= 0.1; // Psychometric tests helpful for minimal HE
  }
  
  return {
    grade,
    severity,
    description,
    clinicalFeatures,
    managementRecommendations,
    monitoringGuidelines,
    precipitatingFactors,
    prognosis: {
      reversibility,
      urgency,
      mortality
    },
    confidence: Math.max(confidence, 0.7)
  };
}

/**
 * Quick assessment based on simple clinical parameters
 */
export function quickHepaticEncephalopathyAssessment(
  consciousness: 'normal' | 'drowsy' | 'stuporous' | 'comatose',
  orientation: 'oriented' | 'confused' | 'disoriented',
  asterixis: 'absent' | 'present' | 'marked'
): HepaticEncephalopathyResult {
  // Create a simplified assessment
  const assessment: HepaticEncephalopathyAssessment = {
    mentalState: {
      consciousness,
      orientation: orientation === 'confused' ? 'mild_confusion' : 
                  orientation === 'disoriented' ? 'disoriented' : 'oriented',
      attentionSpan: consciousness === 'normal' ? 'normal' : 'shortened'
    },
    neurologicalSigns: {
      asterixis: asterixis === 'marked' ? 'severe' : 
                asterixis === 'present' ? 'mild' : 'absent',
      tremor: 'absent',
      reflexes: 'normal',
      muscularCoordination: 'normal'
    },
    behavioral: {
      personality: consciousness === 'normal' ? 'normal' : 'mild_changes',
      sleepPattern: 'normal',
      speechPattern: consciousness === 'stuporous' ? 'incomprehensible' :
                    consciousness === 'drowsy' ? 'slow' : 'normal'
    },
    precipitatingFactors: {
      infection: false,
      gastrointestinalBleeding: false,
      constipation: false,
      dehydration: false,
      electrolyteImbalance: false,
      medicationNoncompliance: false,
      alcoholIntake: false,
      sedativeMedications: false,
      proteinOverload: false,
      surgicalStress: false
    }
  };
  
  return assessHepaticEncephalopathy(assessment);
}

/**
 * Convert Child-Pugh encephalopathy grade to detailed assessment
 */
export function childPughToHepaticEncephalopathy(
  childPughGrade: 'none' | 'grade1-2' | 'grade3-4'
): HepaticEncephalopathyResult {
  switch (childPughGrade) {
    case 'none':
      return quickHepaticEncephalopathyAssessment('normal', 'oriented', 'absent');
    case 'grade1-2':
      return quickHepaticEncephalopathyAssessment('drowsy', 'confused', 'present');
    case 'grade3-4':
      return quickHepaticEncephalopathyAssessment('stuporous', 'disoriented', 'marked');
  }
}
