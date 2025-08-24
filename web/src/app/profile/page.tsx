import { PatientProfileForm } from "@/components/patient-profile-form";
import { requireAuth } from "@/lib/auth";

export default async function ProfilePage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        <PatientProfileForm />
      </div>
    </div>
  );
}