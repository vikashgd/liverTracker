/**
 * MEDICAL ENGINE - CORE PROCESSING SYSTEM
 * Enterprise-grade medical data processing engine
 * Replaces all fragmented medical intelligence systems
 */

import type {
  MedicalValue,
  MedicalReport,
  MedicalParameter,
  ProcessingStep,
  ValidationResult,
  ConfidenceLevel,
  ValidationStatus,
  PlatformConfig,
  MetricName
} from './types';
import { MEDICAL_PARAMETERS } from './parameters';

/**
 * Core Medical Processing Engine
 * Single source of truth for all medical data operations
 */
export class MedicalEngine {
  private config: PlatformConfig;
  private processingVersion = '1.0.0';

  constructor(config: PlatformConfig) {
    this.config = config;
  }

  // ================================
  // CORE PROCESSING METHODS
  // ================================

  /**
   * Process a single medical value through the complete pipeline
   */
  async processValue(
    metric: MetricName,
    rawValue: number,
    providedUnit: string | null,
    source: 'ai_extraction' | 'manual_entry' | 'import' | 'api',
    metadata: {
      reportId: string;
      userId: string;
      extractedText?: string;
    }
  ): Promise<MedicalValue> {
    const parameter = MEDICAL_PARAMETERS[metric];
    if (!parameter) {
      throw new Error(`Unknown medical parameter: ${metric}`);
    }

    const auditTrail: ProcessingStep[] = [];
    const startTime = new Date();

    // Step 1: Initialize medical value
    const medicalValue: MedicalValue = {
      id: this.generateValueId(),
      metric,
      raw: {
        value: rawValue,
        unit: providedUnit,
        source,
        extractedText: metadata.extractedText
      },
      processed: {
        value: rawValue,
        unit: providedUnit || parameter.units.standard,
        confidence: 'low',
        processingMethod: 'explicit_unit',
        conversionFactor: 1
      },
      validation: {
        status: 'valid',
        isWithinNormalRange: false,
        isWithinCriticalRange: false,
        clinicalStatus: 'normal',
        warnings: [],
        suggestions: []
      },
      metadata: {
        reportId: metadata.reportId,
        userId: metadata.userId,
        timestamp: startTime,
        processingStage: 'raw',
        processingVersion: this.processingVersion,
        auditTrail
      }
    };

    // Step 2: Unit processing and conversion
    const unitResult = await this.processUnit(medicalValue, parameter);
    this.addAuditStep(medicalValue, 'normalized', 'unit_processing', unitResult);

    // Step 3: Value validation
    const validationResult = await this.validateValue(medicalValue, parameter);
    this.addAuditStep(medicalValue, 'validated', 'value_validation', validationResult);

    // Step 4: Clinical interpretation
    const clinicalResult = await this.interpretClinically(medicalValue, parameter);
    this.addAuditStep(medicalValue, 'stored', 'clinical_interpretation', clinicalResult);

    medicalValue.metadata.processingStage = 'stored';
    return medicalValue;
  }

  /**
   * Create a complete medical report from processed values
   */
  async createReport(processedValues: MedicalValue[]): Promise<MedicalReport> {
    const reportId = this.generateReportId();
    const timestamp = new Date();

    // Group values by metric
    const valueMap = new Map<MetricName, MedicalValue>();
    processedValues.forEach(value => {
      valueMap.set(value.metric, value);
    });

    // Calculate quality metrics
    const quality = this.calculateReportQuality(processedValues);

    const report: MedicalReport = {
      id: reportId,
      userId: processedValues[0]?.metadata.userId || '',
      metadata: {
        type: this.inferReportType(processedValues),
        date: timestamp,
        source: processedValues[0]?.raw.source || 'unknown',
        version: 1
      },
      values: valueMap,
      quality,
      processing: {
        status: 'completed',
        steps: this.consolidateProcessingSteps(processedValues),
        errors: [],
        warnings: this.consolidateWarnings(processedValues)
      }
    };

    return report;
  }

  // ================================
  // UNIT PROCESSING
  // ================================

