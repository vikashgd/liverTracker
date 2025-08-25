/**
 * Enhanced Unit Converter for Database Storage
 * Comprehensive unit conversion with validation, audit trails, and database storage support
 */

import { MEDICAL_PARAMETERS } from './parameters';
import type { MedicalParameter, ConversionRule } from './types';

export interface EnhancedConversionResult {
  // Standardized values
  value: number;
  unit: string;
  
  // Original values (audit trail)
  originalValue: number;
  originalUnit: string;
  
  // Conversion metadata
  wasConverted: boolean;
  conversionFactor?: number;
  conversionRule?: string;
  conversionDate: Date;
  
  // Quality assurance
  validationStatus: 'valid' | 'suspicious' | 'error' | 'unknown';
  validationNotes?: string;
  confidenceScore: number;
  
  // Additional metadata
  parameterInfo?: {
    category: string;
    normalRange: { min: number; max: number };
    criticalRange: { min: number; max: number };
  };
}

export interface BatchConversionResult {
  results: EnhancedConversionResult[];
  summary: {
    total: number;
    converted: number;
    failed: number;
    suspicious: number;
  };
  errors: ConversionError[];
}

export interface ConversionError {
  metricName: string;
  originalValue: number;
  originalUnit: string;
  error: string;
  severity: 'warning' | 'error' | 'critical';
}

export interface ValidationContext {
  patientAge?: number;
  patientGender?: 'male' | 'female';
  clinicalContext?: string;
  previousValues?: Array<{ value: number; date: Date }>;
}

export class EnhancedUnitConverter {
  private static instance: EnhancedUnitConverter;
  private conversionCache = new Map<string, EnhancedConversionResult>();
  private validationRules = new Map<string, ValidationRule[]>();

