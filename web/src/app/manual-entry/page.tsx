import { SimpleLabEntry } from "@/components/simple-lab-entry";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";

export default async function ManualEntryPage() {
  await requireAuth(); // Redirect to sign-in if not authenticated
  
  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-medical-neutral-900 mb-2">
                Manual Lab Entry
              </h1>
              <p className="text-medical-neutral-600">
                Quickly enter lab values from phone calls, consultations, or paper reports
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <Link 
                href="/dashboard" 
                className="btn-secondary flex items-center space-x-2"
              >
                <span>📊</span>
                <span>View Dashboard</span>
              </Link>
              <Link 
                href="/" 
                className="btn-primary flex items-center space-x-2"
              >
                <span>📄</span>
                <span>Upload Report</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="medical-card p-6 text-center">
            <div className="w-12 h-12 bg-medical-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold text-medical-neutral-900 mb-2">Quick Entry</h3>
            <p className="text-sm text-medical-neutral-600">
              Rapidly enter values during consultations or phone calls
            </p>
          </div>
          
          <div className="medical-card p-6 text-center">
            <div className="w-12 h-12 bg-medical-success-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="font-semibold text-medical-neutral-900 mb-2">Smart Analysis</h3>
            <p className="text-sm text-medical-neutral-600">
              Automatic unit validation and reference range checking
            </p>
          </div>
          
          <div className="medical-card p-6 text-center">
            <div className="w-12 h-12 bg-medical-warning-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="font-semibold text-medical-neutral-900 mb-2">Trend Tracking</h3>
            <p className="text-sm text-medical-neutral-600">
              Integrates seamlessly with your health timeline and charts
            </p>
          </div>
        </div>

        {/* Manual Entry Component */}
                  <SimpleLabEntry />

        {/* Help Section */}
        <div className="mt-12">
          <div className="medical-card p-6">
            <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
              💡 Tips for Accurate Entry
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-medical-neutral-900 mb-2">
                  Best Practices
                </h4>
                <ul className="space-y-1 text-medical-neutral-600">
                  <li>• Double-check values before saving</li>
                  <li>• Select the correct unit from the dropdown</li>
                  <li>• Enter the test date, not today&apos;s date</li>
                  <li>• Include all available lab values</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-medical-neutral-900 mb-2">
                  Understanding Units
                </h4>
                <ul className="space-y-1 text-medical-neutral-600">
                  <li>• <span className="bg-blue-100 text-blue-700 px-1 rounded text-xs">Standard</span> units are automatically selected</li>
                  <li>• Alternative units are converted automatically</li>
                  <li>• Hover over unit names for descriptions</li>
                  <li>• Use the exact units from your lab report</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-medical-neutral-900 mb-2">
                  Common Use Cases
                </h4>
                <ul className="space-y-1 text-medical-neutral-600">
                  <li>• Phone results from your doctor</li>
                  <li>• Quick entry during consultations</li>
                  <li>• Adding missing values from scanned reports</li>
                  <li>• Historical data from paper records</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
