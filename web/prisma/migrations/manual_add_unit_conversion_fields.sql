-- Manual migration to add unit conversion fields to ExtractedMetric table
-- Run this when database connection is available

-- Add new columns to ExtractedMetric table
ALTER TABLE "ExtractedMetric" ADD COLUMN IF NOT EXISTS "originalValue" DOUBLE PRECISION;
ALTER TABLE "ExtractedMetric" ADD COLUMN IF NOT EXISTS "originalUnit" TEXT;
ALTER TABLE "ExtractedMetric" ADD COLUMN IF NOT EXISTS "wasConverted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ExtractedMetric" ADD COLUMN IF NOT EXISTS "conversionFactor" DOUBLE PRECISION;
ALTER TABLE "ExtractedMetric" ADD COLUMN IF NOT EXISTS "conversionRule" TEXT;
ALTER TABLE "ExtractedMetric" ADD COLUMN IF NOT EXISTS "conversionDate" TIMESTAMP(3);
ALTER TABLE "ExtractedMetric" ADD COLUMN IF NOT EXISTS "validationStatus" TEXT;
ALTER TABLE "ExtractedMetric" ADD COLUMN IF NOT EXISTS "validationNotes" TEXT;

-- Create new tables if they don't exist
CREATE TABLE IF NOT EXISTS "ReportType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PdfExport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateRange" TEXT,
    "reportIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PdfExport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReportType_name_key') THEN
        ALTER TABLE "ReportType" ADD CONSTRAINT "ReportType_name_key" UNIQUE ("name");
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PdfExport_userId_fkey') THEN
        ALTER TABLE "PdfExport" ADD CONSTRAINT "PdfExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey') THEN
        ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Update existing records to have default values for new fields
UPDATE "ExtractedMetric" 
SET 
    "originalValue" = "value",
    "originalUnit" = "unit",
    "wasConverted" = false
WHERE "originalValue" IS NULL;