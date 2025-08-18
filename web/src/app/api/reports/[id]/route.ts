import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { GCSStorage } from "@/lib/storage/gcs";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, context: unknown) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { params } = (context as { params?: { id?: string } }) ?? {};
  const id = typeof params?.id === "string" ? params.id : "";
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  
  const report = await prisma.reportFile.findUnique({ 
    where: { id, userId }, 
    select: { id: true, objectKey: true } 
  });
  if (!report) return NextResponse.json({ ok: true });
  // Delete related rows
  await prisma.extractedMetric.deleteMany({ where: { reportId: id } });
  await prisma.timelineEvent.deleteMany({ where: { reportId: id } });
  await prisma.reportFile.delete({ where: { id } });
  // Best-effort delete of the stored object
  try {
    if (report.objectKey) {
      const storage = new GCSStorage();
      await storage.deleteObject(report.objectKey);
    }
  } catch {
    // ignore
  }
  return NextResponse.json({ ok: true });
}


