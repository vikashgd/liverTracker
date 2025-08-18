import { requireAuth } from "@/lib/auth";
import { DataCorruptionFixer } from "@/components/data-corruption-fixer";

export default async function DataFixPage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-medical-neutral-900 mb-2">
            🔧 Data Corruption Repair Center
          </h1>
          <p className="text-medical-neutral-600">
            Advanced tools to identify and correct data quality issues in your medical records.
          </p>
        </div>

        <DataCorruptionFixer />
      </div>
    </div>
  );
}
