import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { DeleteReportButton } from "@/components/delete-report-button";
import Link from "next/link";

export default async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireAuth();
  
  const report = await prisma.reportFile.findUnique({
    where: { id, userId },
    include: { metrics: true },
  });
  if (!report) return <main className="container mx-auto p-6">Not found</main>;

  const labs = report.metrics.filter((m) => m.category !== "imaging");
  const imaging = report.metrics.filter((m) => m.category === "imaging");

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Report Detail</h1>
        <Link className="text-sm underline" href="/reports">Back to list</Link>
      </div>
      <div className="rounded-xl border p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">{report.reportType ?? "Unknown"}</div>
          <div className="text-sm">{report.reportDate ? new Date(report.reportDate).toISOString().slice(0, 10) : "No date"}</div>
          <div className="text-xs text-muted-foreground">{report.objectKey}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link className="text-sm underline" href="/timeline">Timeline</Link>
          <ExportPdfButton reportId={report.id} />
          <DeleteReportButton reportId={report.id} />
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Lab metrics</h2>
        {labs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No lab metrics detected.</div>
        ) : (
          <div className="rounded-xl border divide-y">
            {labs.map((m) => (
              <div key={m.id} className="p-3 flex items-center justify-between">
                <div className="font-medium">{m.name}</div>
                <div className="text-sm">
                  {m.value ?? "-"} {m.unit ?? ""}
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <Link className="text-sm underline" href={`/reports/${report.id}/edit`}>Edit report</Link>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Imaging</h2>
        {imaging.length === 0 ? (
          <div className="text-sm text-muted-foreground">No imaging findings.</div>
        ) : (
          <div className="rounded-xl border divide-y">
            {imaging.map((m) => (
              <div key={m.id} className="p-3">
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-muted-foreground">
                  {m.value != null ? `${m.value} ${m.unit ?? ""}` : null}
                </div>
                {m.textValue && <div className="text-sm">{m.textValue}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


