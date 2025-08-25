# Database Schema Enhancement for Unit Conversion

## Overview

This document describes the enhancement made to the `ExtractedMetric` table to support comprehensive unit conversion tracking and audit trails.

## Schema Changes

### Enhanced ExtractedMetric Model

The `ExtractedMetric` table has been enhanced with the following new fields:

#### Original Values (Audit Trail)
- `originalValue: Float?` - The original extracted value before conversion
- `originalUnit: String?` - The original unit from the source document

#### Conversion Metadata
- `wasConverted: Boolean` - Whether unit conversion was applied (default: false)
- `conversionFactor: Float?` - The mathematical factor used for conversion
- `conversionRule: String?` - Identifier of the conversion rule applied
- `conversionDate: DateTime?` - Timestamp when conversion was performed

#### Quality Assurance
- `validationStatus: String?` - Status: "valid", "suspicious", or "error"
- `validationNotes: String?` - Detailed notes about validation results

## Data Flow Changes

### Before Enhancement
```
Raw Data → Database (Mixed Units) → Runtime Conversion (Multiple Places)
```

### After Enhancement
```
Raw Data → Unit Conversion → Database (Standard Units + Audit Trail)
```

## Field Usage

### Primary Data Fields
- `value` - Now contains the converted value in standard units
- `unit` - Now contains the standard unit for the parameter

### Audit Trail Fields
- `originalValue` - Preserves the exact value from the source
- `originalUnit` - Preserves the exact unit from the source
- `wasConverted` - Indicates if conversion was performed

### Conversion Tracking
- `conversionFactor` - Mathematical factor (e.g., 0.001 for /μL to ×10³/μL)
- `conversionRule` - Rule identifier (e.g., "raw_count_to_standard")
- `conversionDate` - When the conversion was applied

### Quality Assurance
- `validationStatus` - Quality check result
- `validationNotes` - Detailed validation information

## Migration Strategy

### Backward Compatibility
- All existing fields remain unchanged
- New fields are nullable to support existing data
- Default values ensure no breaking changes

### Data Migration Process
1. **Schema Update** - Add new columns (completed)
2. **Data Analysis** - Identify records needing conversion
3. **Batch Conversion** - Apply conversions with full audit trail
4. **Validation** - Verify converted values are reasonable
5. **Code Updates** - Update application to use new schema

## Benefits

### Data Integrity
- Complete audit trail of all conversions
- Original values always preserved
- Conversion metadata for troubleshooting

### Performance
- No runtime conversion needed
- Direct database queries return standardized data
- Faster dashboard and chart loading

### Maintainability
- Single conversion point at write time
- Centralized conversion logic
- Simplified read operations

### Quality Assurance
- Validation status tracking
- Suspicious value detection
- Comprehensive audit capabilities

## Usage Examples

### Storing Converted Data
```typescript
await prisma.extractedMetric.create({
  data: {
    reportId: "report_123",
    name: "Platelets",
    
    // Standardized values
    value: 70,           // Converted value
    unit: "×10³/μL",     // Standard unit
    
    // Original values
    originalValue: 70000, // Original from report
    originalUnit: "/μL",  // Original unit
    
    // Conversion metadata
    wasConverted: true,
    conversionFactor: 0.001,
    conversionRule: "raw_count_to_standard",
    conversionDate: new Date(),
    
    // Quality assurance
    validationStatus: "valid",
    validationNotes: "Within normal clinical range"
  }
});
```

### Retrieving Standardized Data
```typescript
const metrics = await prisma.extractedMetric.findMany({
  where: { reportId: "report_123" }
});

// Values are already in standard units - no conversion needed!
metrics.forEach(metric => {
  console.log(`${metric.name}: ${metric.value} ${metric.unit}`);
  
  if (metric.wasConverted) {
    console.log(`Original: ${metric.originalValue} ${metric.originalUnit}`);
  }
});
```

## Testing

### Schema Validation
- Verify all new fields are properly added
- Test default values for existing records
- Validate nullable constraints

### Data Migration Testing
- Test conversion with sample data
- Verify audit trail completeness
- Validate rollback procedures

### Application Testing
- Test write operations with new schema
- Verify read operations return correct data
- Test conversion transparency features

## Rollback Procedures

### Emergency Rollback
If issues arise, the schema can be rolled back by:
1. Removing the new columns
2. Restoring original data from audit fields
3. Reverting application code changes

### Data Recovery
Original values are preserved in `originalValue` and `originalUnit` fields, enabling complete data recovery if needed.

## Next Steps

1. **Data Migration** - Analyze and convert existing data
2. **Code Updates** - Update write paths to use new schema
3. **Read Path Simplification** - Remove runtime conversion logic
4. **Testing** - Comprehensive validation of the new system
5. **Documentation** - Update API and user documentation

## Monitoring

### Key Metrics to Track
- Conversion success rate
- Validation status distribution
- Performance improvements
- Data quality metrics

### Alerts
- Conversion failures
- Suspicious value detection
- Performance degradation
- Data quality issues