  private async processUnit(
    value: MedicalValue,
    parameter: MedicalParameter
  ): Promise<{ success: boolean; method: string; confidence: ConfidenceLevel }> {
    
    // Method 1: Explicit unit provided
    if (value.raw.unit) {
      const conversion = this.findUnitConversion(value.raw.unit, parameter);
      if (conversion) {
        value.processed.value = value.raw.value * conversion.factor;
        value.processed.unit = parameter.units.standard;
        value.processed.conversionFactor = conversion.factor;
        value.processed.processingMethod = 'explicit_unit';
        value.processed.confidence = 'high';
        return { success: true, method: 'explicit_unit', confidence: 'high' };
      }
    }

    // Method 2: Pattern matching based on value range
    const patternMatch = this.inferUnitFromPattern(value.raw.value, parameter);
    if (patternMatch) {
      const conversion = this.findUnitConversion(patternMatch.unit, parameter);
      if (conversion) {
        value.processed.value = value.raw.value * conversion.factor;
        value.processed.unit = parameter.units.standard;
        value.processed.conversionFactor = conversion.factor;
        value.processed.processingMethod = 'pattern_match';
        value.processed.confidence = patternMatch.confidence;
        return { success: true, method: 'pattern_match', confidence: patternMatch.confidence };
      }
    }

    // Method 3: Assume standard unit
    value.processed.value = value.raw.value;
    value.processed.unit = parameter.units.standard;
    value.processed.conversionFactor = 1;
    value.processed.processingMethod = 'range_inference';
    value.processed.confidence = 'medium';
    
    return { success: true, method: 'range_inference', confidence: 'medium' };
  }

  private findUnitConversion(unit: string, parameter: MedicalParameter) {
    // Exact match
    const exactMatch = parameter.units.conversionRules.find(rule => rule.from === unit);
    if (exactMatch) return exactMatch;

    // Fuzzy match for common variations
    const normalizedUnit = unit.toLowerCase().trim();
    const fuzzyMatch = parameter.units.conversionRules.find(rule => 
      rule.from.toLowerCase().includes(normalizedUnit) ||
      normalizedUnit.includes(rule.from.toLowerCase())
    );
    
    return fuzzyMatch;
  }

