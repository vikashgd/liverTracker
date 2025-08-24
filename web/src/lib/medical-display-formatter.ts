/**
 * COMPREHENSIVE MEDICAL VALUE FORMATTER
 * Ensures consistent unit conversion across ALL display components
 * This is the single source of truth for displaying medical values
 */

import { MEDICAL_PARAMETERS } from './medical-platform/core/parameters';
import type { MetricName } from './medical-platform/core/types';

export interface FormattedMedicalValue {
  displayValue: number;
  displayUnit: string;
  originalValue: number;
  originalUnit?: string;
  wasConverted: boolean;
  conversionNote?: string;
}

/**
 * Universal medical value formatter
 * Applies consistent unit conversion for display across the entire application
 */
export function formatMedicalValue(
  metricName: string,
  value: number,
  unit?: string
): FormattedMedicalValue {
  
  // Handle null/undefined values
  if (value === null || value === undefined || isNaN(value)) {
    return {
      displayValue: 0,
      displayUnit: unit || '',
      originalValue: value || 0,
      originalUnit: unit,
      wasConverted: false
    };
  }

  // Find parameter definition
  const parameter = MEDICAL_PARAMETERS[metricName as MetricName];
  if (!parameter) {
    // Unknown parameter - return as-is
    return {
      displayValue: value,
      displayUnit: unit || '',
      originalValue: value,
      originalUnit: unit,
      wasConverted: false
    };
  }

  const standardUnit = parameter.units.standard;
  let convertedValue = value;
  let conversionNote: string | undefined;
  let wasConverted = false;

  // Apply metric-specific conversions
  switch (parameter.metric) {
    case 'Platelets':
      convertedValue = convertPlatelets(value, unit);
      if (convertedValue !== value) {
        wasConverted = true;
        conversionNote = `Converted from ${value} ${unit || 'raw'} to standard units`;
      }
      break;

    case 'Bilirubin':
      convertedValue = convertBilirubin(value, unit);
      if (convertedValue !== value) {
        wasConverted = true;
        conversionNote = `Converted from ${value} ${unit || 'μmol/L'} to mg/dL`;
      }
      break;

    case 'Creatinine':
      convertedValue = convertCreatinine(value, unit);
      if (convertedValue !== value) {
        wasConverted = true;
        conversionNote = `Converted from ${value} ${unit || 'μmol/L'} to mg/dL`;
      }
      break;

    case 'Albumin':
      convertedValue = convertAlbumin(value, unit);
      if (convertedValue !== value) {
        wasConverted = true;
        conversionNote = `Converted from ${value} ${unit || 'g/L'} to g/dL`;
      }
      break;

    case 'TotalProtein':
      convertedValue = convertTotalProtein(value, unit);
      if (convertedValue !== value) {
        wasConverted = true;
        conversionNote = `Converted from ${value} ${unit || 'g/L'} to g/dL`;
      }
      break;

    default:
      // For other metrics, check if explicit conversion is needed
      if (unit && unit !== standardUnit) {
        const conversionRule = parameter.units.conversionRules.find(
          rule => rule.from === unit
        );
        if (conversionRule) {
          convertedValue = value * conversionRule.factor;
          wasConverted = true;
          conversionNote = `Converted from ${unit} to ${standardUnit}`;
        }
      }
      break;
  }

  // Round to appropriate precision
  const precision = getDisplayPrecision(parameter.metric, convertedValue);
  convertedValue = Math.round(convertedValue * Math.pow(10, precision)) / Math.pow(10, precision);

  return {
    displayValue: convertedValue,
    displayUnit: standardUnit,
    originalValue: value,
    originalUnit: unit,
    wasConverted,
    conversionNote
  };
}

/**
 * Platelet conversion logic
 */
function convertPlatelets(value: number, unit?: string): number {
  // Raw count (/μL) to standard (×10³/μL)
  if (value >= 50000 && value <= 1000000) {
    console.log(`🔧 Display conversion: Platelets ${value}/μL → ${value * 0.001} ×10³/μL`);
    return value * 0.001;
  }
  
  // Lakhs to standard (Indian units)
  if (value >= 0.5 && value <= 10 && (unit?.includes('lakh') || value < 50)) {
    console.log(`🔧 Display conversion: Platelets ${value} lakhs → ${value * 100} ×10³/μL`);
    return value * 100;
  }
  
  // Already in standard units or reasonable range
  return value;
}