  static getInstance(): EnhancedUnitConverter {
    if (!EnhancedUnitConverter.instance) {
      EnhancedUnitConverter.instance = new EnhancedUnitConverter();
    }
    return EnhancedUnitConverter.instance;
  }

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Convert metric for database storage with comprehensive validation
   */
  convertForStorage(
    metricName: string, 
    value: number | null, 
    unit?: string | null,
    context?: ValidationContext
  ): EnhancedConversionResult {
    if (value === null || value === undefined || isNaN(value)) {
      return this.createErrorResult(metricName, value || 0, unit || '', 'Invalid or null value');
    }

    const cacheKey = `${metricName}-${value}-${unit}-${JSON.stringify(context)}`;
    if (this.conversionCache.has(cacheKey)) {
      return this.conversionCache.get(cacheKey)!;
    }

    const parameter = this.findParameter(metricName);
    if (!parameter) {
      return this.createUnknownParameterResult(metricName, value, unit || '');
    }

    const result = this.performConversion(parameter, value, unit, context);
    this.conversionCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Batch convert multiple metrics
   */
  batchConvert(
    metrics: Array<{ name: string; value: number; unit?: string }>,
    context?: ValidationContext
  ): BatchConversionResult {
    const results: EnhancedConversionResult[] = [];
    const errors: ConversionError[] = [];
    let converted = 0;
    let failed = 0;
    let suspicious = 0;

    for (const metric of metrics) {
      try {
        const result = this.convertForStorage(metric.name, metric.value, metric.unit, context);
        results.push(result);

        if (result.validationStatus === 'error') {
          failed++;
          errors.push({
            metricName: metric.name,
            originalValue: metric.value,
            originalUnit: metric.unit || '',
            error: result.validationNotes || 'Conversion failed',
            severity: 'error'
          });
        } else if (result.validationStatus === 'suspicious') {
          suspicious++;
          errors.push({
            metricName: metric.name,
            originalValue: metric.value,
            originalUnit: metric.unit || '',
            error: result.validationNotes || 'Suspicious value detected',
            severity: 'warning'
          });
        } else if (result.wasConverted) {
          converted++;
        }
      } catch (error) {
        failed++;
        errors.push({
          metricName: metric.name,
          originalValue: metric.value,
          originalUnit: metric.unit || '',
          error: error instanceof Error ? error.message : String(error),
          severity: 'critical'
        });
      }
    }

    return {
      results,
      summary: {
        total: metrics.length,
        converted,
        failed,
        suspicious
      },
      errors
    };
  }

  /**
   * Validate conversion result against clinical ranges
   */
  validateConversion(
    parameter: MedicalParameter,
    result: EnhancedConversionResult,
    context?: ValidationContext
  ): {
    status: 'valid' | 'suspicious' | 'error';
    notes: string;
    confidenceScore: number;
  } {
    const { value } = result;
    const { normalRange, criticalRange } = parameter.clinical;

    // Check critical range first
    if (value < criticalRange.min * 0.01 || value > criticalRange.max * 100) {
      return {
        status: 'error',
        notes: `Value ${value} is extremely outside critical range (${criticalRange.min}-${criticalRange.max})`,
        confidenceScore: 0.1
      };
    }

    // Check for suspicious values
    if (value < criticalRange.min * 0.1 || value > criticalRange.max * 10) {
      return {
        status: 'suspicious',
        notes: `Value ${value} is outside expected range (${criticalRange.min}-${criticalRange.max})`,
        confidenceScore: 0.5
      };
    }

    // Check normal range
    if (value >= normalRange.min && value <= normalRange.max) {
      return {
        status: 'valid',
        notes: `Value ${value} within normal range (${normalRange.min}-${normalRange.max})`,
        confidenceScore: 0.95
      };
    }

    // Outside normal but within critical range
    if (value >= criticalRange.min && value <= criticalRange.max) {
      return {
        status: 'valid',
        notes: `Value ${value} outside normal range but within critical limits`,
        confidenceScore: 0.8
      };
    }

    return {
      status: 'suspicious',
      notes: `Value ${value} requires clinical review`,
      confidenceScore: 0.6
    };
  }

  /**
   * Perform the actual conversion with comprehensive error handling
   */
  private performConversion(
    parameter: MedicalParameter,
    value: number,
    unit?: string | null,
    context?: ValidationContext
  ): EnhancedConversionResult {
    const originalValue = value;
    const originalUnit = unit || '';
    let convertedValue = value;
    let convertedUnit = parameter.units.standard;
    let wasConverted = false;
    let conversionFactor = 1;
    let conversionRule = 'no_conversion';

    try {
      // Try explicit conversion rules first
      if (parameter.units.conversionRules && unit) {
        const rule = parameter.units.conversionRules.find((r: ConversionRule) => 
          r.from.toLowerCase() === unit.toLowerCase()
        );
        
        if (rule) {
          convertedValue = value * rule.factor;
          convertedUnit = rule.to;
          wasConverted = rule.factor !== 1;
          conversionFactor = rule.factor;
          conversionRule = `${rule.from}_to_${rule.to}`;
        }
      }

      // Apply smart range-based conversion if no explicit rule found
      if (!wasConverted) {
        const smartConversion = this.applySmartConversion(parameter, value, unit);
        if (smartConversion.wasConverted) {
          convertedValue = smartConversion.value;
          convertedUnit = smartConversion.unit;
          wasConverted = true;
          conversionFactor = smartConversion.conversionFactor || 1;
          conversionRule = smartConversion.conversionRule || 'smart_conversion';
        }
      }

      // Create result with validation
      const result: EnhancedConversionResult = {
        value: convertedValue,
        unit: convertedUnit,
        originalValue,
        originalUnit,
        wasConverted,
        conversionFactor,
        conversionRule,
        conversionDate: new Date(),
        validationStatus: 'valid',
        confidenceScore: 0.9,
        parameterInfo: {
          category: parameter.category,
          normalRange: parameter.clinical.normalRange,
          criticalRange: parameter.clinical.criticalRange
        }
      };

      // Validate the conversion
      const validation = this.validateConversion(parameter, result, context);
      result.validationStatus = validation.status;
      result.validationNotes = validation.notes;
      result.confidenceScore = validation.confidenceScore;

      // Apply additional validation rules
      this.applyCustomValidationRules(parameter.metric, result, context);

      if (wasConverted) {
        console.log(`🔧 Enhanced conversion: ${parameter.metric} ${originalValue} ${originalUnit} → ${convertedValue} ${convertedUnit} (${validation.status})`);
      }

      return result;

    } catch (error) {
      return this.createErrorResult(
        parameter.metric,
        originalValue,
        originalUnit,
        `Conversion failed: ${error}`
      );
    }
  }

  /**
   * Apply smart range-based conversion for common issues
   */
  private applySmartConversion(
    parameter: MedicalParameter,
    value: number,
    unit?: string | null
  ): Partial<EnhancedConversionResult> {
    const metricName = parameter.metric.toLowerCase();

    // Platelet-specific smart conversion
    if (metricName === 'platelets') {
      // Raw count (/μL) to standard (×10³/μL)
      if (value >= 50000 && value <= 1000000) {
        return {
          value: value * 0.001,
          unit: '×10³/μL',
          wasConverted: true,
          conversionFactor: 0.001,
          conversionRule: 'raw_count_to_standard'
        };
      }
      
      // Lakhs to standard
      if (value >= 0.5 && value <= 10 && value < 50) {
        return {
          value: value * 100,
          unit: '×10³/μL',
          wasConverted: true,
          conversionFactor: 100,
          conversionRule: 'lakhs_to_standard'
        };
      }
    }

    // Bilirubin smart conversion
    if (metricName.includes('bilirubin')) {
      // μmol/L to mg/dL (common in international labs)
      if (value >= 5 && value <= 500 && (unit?.includes('μmol') || unit?.includes('umol') || value > 20)) {
        return {
          value: value / 17.1,
          unit: 'mg/dL',
          wasConverted: true,
          conversionFactor: 1/17.1,
          conversionRule: 'umol_to_mgdl'
        };
      }
    }

    // Creatinine smart conversion
    if (metricName.includes('creatinine')) {
      // μmol/L to mg/dL
      if (value >= 30 && value <= 900 && (unit?.includes('μmol') || unit?.includes('umol') || value > 15)) {
        return {
          value: value / 88.4,
          unit: 'mg/dL',
          wasConverted: true,
          conversionFactor: 1/88.4,
          conversionRule: 'umol_to_mgdl'
        };
      }
    }

    // Albumin smart conversion
    if (metricName.includes('albumin')) {
      // g/L to g/dL
      if (value >= 15 && value <= 70 && (unit?.includes('g/L') || value > 10)) {
        return {
          value: value / 10,
          unit: 'g/dL',
          wasConverted: true,
          conversionFactor: 0.1,
          conversionRule: 'gl_to_gdl'
        };
      }
    }

    return { wasConverted: false };
  }

  /**
   * Apply custom validation rules
   */
  private applyCustomValidationRules(
    metricName: string,
    result: EnhancedConversionResult,
    context?: ValidationContext
  ): void {
    const rules = this.validationRules.get(metricName.toLowerCase()) || [];
    
    for (const rule of rules) {
      try {
        const ruleResult = rule.validate(result, context);
        if (!ruleResult.passed) {
          if (result.validationStatus === 'valid') {
            result.validationStatus = ruleResult.severity === 'error' ? 'error' : 'suspicious';
          }
          result.validationNotes = (result.validationNotes || '') + ` ${ruleResult.message}`;
          result.confidenceScore = Math.min(result.confidenceScore, ruleResult.confidenceAdjustment || 0.5);
        }
      } catch (error) {
        console.warn(`Validation rule failed for ${metricName}:`, error);
      }
    }
  }

  /**
   * Find parameter by name with fuzzy matching
   */
  private findParameter(metricName: string): MedicalParameter | null {
    const normalizedName = metricName.toLowerCase().replace(/[\s_-]/g, '');
    
    for (const param of Object.values(MEDICAL_PARAMETERS)) {
      const paramName = param.metric.toLowerCase().replace(/[\s_-]/g, '');
      if (paramName === normalizedName) {
        return param;
      }
      
      // Check aliases
      if (param.aliases) {
        const allNames = [
          ...(param.aliases.names || []),
          ...(param.aliases.abbreviations || []),
          ...(param.aliases.alternativeSpellings || [])
        ];
        
        for (const alias of allNames) {
          const aliasName = alias.toLowerCase().replace(/[\s_-]/g, '');
          if (aliasName === normalizedName) {
            return param;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Create error result
   */
  private createErrorResult(
    metricName: string,
    originalValue: number,
    originalUnit: string,
    error: string
  ): EnhancedConversionResult {
    return {
      value: originalValue,
      unit: originalUnit,
      originalValue,
      originalUnit,
      wasConverted: false,
      conversionDate: new Date(),
      validationStatus: 'error',
      validationNotes: error,
      confidenceScore: 0.0
    };
  }

  /**
   * Create result for unknown parameter
   */
  private createUnknownParameterResult(
    metricName: string,
    value: number,
    unit: string
  ): EnhancedConversionResult {
    return {
      value,
      unit,
      originalValue: value,
      originalUnit: unit,
      wasConverted: false,
      conversionDate: new Date(),
      validationStatus: 'unknown',
      validationNotes: `Unknown parameter: ${metricName}`,
      confidenceScore: 0.3
    };
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    // Age-based validation for certain parameters
    this.validationRules.set('bilirubin', [
      {
        name: 'age_based_bilirubin',
        validate: (result, context) => {
          if (context?.patientAge && context.patientAge < 30 && result.value > 2.0) {
            return {
              passed: false,
              message: 'High bilirubin in young patient - verify',
              severity: 'warning',
              confidenceAdjustment: 0.7
            };
          }
          return { passed: true, message: 'Age-based validation passed' };
        }
      }
    ]);

    // Gender-based validation
    this.validationRules.set('creatinine', [
      {
        name: 'gender_based_creatinine',
        validate: (result, context) => {
          if (context?.patientGender === 'female' && result.value > 1.1) {
            return {
              passed: false,
              message: 'High creatinine for female patient - verify',
              severity: 'warning',
              confidenceAdjustment: 0.8
            };
          }
          return { passed: true, message: 'Gender-based validation passed' };
        }
      }
    ]);
  }

  /**
   * Clear conversion cache
   */
  clearCache(): void {
    this.conversionCache.clear();
  }

  /**
   * Get conversion statistics
   */
  getStats(): {
    cacheSize: number;
    conversionsApplied: number;
    validationStats: { [status: string]: number };
  } {
    const validationStats: { [status: string]: number } = {};
    let conversionsApplied = 0;

    Array.from(this.conversionCache.values()).forEach(result => {
      if (result.wasConverted) conversionsApplied++;
      validationStats[result.validationStatus] = (validationStats[result.validationStatus] || 0) + 1;
    });

    return {
      cacheSize: this.conversionCache.size,
      conversionsApplied,
      validationStats
    };
  }
}

// Validation rule interface
interface ValidationRule {
  name: string;
  validate: (result: EnhancedConversionResult, context?: ValidationContext) => {
    passed: boolean;
    message: string;
    severity?: 'warning' | 'error';
    confidenceAdjustment?: number;
  };
}

// Export singleton instance
export const enhancedUnitConverter = EnhancedUnitConverter.getInstance();

// Export utility functions
export function convertForStorage(
  metricName: string,
  value: number | null,
  unit?: string | null,
  context?: ValidationContext
): EnhancedConversionResult {
  return enhancedUnitConverter.convertForStorage(metricName, value, unit, context);
}

export function batchConvertForStorage(
  metrics: Array<{ name: string; value: number; unit?: string }>,
  context?: ValidationContext
): BatchConversionResult {
  return enhancedUnitConverter.batchConvert(metrics, context);
}