  private inferUnitFromPattern(value: number, parameter: MedicalParameter): 
    { unit: string; confidence: ConfidenceLevel } | null {
    
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
  // VALUE VALIDATION
  // ================================

  private async validateValue(
    value: MedicalValue,
    parameter: MedicalParameter
  ): Promise<ValidationResult> {
    
    const processedValue = value.processed.value;
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Range validation
    const isWithinCritical = processedValue >= parameter.clinical.criticalRange.min && 
                            processedValue <= parameter.clinical.criticalRange.max;
    
    const isWithinNormal = processedValue >= parameter.clinical.normalRange.min && 
                          processedValue <= parameter.clinical.normalRange.max;

    // Determine clinical status
    let clinicalStatus: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' = 'normal';
    
    if (!isWithinCritical) {
      if (processedValue < parameter.clinical.criticalRange.min) {
        clinicalStatus = 'critical_low';
        warnings.push(`Critically low ${parameter.name}: ${processedValue} ${value.processed.unit}`);
      } else {
        clinicalStatus = 'critical_high';
        warnings.push(`Critically high ${parameter.name}: ${processedValue} ${value.processed.unit}`);
      }
    } else if (!isWithinNormal) {
      if (processedValue < parameter.clinical.normalRange.min) {
        clinicalStatus = 'low';
        suggestions.push(`Below normal range for ${parameter.name}`);
      } else {
        clinicalStatus = 'high';
        suggestions.push(`Above normal range for ${parameter.name}`);
      }
    }

    // Update validation results
    value.validation = {
      status: isWithinCritical ? 'valid' : 'warning',
      isWithinNormalRange: isWithinNormal,
      isWithinCriticalRange: isWithinCritical,
      clinicalStatus,
      warnings,
      suggestions
    };

    return { 
      passed: isWithinCritical, 
      message: warnings.length > 0 ? warnings[0] : 'Value within acceptable range',
      suggestion: suggestions.length > 0 ? suggestions[0] : undefined
    };
  }

  // ================================
  // CLINICAL INTERPRETATION
  // ================================

  private async interpretClinically(
    value: MedicalValue,
    parameter: MedicalParameter
  ): Promise<{ insights: string[]; recommendations: string[] }> {
    
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Add clinical context based on parameter significance
    if (parameter.clinical.significance) {
      insights.push(parameter.clinical.significance);
    }

    // Add condition-specific insights
    if (parameter.clinical.relatedConditions.length > 0) {
      const conditions = parameter.clinical.relatedConditions.join(', ');
      insights.push(`Relevant for: ${conditions}`);
    }

    // Add value-specific recommendations
    switch (value.validation.clinicalStatus) {
      case 'critical_low':
      case 'critical_high':
        recommendations.push('Immediate medical attention recommended');
        recommendations.push('Consult healthcare provider urgently');
        break;
      case 'low':
      case 'high':
        recommendations.push('Discuss with healthcare provider');
        recommendations.push('Monitor trend over time');
        break;
      default:
        recommendations.push('Continue regular monitoring');
    }

    return { insights, recommendations };
  }

  // ================================
  // HELPER METHODS
  // ================================

  private generateValueId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addAuditStep(
    value: MedicalValue,
    stage: any,
    operation: string,
    result: any
  ): void {
    value.metadata.auditTrail.push({
      stage,
      timestamp: new Date(),
      operation,
      input: value.raw,
      output: result,
      errors: [],
      warnings: []
    });
  }

  private calculateReportQuality(values: MedicalValue[]) {
    if (values.length === 0) {
      return {
        overallScore: 0,
        completeness: 0,
        confidence: 0,
        issues: []
      };
    }

    const confidenceScores = values.map(v => {
      switch (v.processed.confidence) {
        case 'high': return 1.0;
        case 'medium': return 0.7;
        case 'low': return 0.4;
        case 'reject': return 0.0;
        default: return 0.0;
      }
    });

    const averageConfidence = confidenceScores.reduce((sum: number, score: number) => sum + score, 0) / confidenceScores.length;
    const completeness = values.length / 12; // Assuming 12 core metrics
    const overallScore = (averageConfidence + Math.min(completeness, 1.0)) / 2;

    return {
      overallScore,
      completeness: Math.min(completeness, 1.0),
      confidence: averageConfidence,
      issues: values.filter(v => v.validation.warnings.length > 0).map(v => ({
        type: 'invalid_value' as const,
        severity: 'medium' as const,
        description: v.validation.warnings[0] || 'Validation warning',
        suggestion: v.validation.suggestions[0] || 'Review value',
        affectedValues: [v.id]
      }))
    };
  }

  private inferReportType(values: MedicalValue[]): 'lab_report' | 'imaging' | 'clinical_note' | 'manual_entry' {
    if (values.length === 0) return 'manual_entry';
    
    const sources = [...new Set(values.map(v => v.raw.source))];
    if (sources.includes('ai_extraction')) return 'lab_report';
    if (sources.includes('manual_entry')) return 'manual_entry';
    return 'lab_report';
  }

  private consolidateProcessingSteps(values: MedicalValue[]): ProcessingStep[] {
    // Consolidate all processing steps from all values
    const allSteps: ProcessingStep[] = [];
    values.forEach(value => {
      allSteps.push(...value.metadata.auditTrail);
    });
    
    // Sort by timestamp
    return allSteps.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private consolidateWarnings(values: MedicalValue[]): string[] {
    const warnings: string[] = [];
    values.forEach(value => {
      warnings.push(...value.validation.warnings);
    });
    return [...new Set(warnings)]; // Remove duplicates
  }

  // ================================
  // SYSTEM HEALTH
  // ================================

  async getHealth() {
    return {
      status: 'healthy',
      version: this.processingVersion,
      parametersLoaded: Object.keys(MEDICAL_PARAMETERS).length,
      configValid: this.validateConfig(),
      lastProcessed: new Date().toISOString()
    };
  }

  updateConfig(newConfig: PlatformConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  private validateConfig(): boolean {
    return !!(
      this.config.processing &&
      this.config.quality &&
      this.config.regional &&
      this.config.compliance
    );
  }
}
