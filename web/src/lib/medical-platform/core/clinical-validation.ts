/**
 * Clinical Validation Utilities
 * Advanced validation for medical parameters with clinical context
 */

import { MEDICAL_PARAMETERS } from './parameters';
import type { EnhancedConversionResult } from './enhanced-unit-converter';

export interface ClinicalContext {
  patientAge?: number;
  patientGender?: 'male' | 'female' | 'other';
  patientWeight?: number;
  patientHeight?: number;
  pregnancyStatus?: boolean;
  dialysisStatus?: boolean;
  medications?: string[];
  clinicalConditions?: string[];
  labCollectionTime?: Date;
  fastingStatus?: boolean;
}

export interface ClinicalValidationResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  clinicalSignificance: string;
  recommendations: string[];
  alerts: ClinicalAlert[];
  referenceRanges: {
    normal: { min: number; max: number };
    adjusted?: { min: number; max: number; reason: string };
  };
}

export interface ClinicalAlert {
  type: 'info' | 'warning' | 'critical';
  message: string;
  action: string;
  urgency: 'routine' | 'urgent' | 'immediate';
}

export class ClinicalValidator {
  /**
   * Validate medical parameter with clinical context
   */
  static validateWithClinicalContext(
    metricName: string,
    result: EnhancedConversionResult,
    context: ClinicalContext
  ): ClinicalValidationResult {
    const parameter = Object.values(MEDICAL_PARAMETERS).find(p => 
      p.metric.toLowerCase() === metricName.toLowerCase()
    );

    if (!parameter) {
      return this.createUnknownParameterValidation(metricName, result);
    }

    const validation: ClinicalValidationResult = {
      isValid: true,
      riskLevel: 'low',
      clinicalSignificance: '',
      recommendations: [],
      alerts: [],
      referenceRanges: {
        normal: parameter.clinical.normalRange
      }
    };

    // Apply parameter-specific validation
    switch (parameter.metric.toLowerCase()) {
      case 'bilirubin':
        this.validateBilirubin(result, context, validation);
        break;
      case 'creatinine':
        this.validateCreatinine(result, context, validation);
        break;
      case 'albumin':
        this.validateAlbumin(result, context, validation);
        break;
      case 'alt':
      case 'ast':
        this.validateLiverEnzymes(result, context, validation, parameter.metric);
        break;
      case 'platelets':
        this.validatePlatelets(result, context, validation);
        break;
      case 'inr':
        this.validateINR(result, context, validation);
        break;
      default:
        this.validateGeneric(result, context, validation, parameter);
    }

    // Apply general clinical rules
    this.applyGeneralClinicalRules(result, context, validation);

    return validation;
  }

  /**
   * Validate bilirubin with clinical context
   */
  private static validateBilirubin(
    result: EnhancedConversionResult,
    context: ClinicalContext,
    validation: ClinicalValidationResult
  ): void {
    const { value } = result;

    // Age-based adjustments
    if (context.patientAge) {
      if (context.patientAge < 1) {
        // Neonatal ranges are different
        validation.referenceRanges.adjusted = {
          min: 0.2,
          max: 12.0,
          reason: 'Neonatal reference range'
        };
      } else if (context.patientAge > 65) {
        validation.referenceRanges.adjusted = {
          min: 0.2,
          max: 1.5,
          reason: 'Elderly patient adjustment'
        };
      }
    }

    // Clinical significance assessment
    if (value > 3.0) {
      validation.riskLevel = 'high';
      validation.clinicalSignificance = 'Significant hyperbilirubinemia - investigate cause';
      validation.alerts.push({
        type: 'critical',
        message: `Bilirubin ${value} mg/dL is significantly elevated`,
        action: 'Immediate clinical evaluation required',
        urgency: 'immediate'
      });
      validation.recommendations.push('Check for hemolysis, liver dysfunction, or bile duct obstruction');
      validation.recommendations.push('Consider hepatitis panel and imaging studies');
    } else if (value > 2.0) {
      validation.riskLevel = 'medium';
      validation.clinicalSignificance = 'Mild to moderate hyperbilirubinemia';
      validation.alerts.push({
        type: 'warning',
        message: `Bilirubin ${value} mg/dL is elevated`,
        action: 'Clinical correlation recommended',
        urgency: 'urgent'
      });
      validation.recommendations.push('Monitor trend and investigate if persistent');
    }

    // Pregnancy considerations
    if (context.pregnancyStatus) {
      validation.recommendations.push('Consider pregnancy-related liver conditions (HELLP, cholestasis)');
    }
  }

