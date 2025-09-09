import { requireAuth } from "@/lib/auth";
import UploadEnhancedClient from "./upload-enhanced-client";

export default async function EnhancedUploadPage() {
  await requireAuth();
  
  return <UploadEnhancedClient />;
}