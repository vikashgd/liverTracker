import { ComprehensiveMedicalScoring } from "@/components/comprehensive-medical-scoring";
import { requireAuth } from "@/lib/auth";

export default async function MELDCalculatorPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        <ComprehensiveMedicalScoring />
      </div>
    </div>
  );
}