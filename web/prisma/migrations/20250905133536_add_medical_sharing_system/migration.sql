-- CreateEnum
CREATE TYPE "public"."ShareType" AS ENUM ('COMPLETE_PROFILE', 'SPECIFIC_REPORTS', 'CONSULTATION_PACKAGE');

-- AlterTable
ALTER TABLE "public"."PatientProfile" ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "public"."ShareLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareType" "public"."ShareType" NOT NULL DEFAULT 'COMPLETE_PROFILE',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reportIds" TEXT[],
    "includeProfile" BOOLEAN NOT NULL DEFAULT true,
    "includeDashboard" BOOLEAN NOT NULL DEFAULT true,
    "includeScoring" BOOLEAN NOT NULL DEFAULT true,
    "includeAI" BOOLEAN NOT NULL DEFAULT true,
    "includeFiles" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxViews" INTEGER,
    "currentViews" INTEGER NOT NULL DEFAULT 0,
    "password" TEXT,
    "allowedEmails" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareAccess" (
    "id" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewDuration" INTEGER,
    "actionsPerformed" JSONB,

    CONSTRAINT "ShareAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "public"."ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_token_idx" ON "public"."ShareLink"("token");

-- CreateIndex
CREATE INDEX "ShareLink_userId_idx" ON "public"."ShareLink"("userId");

-- CreateIndex
CREATE INDEX "ShareLink_expiresAt_idx" ON "public"."ShareLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ShareAccess_shareLinkId_idx" ON "public"."ShareAccess"("shareLinkId");

-- CreateIndex
CREATE INDEX "ShareAccess_accessedAt_idx" ON "public"."ShareAccess"("accessedAt");

-- AddForeignKey
ALTER TABLE "public"."ShareLink" ADD CONSTRAINT "ShareLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareAccess" ADD CONSTRAINT "ShareAccess_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "public"."ShareLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
