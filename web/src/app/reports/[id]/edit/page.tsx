import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export default async function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireAuth();
  
  const report = await prisma.reportFile.findUnique({ 
    where: { id, userId }, 
    include: { metrics: true } 
  });
  if (!report) return <main className="container mx-auto p-6">Not found</main>;

  // Read-only server view; suggest editing via uploader flow for now
  return (
    <main className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Report</h1>
        <Link className="text-sm underline" href={`/reports/${report.id}`}>Back</Link>
      </div>
      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm">Report date: {report.reportDate ? new Date(report.reportDate).toISOString().slice(0,10) : "No date"}</div>
        <div className="text-sm">Report type: {report.reportType ?? "Unknown"}</div>
      </div>
      <div className="rounded-xl border divide-y">
        {report.metrics.map((m) => (
          <div key={m.id} className="p-4">
            <div className="font-medium">{m.name}</div>
            <div className="text-sm text-muted-foreground">{m.value ?? "-"} {m.unit ?? ""}</div>
            {m.textValue ? <div className="text-sm">{m.textValue}</div> : null}
          </div>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">Inline editing form will be added next. For now, re-upload or use the review screen to correct fields.</div>
    </main>
  );
}


