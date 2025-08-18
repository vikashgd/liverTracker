import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TimelinePage({ searchParams }: { searchParams?: Promise<{ sort?: string }> }) {
  const userId = await requireAuth();
  const eventsRaw = await prisma.timelineEvent.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: 200,
    include: { report: { select: { id: true, reportDate: true, createdAt: true } } },
  });
  const sp = (await (searchParams ?? Promise.resolve({}))) as { sort?: string };
  const sortBy = (sp.sort ?? "report") === "upload" ? "upload" : "report";
  const events = [...eventsRaw].sort((a, b) => {
    const getReportDate = (d: Date | null | undefined) => (d ? new Date(d).getTime() : -Infinity);
    if (sortBy === "report") {
      const ar = getReportDate(a.report?.reportDate as Date | null | undefined);
      const br = getReportDate(b.report?.reportDate as Date | null | undefined);
      if (ar === br) return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      return br - ar;
    }
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  });
  return (
    <main className="container mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm">Sort:</div>
          <Link className={`text-sm underline ${sortBy === "report" ? "font-semibold" : ""}`} href="/timeline?sort=report">Report date</Link>
          <Link className={`text-sm underline ${sortBy === "upload" ? "font-semibold" : ""}`} href="/timeline?sort=upload">Upload date</Link>
          <Link className="text-sm underline" href="/">Home</Link>
        </div>
      </div>
      <div className="rounded-xl border divide-y">
        {events.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">No events yet.</div>
        )}
        {events.map((e) => {
          const reportDate = e.report?.reportDate ? new Date(e.report.reportDate).toISOString().slice(0, 10) : "—";
          const uploadDate = e.report?.createdAt ? new Date(e.report.createdAt).toISOString().slice(0, 10) : new Date(e.occurredAt).toISOString().slice(0,10);
          return (
            <div key={e.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium capitalize">{e.type.replaceAll("_", " ")}</div>
                <div className="text-xs text-muted-foreground">Report: {reportDate} • Uploaded: {uploadDate}</div>
              </div>
              {e.reportId ? (
                <Link className="text-xs underline" href={`/reports/${e.reportId}`}>View report</Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}


