/**
 * DATA NORMALIZER
 * Handles unit conversion and data standardization across the medical platform
 */

import type {
  MedicalValue,
  PlatformConfig,
  MetricName
} from '../core/types';
import { MEDICAL_PARAMETERS } from '../core/parameters';

/**
 * Medical Data Normalizer
 * Ensures all medical values are converted to standard units and formats
 */
export class DataNormalizer {
  private config: PlatformConfig;

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  // ================================
  // MAIN NORMALIZATION METHODS
  // ================================

  /**
   * Normalize an array of medical values
   */
  async normalize(values: MedicalValue[]): Promise<MedicalValue[]> {
    const normalizedValues: MedicalValue[] = [];

    for (const value of values) {
      try {
        const normalized = await this.normalizeValue(value);
        normalizedValues.push(normalized);
      } catch (error) {
        console.error(`Error normalizing ${value.metric}:`, error);
        
        // In lenient mode, keep the original value with warning
        if (this.config.processing.validationLevel === 'lenient') {
          value.validation.warnings.push(`Normalization failed: ${error instanceof Error ? error.message : String(error)}`);
          normalizedValues.push(value);
        }
        // In strict mode, skip invalid values
      }
    }

    console.log(`🔄 Normalizer: Processed ${normalizedValues.length}/${values.length} values`);
    return normalizedValues;
  }

  /**
   * Normalize a single medical value
   */
  async normalizeValue(value: MedicalValue): Promise<MedicalValue> {
    const parameter = MEDICAL_PARAMETERS[value.metric];
    if (!parameter) {
      throw new Error(`Unknown parameter: ${value.metric}`);
    }

    // Create a copy to avoid modifying the original
    const normalized = { ...value };

    // Step 1: Unit normalization
    normalized.processed = await this.normalizeUnits(value, parameter);

    // Step 2: Value range validation and adjustment
    normalized.processed = await this.normalizeRange(normalized.processed, parameter);

    // Step 3: Precision normalization
    normalized.processed = this.normalizePrecision(normalized.processed, parameter);

    // Step 4: Update validation status
    normalized.validation = await this.updateValidationStatus(normalized, parameter);

    return normalized;
  }

  // ================================
  // UNIT NORMALIZATION
  // ================================

  private async normalizeUnits(
    value: MedicalValue,
    parameter: any
  ): Promise<MedicalValue['processed']> {
    const processed = { ...value.processed };

    // If already in standard unit, no conversion needed
    if (processed.unit === parameter.units.standard) {
      return processed;
    }

    // Find conversion rule
    const conversionRule = parameter.units.conversionRules.find(
      (rule: any) => rule.from === (value.raw.unit || processed.unit)
    );

    if (conversionRule) {
      // Apply conversion
      processed.value = value.raw.value * conversionRule.factor;
      processed.unit = parameter.units.standard;
      processed.conversionFactor = conversionRule.factor;
      processed.processingMethod = 'explicit_unit';
      
      // High confidence for known conversions
      if (processed.confidence === 'low') {
        processed.confidence = 'medium';
      }

      console.log(`🔄 Unit conversion: ${value.raw.value} ${value.raw.unit} → ${processed.value} ${processed.unit} (factor: ${conversionRule.factor})`);
    } else {
      // Unknown unit - try pattern matching
      const patternResult = this.inferUnitFromPattern(value.raw.value, parameter);
      if (patternResult) {
        const patternRule = parameter.units.conversionRules.find(
          (rule: any) => rule.from === patternResult.unit
        );
        
        if (patternRule) {
          processed.value = value.raw.value * patternRule.factor;
          processed.unit = parameter.units.standard;
          processed.conversionFactor = patternRule.factor;
          processed.processingMethod = 'pattern_match';
          processed.confidence = patternResult.confidence;

          console.log(`🔄 Pattern-based conversion: ${value.raw.value} → ${processed.value} ${processed.unit} (inferred: ${patternResult.unit})`);
        }
      } else {
        // Assume standard unit
        processed.value = value.raw.value;
        processed.unit = parameter.units.standard;
        processed.conversionFactor = 1;
        processed.processingMethod = 'range_inference';
        
        console.log(`⚠️ No conversion found for ${value.raw.unit}, assuming standard unit`);
      }
    }

    return processed;
  }

