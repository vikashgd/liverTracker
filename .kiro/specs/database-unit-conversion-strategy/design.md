# Database Unit Conversion Strategy - Design Document

## Overview

This design addresses the fundamental architectural issue where we have sophisticated unit conversion logic but store unconverted data in the database, requiring runtime conversion at every retrieval point. The solution is to **convert and store data in standard units at write time**, eliminating the need for runtime conversion.

## Architecture

### Current State Problems

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Raw Data      │    │   Database       │    │   Retrieval     │
│   (Mixed Units) │───▶│   (Mixed Units)  │───▶│   + Runtime     │
│                 │    │                  │    │   Conversion    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │ Multiple Points │
                                               │ Need Conversion │
                                               │ Logic (Mess!)   │
                                               └─────────────────┘
```

### Proposed Solution

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Raw Data      │    │   Conversion     │    │   Database      │
│   (Mixed Units) │───▶│   at Write Time  │───▶│   (Standard     │
│                 │    │                  │    │    Units)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   Direct        │
                                               │   Retrieval     │
                                               │   (Clean!)      │
                                               └─────────────────┘
```

## Database Schema Enhancement

### Enhanced ExtractedMetric Table

```sql
-- Enhanced schema to support conversion tracking
model ExtractedMetric {
  id                String     @id @default(cuid())
  reportId          String
  name              String
  
  -- Standardized values (primary data)
  value             Float?     -- Converted to standard units
  unit              String?    -- Standard unit
  
  -- Original values (audit trail)
  originalValue     Float?     -- Original extracted value
  originalUnit      String?    -- Original unit from source
  
  -- Conversion metadata
  wasConverted      Boolean    @default(false)
  conversionFactor  Float?     -- Factor used for conversion
  conversionRule    String?    -- Rule identifier used
  conversionDate    DateTime?  -- When conversion was applied
  
  -- Existing fields
  createdAt         DateTime   @default(now())
  category          String?
  textValue         String?
  
  -- Quality assurance
  validationStatus  String?    -- "valid", "suspicious", "error"
  validationNotes   String?    -- Details about validation
  
  report            ReportFile @relation(fields: [reportId], references: [id])
}
```

### Migration Strategy

#### Phase 1: Schema Enhancement
1. Add new columns to ExtractedMetric table
2. Maintain backward compatibility with existing columns
3. Deploy schema changes without data migration

#### Phase 2: Data Migration
1. Analyze existing data for conversion needs
2. Apply conversions using centralized unit converter
3. Populate new columns with conversion metadata
4. Validate converted values against clinical ranges

#### Phase 3: Code Updates
1. Update write paths to use new schema
2. Simplify read paths to use standardized values
3. Remove runtime conversion logic from retrieval points
4. Update tests and documentation

## Component Design

### 1. Enhanced Unit Converter Service

```typescript
interface ConversionResult {
  // Standardized values
  value: number;
  unit: string;
  
  // Original values
  originalValue: number;
  originalUnit: string;
  
  // Conversion metadata
  wasConverted: boolean;
  conversionFactor?: number;
  conversionRule?: string;
  conversionDate: Date;
  
  // Quality assurance
  validationStatus: 'valid' | 'suspicious' | 'error';
  validationNotes?: string;
}

class EnhancedUnitConverter {
  convertForStorage(metricName: string, value: number, unit?: string): ConversionResult;
  validateConversion(result: ConversionResult, parameter: MedicalParameter): ValidationResult;
  batchConvert(metrics: MetricData[]): ConversionResult[];
}
```

### 2. Database Service Layer

```typescript
class MedicalDataRepository {
  // Write operations - always convert before storage
  async saveMetric(metric: RawMetricData): Promise<ExtractedMetric> {
    const converted = unitConverter.convertForStorage(metric.name, metric.value, metric.unit);
    const validated = unitConverter.validateConversion(converted, parameter);
    
    return await prisma.extractedMetric.create({
      data: {
        // Standard values
        value: converted.value,
        unit: converted.unit,
        
        // Original values
        originalValue: converted.originalValue,
        originalUnit: converted.originalUnit,
        
        // Conversion metadata
        wasConverted: converted.wasConverted,
        conversionFactor: converted.conversionFactor,
        conversionRule: converted.conversionRule,
        conversionDate: converted.conversionDate,
        
        // Quality assurance
        validationStatus: validated.status,
        validationNotes: validated.notes,
        
        // Standard fields
        reportId: metric.reportId,
        name: metric.name,
        category: metric.category,
        textValue: metric.textValue
      }
    });
  }
  
  // Read operations - direct retrieval, no conversion needed
  async getMetrics(reportId: string): Promise<ExtractedMetric[]> {
    return await prisma.extractedMetric.findMany({
      where: { reportId },
      // Values are already in standard units!
    });
  }
}
```

### 3. Migration Service

