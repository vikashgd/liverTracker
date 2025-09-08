import { requireAuth } from "@/lib/auth";
import { ShareManagementClient } from "./share-management-client";

export default async function ShareManagementPage() {
  await requireAuth();
  
  return <ShareManagementClient />;
}

export async function generateMetadata() {
  return {
    title: "Share Management - LiverTracker",
    description: "Manage your medical report share links and access controls",
  };
}