  /**
   * Validate creatinine with clinical context
   */
  private static validateCreatinine(
    result: EnhancedConversionResult,
    context: ClinicalContext,
    validation: ClinicalValidationResult
  ): void {
    const { value } = result;

    // Gender and age-based adjustments
    if (context.patientGender === 'female') {
      validation.referenceRanges.adjusted = {
        min: 0.6,
        max: 1.1,
        reason: 'Female reference range'
      };
    } else if (context.patientGender === 'male') {
      validation.referenceRanges.adjusted = {
        min: 0.7,
        max: 1.3,
        reason: 'Male reference range'
      };
    }

    // Age adjustments
    if (context.patientAge && context.patientAge > 65) {
      const currentMax = validation.referenceRanges.adjusted?.max || 1.2;
      validation.referenceRanges.adjusted = {
        ...validation.referenceRanges.adjusted!,
        max: currentMax + 0.2,
        reason: (validation.referenceRanges.adjusted?.reason || '') + ' (elderly adjustment)'
      };
    }

    // Dialysis considerations
    if (context.dialysisStatus) {
      validation.clinicalSignificance = 'Patient on dialysis - creatinine levels expected to be elevated';
      validation.recommendations.push('Evaluate dialysis adequacy rather than absolute creatinine level');
      return; // Skip normal range validation for dialysis patients
    }

    // Clinical significance
    if (value > 2.0) {
      validation.riskLevel = 'high';
      validation.clinicalSignificance = 'Significant renal impairment';
      validation.alerts.push({
        type: 'critical',
        message: `Creatinine ${value} mg/dL indicates significant renal dysfunction`,
        action: 'Nephrology consultation recommended',
        urgency: 'urgent'
      });
      validation.recommendations.push('Calculate eGFR and assess for acute vs chronic kidney disease');
      validation.recommendations.push('Review medications for nephrotoxic agents');
    } else if (value > 1.5) {
      validation.riskLevel = 'medium';
      validation.clinicalSignificance = 'Mild to moderate renal impairment';
      validation.recommendations.push('Monitor renal function trend');
      validation.recommendations.push('Consider dose adjustments for renally cleared medications');
    }
  }

  /**
   * Validate albumin with clinical context
   */
  private static validateAlbumin(
    result: EnhancedConversionResult,
    context: ClinicalContext,
    validation: ClinicalValidationResult
  ): void {
    const { value } = result;

    if (value < 3.0) {
      validation.riskLevel = 'high';
      validation.clinicalSignificance = 'Hypoalbuminemia - indicates poor synthetic function or protein loss';
      validation.alerts.push({
        type: 'warning',
        message: `Albumin ${value} g/dL is significantly low`,
        action: 'Investigate cause of hypoalbuminemia',
        urgency: 'urgent'
      });
      validation.recommendations.push('Assess for liver dysfunction, malnutrition, or protein-losing conditions');
      validation.recommendations.push('Consider nutritional assessment and support');
    } else if (value < 3.5) {
      validation.riskLevel = 'medium';
      validation.clinicalSignificance = 'Mild hypoalbuminemia';
      validation.recommendations.push('Monitor albumin trend and nutritional status');
    }

    // Age considerations
    if (context.patientAge && context.patientAge > 65) {
      validation.recommendations.push('Consider age-related decline in albumin synthesis');
    }
  }

  /**
   * Validate liver enzymes (ALT/AST)
   */
  private static validateLiverEnzymes(
    result: EnhancedConversionResult,
    context: ClinicalContext,
    validation: ClinicalValidationResult,
    enzyme: string
  ): void {
    const { value } = result;
    const upperLimit = enzyme === 'ALT' ? 40 : 40; // Standard upper limits

    if (value > upperLimit * 10) {
      validation.riskLevel = 'critical';
      validation.clinicalSignificance = 'Severe hepatocellular injury';
      validation.alerts.push({
        type: 'critical',
        message: `${enzyme} ${value} U/L indicates severe liver injury`,
        action: 'Immediate hepatology consultation',
        urgency: 'immediate'
      });
      validation.recommendations.push('Investigate acute hepatitis, drug-induced liver injury, or ischemic hepatitis');
    } else if (value > upperLimit * 3) {
      validation.riskLevel = 'high';
      validation.clinicalSignificance = 'Significant hepatocellular injury';
      validation.recommendations.push('Evaluate for hepatitis, medication toxicity, or other liver conditions');
    } else if (value > upperLimit) {
      validation.riskLevel = 'medium';
      validation.clinicalSignificance = 'Mild hepatocellular injury';
      validation.recommendations.push('Monitor liver function trend');
    }

    // Medication considerations
    if (context.medications?.length) {
      validation.recommendations.push('Review medications for hepatotoxic agents');
    }
  }

