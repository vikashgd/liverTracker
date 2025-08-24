import { EnhancedImagingDashboard } from "@/components/enhanced-imaging-dashboard";
import { requireAuth } from "@/lib/auth";

export default async function ImagingPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        <EnhancedImagingDashboard userId={user.id} />
      </div>
    </div>
  );
}