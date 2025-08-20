import { EnhancedReportsDashboard } from "@/components/enhanced-reports-dashboard";
import { requireAuth } from "@/lib/auth";

export default async function EnhancedReportsPage() {
  await requireAuth();

  return (
    <div className="medical-layout-container py-8">
      <div className="max-w-7xl mx-auto">
        <EnhancedReportsDashboard />
      </div>
    </div>
  );
}
