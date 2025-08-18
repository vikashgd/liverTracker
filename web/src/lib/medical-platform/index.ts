/**
 * LIVERTRACKER MEDICAL DATA PLATFORM
 * Enterprise-grade, production-ready medical data processing system
 * 
 * This replaces ALL fragmented systems with a single, comprehensive platform:
 * - Unified data processing
 * - Consistent validation
 * - Production-grade error handling
 * - Scalable architecture
 * - Medical compliance
 */

export * from './core/engine';
export * from './core/types';
export * from './core/validation';
export * from './processing/extractor';
export * from './processing/normalizer';
export * from './storage/repository';
export * from './ui/components';
export * from './analytics/insights';

// Main platform interface
export { MedicalDataPlatform } from './platform';