  /**
   * Validate platelets
   */
  private static validatePlatelets(
    result: EnhancedConversionResult,
    context: ClinicalContext,
    validation: ClinicalValidationResult
  ): void {
    const { value } = result;

    if (value < 50) {
      validation.riskLevel = 'critical';
      validation.clinicalSignificance = 'Severe thrombocytopenia - high bleeding risk';
      validation.alerts.push({
        type: 'critical',
        message: `Platelet count ${value} ×10³/μL is critically low`,
        action: 'Bleeding precautions and hematology consultation',
        urgency: 'immediate'
      });
      validation.recommendations.push('Implement bleeding precautions');
      validation.recommendations.push('Investigate cause of thrombocytopenia');
    } else if (value < 100) {
      validation.riskLevel = 'high';
      validation.clinicalSignificance = 'Moderate thrombocytopenia';
      validation.recommendations.push('Monitor for bleeding and investigate cause');
    } else if (value > 450) {
      validation.riskLevel = 'medium';
      validation.clinicalSignificance = 'Thrombocytosis';
      validation.recommendations.push('Investigate cause of elevated platelets');
    }
  }

  /**
   * Validate INR
   */
  private static validateINR(
    result: EnhancedConversionResult,
    context: ClinicalContext,
    validation: ClinicalValidationResult
  ): void {
    const { value } = result;

    if (value > 3.0) {
      validation.riskLevel = 'high';
      validation.clinicalSignificance = 'Significantly prolonged coagulation - bleeding risk';
      validation.alerts.push({
        type: 'critical',
        message: `INR ${value} is significantly elevated`,
        action: 'Assess bleeding risk and consider reversal if needed',
        urgency: 'urgent'
      });
      validation.recommendations.push('Evaluate for liver dysfunction or anticoagulant effect');
    } else if (value > 2.0) {
      validation.riskLevel = 'medium';
      validation.clinicalSignificance = 'Moderately prolonged coagulation';
      validation.recommendations.push('Monitor coagulation status');
    }

    // Medication considerations
    if (context.medications?.some(med => med.toLowerCase().includes('warfarin'))) {
      validation.recommendations.push('Adjust warfarin dose based on target INR range');
    }
  }

  /**
   * Generic validation for unknown parameters
   */
  private static validateGeneric(
    result: EnhancedConversionResult,
    context: ClinicalContext,
    validation: ClinicalValidationResult,
    parameter: any
  ): void {
    const { value } = result;
    const { normalRange, criticalRange } = parameter.clinical;

    if (value < criticalRange.min || value > criticalRange.max) {
      validation.riskLevel = 'critical';
      validation.clinicalSignificance = 'Value outside critical range';
      validation.alerts.push({
        type: 'critical',
        message: `${parameter.metric} ${value} is outside critical range`,
        action: 'Immediate clinical evaluation',
        urgency: 'immediate'
      });
    } else if (value < normalRange.min || value > normalRange.max) {
      validation.riskLevel = 'medium';
      validation.clinicalSignificance = 'Value outside normal range';
      validation.recommendations.push('Clinical correlation recommended');
    }
  }

  /**
   * Apply general clinical rules
   */
  private static applyGeneralClinicalRules(
    result: EnhancedConversionResult,
    context: ClinicalContext,
    validation: ClinicalValidationResult
  ): void {
    // Age-based general considerations
    if (context.patientAge) {
      if (context.patientAge < 18) {
        validation.recommendations.push('Pediatric reference ranges may differ - consult pediatric guidelines');
      } else if (context.patientAge > 65) {
        validation.recommendations.push('Consider age-related physiological changes');
      }
    }

    // Pregnancy considerations
    if (context.pregnancyStatus) {
      validation.recommendations.push('Pregnancy-specific reference ranges may apply');
    }

    // Fasting status
    if (context.fastingStatus === false) {
      validation.recommendations.push('Non-fasting sample - may affect certain parameters');
    }

    // Collection time considerations
    if (context.labCollectionTime) {
      const hour = context.labCollectionTime.getHours();
      if (hour < 6 || hour > 22) {
        validation.recommendations.push('Consider circadian rhythm effects on lab values');
      }
    }
  }

  /**
   * Create validation for unknown parameters
   */
  private static createUnknownParameterValidation(
    metricName: string,
    result: EnhancedConversionResult
  ): ClinicalValidationResult {
    return {
      isValid: false,
      riskLevel: 'low',
      clinicalSignificance: `Unknown parameter: ${metricName}`,
      recommendations: ['Verify parameter name and reference ranges'],
      alerts: [{
        type: 'info',
        message: `Parameter ${metricName} not recognized`,
        action: 'Manual review recommended',
        urgency: 'routine'
      }],
      referenceRanges: {
        normal: { min: 0, max: 0 }
      }
    };
  }
}

/**
 * Utility function for clinical validation
 */
export function validateClinically(
  metricName: string,
  result: EnhancedConversionResult,
  context: ClinicalContext = {}
): ClinicalValidationResult {
  return ClinicalValidator.validateWithClinicalContext(metricName, result, context);
}