  private inferUnitFromPattern(value: number, parameter: any): 
    { unit: string; confidence: 'high' | 'medium' | 'low' } | null {
    
    for (const pattern of parameter.processing.patterns) {
      if (value >= pattern.range.min && value <= pattern.range.max) {
        return {
          unit: pattern.likelyUnit,
          confidence: pattern.confidence >= 0.8 ? 'high' : 
                     pattern.confidence >= 0.6 ? 'medium' : 'low'
        };
      }
    }
    
    return null;
  }

  // ================================
  // RANGE NORMALIZATION
  // ================================

  private async normalizeRange(
    processed: MedicalValue['processed'],
    parameter: any
  ): Promise<MedicalValue['processed']> {
    const normalized = { ...processed };

    // Check for extreme outliers that suggest unit errors
    const criticalMin = parameter.clinical.criticalRange.min;
    const criticalMax = parameter.clinical.criticalRange.max;

    if (normalized.value < criticalMin * 0.1) {
      // Value is 10x too low - might need multiplication
      console.log(`⚠️ Value ${normalized.value} is extremely low for ${parameter.name}`);
      normalized.confidence = 'low';
    } else if (normalized.value > criticalMax * 10) {
      // Value is 10x too high - might need division
      console.log(`⚠️ Value ${normalized.value} is extremely high for ${parameter.name}`);
      normalized.confidence = 'low';
      
      // Auto-correction for common unit errors
      if (this.config.processing.autoCorrection) {
        const corrected = this.attemptAutoCorrection(normalized, parameter);
        if (corrected) {
          return corrected;
        }
      }
    }

    return normalized;
  }

  private attemptAutoCorrection(
    processed: MedicalValue['processed'],
    parameter: any
  ): MedicalValue['processed'] | null {
    const value = processed.value;
    const criticalMax = parameter.clinical.criticalRange.max;

    // Common correction patterns
    const corrections = [
      { factor: 0.001, reason: 'raw_count_to_standard' },  // /μL to ×10³/μL
      { factor: 0.01, reason: 'percent_to_decimal' },      // % to decimal
      { factor: 0.1, reason: 'unit_magnitude_error' },     // Wrong decimal place
    ];

    for (const correction of corrections) {
      const correctedValue = value * correction.factor;
      if (correctedValue <= criticalMax && correctedValue >= parameter.clinical.criticalRange.min) {
        console.log(`🔧 Auto-correction applied: ${value} → ${correctedValue} (${correction.reason})`);
        
        return {
          ...processed,
          value: correctedValue,
          conversionFactor: processed.conversionFactor * correction.factor,
          processingMethod: 'range_inference',
          confidence: 'medium'
        };
      }
    }

    return null;
  }

  // ================================
  // PRECISION NORMALIZATION
  // ================================

  private normalizePrecision(
    processed: MedicalValue['processed'],
    parameter: any
  ): MedicalValue['processed'] {
    const normalized = { ...processed };

    // Determine appropriate decimal places based on parameter type
    const decimalPlaces = this.getAppropriateDecimalPlaces(parameter.metric, normalized.value);
    
    // Round to appropriate precision
    const factor = Math.pow(10, decimalPlaces);
    normalized.value = Math.round(normalized.value * factor) / factor;

    return normalized;
  }

