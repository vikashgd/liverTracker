import { PatientProfileForm } from "@/components/patient-profile-form";
import { requireAuth } from "@/lib/auth";
import { Suspense } from "react";

function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Suspense fallback={<ProfileLoading />}>
          <PatientProfileForm />
        </Suspense>
      </div>
    </div>
  );
}