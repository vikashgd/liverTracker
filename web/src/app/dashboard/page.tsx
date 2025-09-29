import DashboardClient from "./dashboard-client";
import { DashboardPageGuard } from "@/components/atomic-onboarding-guard";

export default function DashboardPage() {
  return (
    <DashboardPageGuard>
      <DashboardClient />
    </DashboardPageGuard>
  );
}