/**
 * Bilirubin conversion logic
 */
function convertBilirubin(value: number, unit?: string): number {
  // μmol/L to mg/dL
  if (value >= 5 && value <= 500 && (unit?.includes('μmol') || unit?.includes('umol') || value > 20)) {
    console.log(`🔧 Display conversion: Bilirubin ${value} μmol/L → ${(value / 17.1).toFixed(2)} mg/dL`);
    return value / 17.1;
  }
  
  return value;
}

/**
 * Creatinine conversion logic
 */
function convertCreatinine(value: number, unit?: string): number {
  // μmol/L to mg/dL
  if (value >= 30 && value <= 900 && (unit?.includes('μmol') || unit?.includes('umol') || value > 15)) {
    console.log(`🔧 Display conversion: Creatinine ${value} μmol/L → ${(value / 88.4).toFixed(2)} mg/dL`);
    return value / 88.4;
  }
  
  return value;
}

/**
 * Albumin conversion logic
 */
function convertAlbumin(value: number, unit?: string): number {
  // g/L to g/dL
  if (value >= 15 && value <= 70 && (unit?.includes('g/L') || value > 10)) {
    console.log(`🔧 Display conversion: Albumin ${value} g/L → ${(value / 10).toFixed(1)} g/dL`);
    return value / 10;
  }
  
  return value;
}

/**
 * Total Protein conversion logic
 */
function convertTotalProtein(value: number, unit?: string): number {
  // g/L to g/dL
  if (value >= 40 && value <= 120 && (unit?.includes('g/L') || value > 15)) {
    console.log(`🔧 Display conversion: Total Protein ${value} g/L → ${(value / 10).toFixed(1)} g/dL`);
    return value / 10;
  }
  
  return value;
}

/**
 * Get appropriate decimal places for display
 */
function getDisplayPrecision(metric: MetricName, value: number): number {
  switch (metric) {
    case 'Platelets':
      return 0; // Whole numbers only
    
    case 'INR':
      return 2; // 2 decimal places for precision
    
    case 'Bilirubin':
    case 'Creatinine':
    case 'Albumin':
    case 'TotalProtein':
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

/**
 * Format value for display with proper units
 */
export function formatValueWithUnit(
  metricName: string,
  value: number,
  unit?: string,
  options?: {
    showUnit?: boolean;
    showConversionNote?: boolean;
  }
): string {
  const formatted = formatMedicalValue(metricName, value, unit);
  
  let result = formatted.displayValue.toString();
  
  if (options?.showUnit !== false) {
    result += ` ${formatted.displayUnit}`;
  }
  
  if (options?.showConversionNote && formatted.wasConverted && formatted.conversionNote) {
    result += ` (${formatted.conversionNote})`;
  }
  
  return result;
}

/**
 * Batch format multiple values
 */
export function formatMedicalValues(
  values: Array<{ metric: string; value: number; unit?: string }>
): Array<FormattedMedicalValue & { metric: string }> {
  return values.map(({ metric, value, unit }) => ({
    metric,
    ...formatMedicalValue(metric, value, unit)
  }));
}

/**
 * Check if a value needs conversion
 */
export function needsConversion(metricName: string, value: number, unit?: string): boolean {
  const formatted = formatMedicalValue(metricName, value, unit);
  return formatted.wasConverted;
}

/**
 * Get conversion suggestions for a value
 */
export function getConversionSuggestion(metricName: string, value: number, unit?: string): string | null {
  const formatted = formatMedicalValue(metricName, value, unit);
  
  if (formatted.wasConverted) {
    return `This value appears to be in ${unit || 'non-standard units'}. ` +
           `Converted to ${formatted.displayValue} ${formatted.displayUnit} for consistency.`;
  }
  
  return null;
}