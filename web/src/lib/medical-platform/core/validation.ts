/**
 * DATA VALIDATION SYSTEM
 * Enterprise-grade medical data validation and quality assurance
 */

import type {
  MedicalValue,
  ValidationResult,
  QualityResult,
  PlatformConfig,
  MedicalParameter
} from './types';
import { MEDICAL_PARAMETERS } from './parameters';

/**
 * Comprehensive Data Validator
 * Handles all medical data validation with enterprise-grade quality checks
 */
export class DataValidator {
  private config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  // ================================
  // PRIMARY VALIDATION METHODS
  // ================================

  /**
   * Validate a single medical value through comprehensive checks
   */
  async validate(value: MedicalValue): Promise<ValidationResult> {
    const parameter = MEDICAL_PARAMETERS[value.metric];
    if (!parameter) {
      return {
        passed: false,
        message: `Unknown medical parameter: ${value.metric}`,
        suggestion: 'Verify parameter name spelling'
      };
    }

    const validationResults: ValidationResult[] = [];

    // Run all validation rules for this parameter
    for (const rule of parameter.processing.validationRules) {
      try {
        const result = rule.check(value);
        validationResults.push(result);
        
        if (!result.passed && rule.severity === 'error') {
          // Stop on first critical error if in strict mode
          if (this.config.processing.strictMode) {
            return result;
          }
        }
      } catch (error) {
        validationResults.push({
          passed: false,
          message: `Validation rule error: ${error instanceof Error ? error.message : String(error)}`,
          suggestion: 'Review data format'
        });
      }
    }

    // Custom medical-specific validations
    const medicalValidation = await this.validateMedicalLogic(value, parameter);
    validationResults.push(medicalValidation);

    // Unit consistency validation
    const unitValidation = this.validateUnitConsistency(value, parameter);
    validationResults.push(unitValidation);

    // Aggregate results
    return this.aggregateValidationResults(validationResults);
  }

  /**
   * Validate multiple values as a batch (for reports)
   */
  async validateBatch(values: MedicalValue[]): Promise<{
    overallValid: boolean;
    individualResults: Map<string, ValidationResult>;
    batchIssues: string[];
    recommendations: string[];
  }> {
    const individualResults = new Map<string, ValidationResult>();
    const batchIssues: string[] = [];
    const recommendations: string[] = [];

    // Validate individual values
    for (const value of values) {
      const result = await this.validate(value);
      individualResults.set(value.id, result);
    }

    // Cross-value validations
    const crossValidation = this.validateCrossValues(values);
    batchIssues.push(...crossValidation.issues);
    recommendations.push(...crossValidation.recommendations);

    // Completeness check
    const completenessCheck = this.validateCompleteness(values);
    batchIssues.push(...completenessCheck.issues);
    recommendations.push(...completenessCheck.recommendations);

    const overallValid = Array.from(individualResults.values()).every(r => r.passed) && 
                        batchIssues.length === 0;

    return {
      overallValid,
      individualResults,
      batchIssues,
      recommendations
    };
  }

  // ================================
  // QUALITY ASSESSMENT
  // ================================

  /**
   * Assess data quality for a medical value
   */
  async assessQuality(value: MedicalValue): Promise<QualityResult> {
    const parameter = MEDICAL_PARAMETERS[value.metric];
    if (!parameter) {
      return {
        score: 0,
        issues: [`Unknown parameter: ${value.metric}`],
        recommendations: ['Verify parameter definition']
      };
    }

    let totalScore = 0;
    let maxScore = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Run all quality checks for this parameter
    for (const qualityCheck of parameter.processing.qualityChecks) {
      try {
        const result = qualityCheck.check(value);
        totalScore += result.score;
        maxScore += 1.0;
        
        issues.push(...result.issues);
        recommendations.push(...result.recommendations);
      } catch (error) {
        issues.push(`Quality check error: ${error instanceof Error ? error.message : String(error)}`);
        maxScore += 1.0; // Still count this check in the denominator
      }
    }

    // Additional quality factors
    const confidenceScore = this.getConfidenceScore(value.processed.confidence);
    const completenessScore = this.getCompletenessScore(value);
    const consistencyScore = this.getConsistencyScore(value);

    totalScore += confidenceScore + completenessScore + consistencyScore;
    maxScore += 3.0;

    const finalScore = maxScore > 0 ? totalScore / maxScore : 0;

    return {
      score: Math.max(0, Math.min(1, finalScore)),
      issues: [...new Set(issues)], // Remove duplicates
      recommendations: [...new Set(recommendations)]
    };
  }

  // ================================
  // MEDICAL LOGIC VALIDATION
  // ================================