```typescript
class DatabaseMigrationService {
  async migrateToStandardUnits(options: MigrationOptions): Promise<MigrationResult> {
    const batchSize = options.batchSize || 100;
    let processed = 0;
    let converted = 0;
    let errors: string[] = [];
    
    // Process in batches to avoid memory issues
    while (true) {
      const batch = await this.getUnconvertedBatch(batchSize, processed);
      if (batch.length === 0) break;
      
      for (const metric of batch) {
        try {
          const converted = unitConverter.convertForStorage(
            metric.name, 
            metric.value, 
            metric.unit
          );
          
          await this.updateMetricWithConversion(metric.id, converted);
          if (converted.wasConverted) converted++;
          
        } catch (error) {
          errors.push(`Metric ${metric.id}: ${error.message}`);
        }
      }
      
      processed += batch.length;
      await this.reportProgress(processed, converted, errors.length);
    }
    
    return { processed, converted, errors };
  }
}
```

## Data Flow

### Write Path (New Reports)

```
Raw Data → Unit Converter → Validation → Database (Standard Units)
```

1. **Extract/Input**: Raw medical data with mixed units
2. **Convert**: Apply unit conversion to standard units
3. **Validate**: Check converted values against clinical ranges
4. **Store**: Save standardized values with conversion metadata
5. **Audit**: Log conversion details for traceability

### Read Path (Simplified)

```
Database Query → Direct Return (No Conversion Needed)
```

1. **Query**: Request medical data from database
2. **Return**: Values already in standard units
3. **Display**: Direct use without conversion logic

### Migration Path (Existing Data)

```
Existing Data → Analysis → Batch Conversion → Validation → Update
```

1. **Analyze**: Identify records needing conversion
2. **Convert**: Apply unit conversion in batches
3. **Validate**: Verify converted values are reasonable
4. **Update**: Store converted values with metadata
5. **Report**: Provide detailed migration results

## Error Handling

### Conversion Errors
- **Invalid Units**: Store original value, flag for manual review
- **Out of Range**: Convert but mark as suspicious
- **Missing Parameters**: Use fallback conversion or store as-is

### Migration Errors
- **Batch Failures**: Continue with remaining batches
- **Individual Errors**: Log and continue processing
- **Validation Failures**: Mark records for manual review

### Rollback Strategy
- **Preserve Originals**: Always keep original values
- **Audit Trail**: Track all changes for rollback
- **Incremental Rollback**: Ability to rollback specific batches

## Performance Considerations

### Write Performance
- **Batch Processing**: Convert multiple metrics together
- **Caching**: Cache conversion rules and parameters
- **Async Processing**: Non-blocking conversion for large datasets

### Read Performance
- **No Runtime Conversion**: Direct database queries
- **Indexing**: Proper indexes on converted values
- **Caching**: Cache frequently accessed data

### Migration Performance
- **Batch Size**: Configurable batch sizes for memory management
- **Progress Tracking**: Real-time progress reporting
- **Parallel Processing**: Multiple workers for large datasets

## Quality Assurance

### Validation Rules
- **Clinical Ranges**: Validate against normal/critical ranges
- **Unit Consistency**: Ensure units match expected standards
- **Value Reasonableness**: Flag extremely high/low values

### Monitoring
- **Conversion Rates**: Track percentage of successful conversions
- **Error Rates**: Monitor conversion failures
- **Data Quality**: Regular validation of converted values

### Testing Strategy
- **Unit Tests**: Test conversion logic thoroughly
- **Integration Tests**: Test end-to-end data flow
- **Migration Tests**: Test migration with sample data
- **Performance Tests**: Validate performance under load

## Security and Compliance

### Data Integrity
- **Atomic Operations**: Ensure conversion and storage are atomic
- **Backup Strategy**: Backup before major migrations
- **Audit Logging**: Complete audit trail of all changes

### Privacy
- **Data Minimization**: Only store necessary conversion metadata
- **Access Control**: Restrict access to conversion audit data
- **Retention**: Define retention policies for audit data

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Enhance database schema
- Update unit converter service
- Create migration utilities
- Implement validation logic

### Phase 2: Migration (Week 2)
- Run data analysis
- Execute migration in batches
- Validate migration results
- Generate migration reports

### Phase 3: Code Updates (Week 3)
- Update write paths to use new schema
- Simplify read paths
- Remove runtime conversion logic
- Update tests and documentation

### Phase 4: Validation (Week 4)
- Comprehensive testing
- Performance validation
- Quality assurance checks
- Production deployment

## Success Metrics

### Technical Metrics
- **Conversion Rate**: >95% successful conversions
- **Performance**: <50ms average query time
- **Error Rate**: <1% conversion errors
- **Data Quality**: >99% values within expected ranges

### Business Metrics
- **Consistency**: 100% standardized units in database
- **Maintainability**: 80% reduction in conversion-related code
- **Reliability**: Zero data loss during migration
- **User Experience**: Faster dashboard loading times

## Risk Mitigation

### Technical Risks
- **Data Loss**: Comprehensive backup and rollback procedures
- **Performance**: Thorough performance testing and optimization
- **Compatibility**: Gradual migration with backward compatibility

### Business Risks
- **Downtime**: Zero-downtime migration strategy
- **Data Quality**: Extensive validation and quality checks
- **User Impact**: Transparent migration with user communication