  private getAppropriateDecimalPlaces(metric: MetricName, value: number): number {
    // Parameter-specific precision rules
    switch (metric) {
      case 'Platelets':
        return 0; // Whole numbers only
      
      case 'INR':
        return 2; // 2 decimal places for precision
      
      case 'Bilirubin':
      case 'Creatinine':
      case 'Albumin':
        return 1; // 1 decimal place
      
      case 'ALT':
      case 'AST':
      case 'ALP':
      case 'GGT':
        return 0; // Whole numbers
      
      case 'Sodium':
      case 'Potassium':
        return 1; // 1 decimal place
      
      default:
        // Auto-determine based on value magnitude
        if (value >= 100) return 0;
        if (value >= 10) return 1;
        if (value >= 1) return 2;
        return 3;
    }
  }

  // ================================
  // VALIDATION STATUS UPDATE
  // ================================

  private async updateValidationStatus(
    value: MedicalValue,
    parameter: any
  ): Promise<MedicalValue['validation']> {
    const validation = { ...value.validation };
    const processedValue = value.processed.value;

    // Update range checks
    validation.isWithinCriticalRange = 
      processedValue >= parameter.clinical.criticalRange.min && 
      processedValue <= parameter.clinical.criticalRange.max;

    validation.isWithinNormalRange = 
      processedValue >= parameter.clinical.normalRange.min && 
      processedValue <= parameter.clinical.normalRange.max;

    // Update clinical status
    if (!validation.isWithinCriticalRange) {
      validation.clinicalStatus = processedValue < parameter.clinical.criticalRange.min ? 'critical_low' : 'critical_high';
      validation.status = 'invalid';
    } else if (!validation.isWithinNormalRange) {
      validation.clinicalStatus = processedValue < parameter.clinical.normalRange.min ? 'low' : 'high';
      validation.status = 'warning';
    } else {
      validation.clinicalStatus = 'normal';
      validation.status = 'valid';
    }

    // Update warnings and suggestions
    validation.warnings = [...validation.warnings]; // Keep existing warnings
    validation.suggestions = [...validation.suggestions]; // Keep existing suggestions

    if (value.processed.confidence === 'low') {
      validation.suggestions.push('Consider verifying unit and value accuracy');
    }

    if (!validation.isWithinNormalRange) {
      validation.suggestions.push(`${parameter.name} is outside normal range (${parameter.clinical.normalRange.min}-${parameter.clinical.normalRange.max} ${parameter.units.standard})`);
    }

    return validation;
  }

  // ================================
  // BATCH OPERATIONS
  // ================================

  /**
   * Normalize values with cross-reference validation
   */
  async normalizeBatch(values: MedicalValue[]): Promise<{
    normalized: MedicalValue[];
    issues: string[];
    recommendations: string[];
  }> {
    const normalized = await this.normalize(values);
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Cross-reference validation
    const crossValidation = this.validateCrossReferences(normalized);
    issues.push(...crossValidation.issues);
    recommendations.push(...crossValidation.recommendations);

    return {
      normalized,
      issues,
      recommendations
    };
  }

  private validateCrossReferences(values: MedicalValue[]): {
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const valueMap = new Map<MetricName, MedicalValue>();
    values.forEach(v => valueMap.set(v.metric, v));

    // Validate ALT/AST relationship
    const alt = valueMap.get('ALT');
    const ast = valueMap.get('AST');
    if (alt && ast) {
      const ratio = ast.processed.value / alt.processed.value;
      if (ratio > 3) {
        recommendations.push('High AST/ALT ratio suggests non-hepatic etiology');
      }
    }

    // Validate protein relationships
    const albumin = valueMap.get('Albumin');
    const totalProtein = valueMap.get('TotalProtein');
    if (albumin && totalProtein) {
      if (albumin.processed.value > totalProtein.processed.value) {
        issues.push('Albumin cannot exceed total protein - check units');
      }
    }

    return { issues, recommendations };
  }

  // ================================
  // SYSTEM HEALTH
  // ================================

  async getHealth() {
    return {
      status: 'healthy',
      parametersSupported: Object.keys(MEDICAL_PARAMETERS).length,
      autoCorrection: this.config.processing.autoCorrection,
      validationLevel: this.config.processing.validationLevel,
      lastNormalization: new Date().toISOString()
    };
  }

  updateConfig(newConfig: PlatformConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}
