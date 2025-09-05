import { requireAuth } from "@/lib/auth";
import { ComprehensiveMedicalScoring } from "@/components/comprehensive-medical-scoring";
import { getMedicalPlatform } from "@/lib/medical-platform";

export default async function ScoringPage() {
  const userId = await requireAuth();

  console.log(`🧮 Medical Scoring page loading for user: ${userId}`);

  // Get latest lab values to pre-populate the scoring calculators
  const platform = getMedicalPlatform();
  let initialValues = {};

  try {
    const latestValues = await platform.getLatestValues(userId);
    
    // Extract relevant values for MELD and Child-Pugh calculations
    initialValues = {
      bilirubin: latestValues.get('Bilirubin')?.processed.value,
      creatinine: latestValues.get('Creatinine')?.processed.value,
      inr: latestValues.get('INR')?.processed.value,
      sodium: latestValues.get('Sodium')?.processed.value,
      albumin: latestValues.get('Albumin')?.processed.value
    };

    console.log('📊 Pre-populated scoring values:', initialValues);
  } catch (error) {
    console.error('Failed to load latest values for scoring:', error);
  }

  return <ComprehensiveMedicalScoring initialValues={initialValues} />;
}