  private async validateMedicalLogic(
    value: MedicalValue,
    parameter: MedicalParameter
  ): Promise<ValidationResult> {
    const processedValue = value.processed.value;

    // Critical range check (absolute safety bounds)
    if (processedValue < parameter.clinical.criticalRange.min || 
        processedValue > parameter.clinical.criticalRange.max) {
      return {
        passed: false,
        message: `${parameter.name} value ${processedValue} ${value.processed.unit} is outside critical safety range (${parameter.clinical.criticalRange.min}-${parameter.clinical.criticalRange.max} ${parameter.units.standard})`,
        suggestion: 'Verify data entry and unit conversion'
      };
    }

    // Biological plausibility check
    const plausibilityCheck = this.checkBiologicalPlausibility(value, parameter);
    if (!plausibilityCheck.passed) {
      return plausibilityCheck;
    }

    // Unit conversion sanity check
    if (value.processed.conversionFactor < 0.001 || value.processed.conversionFactor > 1000) {
      return {
        passed: false,
        message: `Unusual unit conversion factor (${value.processed.conversionFactor}) detected for ${parameter.name}`,
        suggestion: 'Review unit specification and conversion logic'
      };
    }

    return {
      passed: true,
      message: `${parameter.name} passes medical logic validation`,
      suggestion: undefined
    };
  }

  private checkBiologicalPlausibility(
    value: MedicalValue,
    parameter: MedicalParameter
  ): ValidationResult {
    const processedValue = value.processed.value;

    // Parameter-specific plausibility checks
    switch (value.metric) {
      case 'Platelets':
        if (processedValue > 2000) {
          return {
            passed: false,
            message: `Platelet count ${processedValue} is biologically implausible`,
            suggestion: 'Check for unit confusion (e.g., /μL vs ×10³/μL)'
          };
        }
        break;

      case 'Bilirubin':
        if (processedValue > 30) {
          return {
            passed: false,
            message: `Bilirubin ${processedValue} mg/dL suggests life-threatening condition`,
            suggestion: 'Verify critical care context or unit conversion'
          };
        }
        break;

      case 'Creatinine':
        if (processedValue > 10) {
          return {
            passed: false,
            message: `Creatinine ${processedValue} mg/dL indicates severe kidney failure`,
            suggestion: 'Confirm dialysis status or unit conversion'
          };
        }
        break;

      case 'INR':
        if (processedValue > 8) {
          return {
            passed: false,
            message: `INR ${processedValue} indicates extreme bleeding risk`,
            suggestion: 'Verify anticoagulation therapy or critical care context'
          };
        }
        break;

      case 'ALT':
      case 'AST':
        if (processedValue > 2000) {
          return {
            passed: false,
            message: `${parameter.name} ${processedValue} U/L suggests acute liver failure`,
            suggestion: 'Verify critical care context or unit conversion'
          };
        }
        break;
    }

    return { passed: true, message: 'Biologically plausible', suggestion: undefined };
  }

  // ================================
  // UNIT VALIDATION
  // ================================

  private validateUnitConsistency(
    value: MedicalValue,
    parameter: MedicalParameter
  ): ValidationResult {
    // Check if provided unit is recognized
    if (value.raw.unit) {
      const recognizedUnit = parameter.units.conversionRules.some(
        rule => rule.from === value.raw.unit
      );
      
      if (!recognizedUnit) {
        return {
          passed: false,
          message: `Unrecognized unit "${value.raw.unit}" for ${parameter.name}`,
          suggestion: `Expected units: ${parameter.units.conversionRules.map(r => r.from).join(', ')}`
        };
      }
    }

    // Check processed unit matches standard
    if (value.processed.unit !== parameter.units.standard) {
      return {
        passed: false,
        message: `Processed unit "${value.processed.unit}" does not match standard "${parameter.units.standard}"`,
        suggestion: 'Review unit conversion logic'
      };
    }

    return {
      passed: true,
      message: 'Unit consistency validated',
      suggestion: undefined
    };
  }

  // ================================
  // CROSS-VALUE VALIDATION
  // ================================

