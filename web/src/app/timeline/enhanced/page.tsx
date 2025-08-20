import { EnhancedTimeline } from "@/components/enhanced-timeline";
import { requireAuth } from "@/lib/auth";

export default async function EnhancedTimelinePage() {
  await requireAuth();

  return (
    <div className="medical-layout-container py-8">
      <div className="max-w-7xl mx-auto">
        <EnhancedTimeline />
      </div>
    </div>
  );
}
