-- AlterTable
ALTER TABLE "ExtractedMetric" ADD COLUMN     "conversionDate" TIMESTAMP(3),
ADD COLUMN     "conversionFactor" DOUBLE PRECISION,
ADD COLUMN     "conversionRule" TEXT,
ADD COLUMN     "originalUnit" TEXT,
ADD COLUMN     "originalValue" DOUBLE PRECISION,
ADD COLUMN     "validationNotes" TEXT,
ADD COLUMN     "validationStatus" TEXT,
ADD COLUMN     "wasConverted" BOOLEAN NOT NULL DEFAULT false;

-- Update existing records to set wasConverted = false for all existing data
UPDATE "ExtractedMetric" SET "wasConverted" = false WHERE "wasConverted" IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN "ExtractedMetric"."value" IS 'Converted to standard units';
COMMENT ON COLUMN "ExtractedMetric"."unit" IS 'Standard unit';
COMMENT ON COLUMN "ExtractedMetric"."originalValue" IS 'Original extracted value';
COMMENT ON COLUMN "ExtractedMetric"."originalUnit" IS 'Original unit from source';
COMMENT ON COLUMN "ExtractedMetric"."wasConverted" IS 'Whether unit conversion was applied';
COMMENT ON COLUMN "ExtractedMetric"."conversionFactor" IS 'Factor used for conversion';
COMMENT ON COLUMN "ExtractedMetric"."conversionRule" IS 'Rule identifier used';
COMMENT ON COLUMN "ExtractedMetric"."conversionDate" IS 'When conversion was applied';
COMMENT ON COLUMN "ExtractedMetric"."validationStatus" IS 'valid, suspicious, or error';
COMMENT ON COLUMN "ExtractedMetric"."validationNotes" IS 'Details about validation';