  private validateCrossValues(values: MedicalValue[]): {
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const valueMap = new Map<string, MedicalValue>();
    values.forEach(v => valueMap.set(v.metric, v));

    // Check ALT/AST ratio
    const alt = valueMap.get('ALT');
    const ast = valueMap.get('AST');
    if (alt && ast) {
      const ratio = ast.processed.value / alt.processed.value;
      if (ratio > 3) {
        issues.push(`AST/ALT ratio (${ratio.toFixed(1)}) suggests non-hepatic cause or severe liver damage`);
        recommendations.push('Consider cardiac enzymes or muscle damage evaluation');
      }
    }

    // Check albumin/total protein ratio
    const albumin = valueMap.get('Albumin');
    const totalProtein = valueMap.get('TotalProtein');
    if (albumin && totalProtein) {
      const ratio = albumin.processed.value / totalProtein.processed.value;
      if (ratio < 0.3 || ratio > 0.8) {
        issues.push(`Albumin/Total protein ratio (${ratio.toFixed(2)}) is unusual`);
        recommendations.push('Review protein electrophoresis or globulin levels');
      }
    }

    // Check sodium level for MELD-Na calculation
    const sodium = valueMap.get('Sodium');
    const bilirubin = valueMap.get('Bilirubin');
    const inr = valueMap.get('INR');
    const creatinine = valueMap.get('Creatinine');

    if (sodium && bilirubin && inr && creatinine) {
      if (sodium.processed.value < 125) {
        issues.push('Severe hyponatremia detected - affects MELD-Na score significantly');
        recommendations.push('Consider fluid restriction and sodium correction');
      }
    }

    return { issues, recommendations };
  }

  // ================================
  // COMPLETENESS VALIDATION
  // ================================

  private validateCompleteness(values: MedicalValue[]): {
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const presentMetrics = new Set(values.map(v => v.metric));
    const requiredMetrics = this.config.quality.requiredFields;

    const missingRequired = requiredMetrics.filter(metric => !presentMetrics.has(metric));
    if (missingRequired.length > 0) {
      issues.push(`Missing required metrics: ${missingRequired.join(', ')}`);
      recommendations.push('Complete basic liver function panel for comprehensive assessment');
    }

    // Check for MELD components
    const meldComponents = ['Bilirubin', 'INR', 'Creatinine'];
    const missingMeld = meldComponents.filter(metric => !presentMetrics.has(metric));
    if (missingMeld.length > 0 && missingMeld.length < 3) {
      recommendations.push(`Add ${missingMeld.join(', ')} to enable MELD score calculation`);
    }

    return { issues, recommendations };
  }

  // ================================
  // SCORING HELPERS
  // ================================

  private getConfidenceScore(confidence: string): number {
    switch (confidence) {
      case 'high': return 1.0;
      case 'medium': return 0.7;
      case 'low': return 0.4;
      case 'reject': return 0.0;
      default: return 0.0;
    }
  }

  private getCompletenessScore(value: MedicalValue): number {
    let score = 0.8; // Base score
    
    if (value.raw.unit) score += 0.1;
    if (value.raw.extractedText) score += 0.1;
    if (value.metadata.auditTrail.length > 0) score += 0.1;
    
    return Math.min(1.0, score);
  }

  private getConsistencyScore(value: MedicalValue): number {
    // Check consistency between raw and processed values
    const expectedProcessed = value.raw.value * value.processed.conversionFactor;
    const actualProcessed = value.processed.value;
    
    const difference = Math.abs(expectedProcessed - actualProcessed) / Math.max(expectedProcessed, actualProcessed);
    
    if (difference < 0.01) return 1.0;
    if (difference < 0.05) return 0.8;
    if (difference < 0.1) return 0.6;
    if (difference < 0.2) return 0.4;
    return 0.0;
  }

  // ================================
  // RESULT AGGREGATION
  // ================================

  private aggregateValidationResults(results: ValidationResult[]): ValidationResult {
    const failed = results.filter(r => !r.passed);
    
    if (failed.length === 0) {
      return {
        passed: true,
        message: 'All validation checks passed',
        suggestion: undefined
      };
    }

    // Return the most critical failure
    const errorResult = failed.find(r => r.message.includes('critical') || r.message.includes('error'));
    if (errorResult) return errorResult;

    // Return first failure if no critical errors
    return failed[0];
  }

  // ================================
  // SYSTEM MANAGEMENT
  // ================================

  async getHealth() {
    return {
      status: 'healthy',
      rulesLoaded: Object.values(MEDICAL_PARAMETERS).reduce(
        (sum, param) => sum + param.processing.validationRules.length, 0
      ),
      qualityChecksLoaded: Object.values(MEDICAL_PARAMETERS).reduce(
        (sum, param) => sum + param.processing.qualityChecks.length, 0
      ),
      configValid: this.validateConfig()
    };
  }

  updateConfig(newConfig: PlatformConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  private validateConfig(): boolean {
    return !!(
      this.config.processing &&
      this.config.quality &&
      this.config.quality.minimumConfidence >= 0 &&
      this.config.quality.minimumConfidence <= 1
    );
  }
}
