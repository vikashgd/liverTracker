import { MedicalUploader } from "@/components/medical-uploader";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { 
  Microscope, 
  BarChart3, 
  Shield, 
  FileText, 
  Sparkles,
  PenTool,
  FolderOpen,
  Calendar
} from "lucide-react";

export default async function Home() {
  await requireAuth(); // Redirect to sign-in if not authenticated
  
  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        {/* Modern Hero Section */}
        <div className="modern-hero mb-12">
          <div className="max-w-3xl mx-auto relative z-10">
            <h1 className="text-4xl font-bold text-medical-neutral-900 mb-4">
              Upload Medical Report
            </h1>
            <p className="text-lg text-medical-neutral-600 mb-8">
              Transform your lab results into intelligent health insights with our 
              AI-powered medical data extraction and analysis platform.
            </p>
            
            {/* Modern Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="modern-feature-card">
                <div className="icon-container bg-medical-primary-100">
                  <Microscope className="w-6 h-6 text-medical-primary-600 modern-icon" />
                </div>
                <h3 className="font-semibold text-medical-neutral-900 mb-2">AI Extraction</h3>
                <p className="text-sm text-medical-neutral-600">
                  Automatically extract key metrics from your lab reports
                </p>
              </div>
              
              <div className="modern-feature-card">
                <div className="icon-container bg-medical-success-100">
                  <BarChart3 className="w-6 h-6 text-medical-success-600 modern-icon" />
                </div>
                <h3 className="font-semibold text-medical-neutral-900 mb-2">Smart Analysis</h3>
                <p className="text-sm text-medical-neutral-600">
                  Medical intelligence with trend analysis and insights
                </p>
              </div>
              
              <div className="modern-feature-card">
                <div className="icon-container bg-medical-warning-100">
                  <Shield className="w-6 h-6 text-medical-warning-600 modern-icon" />
                </div>
                <h3 className="font-semibold text-medical-neutral-900 mb-2">Secure & Private</h3>
                <p className="text-sm text-medical-neutral-600">
                  Medical-grade security for your health data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Upload Section */}
        <div className="max-w-2xl mx-auto">
          <div className="medical-card-primary">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-medical-primary-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-medical-neutral-900">
                Upload Your Lab Report
              </h2>
            </div>
            
            <div className="mb-6">
              <p className="text-medical-neutral-600 mb-4">
                Supported formats: PDF files and images (JPG, PNG). 
                Your data is processed securely and never shared.
              </p>
              
              <div className="bg-medical-primary-50 border border-medical-primary-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-medical-primary-600" />
                  <h4 className="font-medium text-medical-primary-800">What we extract:</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-medical-primary-700">
                  <div>• ALT/SGPT levels</div>
                  <div>• AST/SGOT levels</div>
                  <div>• Platelet count</div>
                  <div>• Bilirubin levels</div>
                  <div>• Albumin levels</div>
                  <div>• Report dates</div>
                </div>
              </div>
            </div>
            
            <MedicalUploader />
            
            {/* Modern Quick Actions */}
            <div className="mt-8 pt-6 border-t border-medical-neutral-200">
              <h3 className="font-medium text-medical-neutral-900 mb-4">
                Quick Actions
              </h3>
              <div className="modern-quick-actions">
                <Link 
                  href="/manual-entry" 
                  className="modern-quick-action"
                >
                  <PenTool className="icon" />
                  <span>Manual Entry</span>
                </Link>
                <Link 
                  href="/dashboard" 
                  className="modern-quick-action"
                >
                  <BarChart3 className="icon" />
                  <span>View Dashboard</span>
                </Link>
                <Link 
                  href="/reports" 
                  className="modern-quick-action"
                >
                  <FolderOpen className="icon" />
                  <span>Browse Reports</span>
                </Link>
                <Link 
                  href="/timeline" 
                  className="modern-quick-action"
                >
                  <Calendar className="icon" />
                  <span>View Timeline</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Help Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="modern-help-section">
            <h3 className="text-lg font-semibold text-medical-neutral-900 mb-4">
              Need Help?
            </h3>
            <div className="modern-help-grid">
              <div className="modern-help-item">
                <h4>Supported Report Types</h4>
                <ul>
                  <li>Liver Function Tests (LFT)</li>
                  <li>Complete Blood Count (CBC)</li>
                  <li>Comprehensive Metabolic Panel</li>
                  <li>Individual lab result reports</li>
                </ul>
              </div>
              <div className="modern-help-item">
                <h4>Tips for Best Results</h4>
                <ul>
                  <li>Ensure text is clear and readable</li>
                  <li>Include the full report with headers</li>
                  <li>Upload in good lighting conditions</li>
                  <li>Review extracted data before saving</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
