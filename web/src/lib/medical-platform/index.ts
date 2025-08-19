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

// Core platform components
export * from './core/engine';
export * from './core/types';
export * from './core/parameters';
export * from './core/validation';

// Processing subsystems
export * from './processing/extractor';
export * from './processing/normalizer';

// Storage layer
export * from './storage/repository';

// Analytics engine
export * from './analytics/insights';

// Main platform interface
export { MedicalDataPlatform, getMedicalPlatform, resetMedicalPlatform } from './platform';

// Quick access to key components
export { MEDICAL_PARAMETERS, getParameterByName, getAllMetricNames } from './core/parameters';
