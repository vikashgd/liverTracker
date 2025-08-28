import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { EnhancedMedicalUploader } from "@/components/upload-flow/enhanced-medical-uploader";

export default async function EnhancedUploadPage() {
  await requireAuth();
  
  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-medical-primary-600 hover:text-medical-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-medical-primary-500 to-medical-primary-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-medical-neutral-900">
                Enhanced Mobile Upload Flow
              </h1>
              <p className="text-medical-neutral-600">
                Experience our new 3-step mobile-optimized upload process
              </p>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="bg-gradient-to-r from-medical-primary-50 to-medical-success-50 border border-medical-primary-200 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-medical-neutral-900 mb-3">✨ New Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-primary-500 rounded-full"></div>
                <span>3-step guided workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-success-500 rounded-full"></div>
                <span>Mobile swipe navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-warning-500 rounded-full"></div>
                <span>Enhanced error recovery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-primary-500 rounded-full"></div>
                <span>Progress visualization</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-success-500 rounded-full"></div>
                <span>Accessibility optimized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-medical-warning-500 rounded-full"></div>
                <span>Haptic feedback</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Upload Flow */}
        <div className="max-w-4xl mx-auto">
          <EnhancedMedicalUploader />
        </div>
        
        {/* Instructions */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white border border-medical-neutral-200 rounded-xl p-6">
            <h3 className="font-semibold text-medical-neutral-900 mb-4">How to Use</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-medical-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-medical-primary-600">1</span>
                </div>
                <h4 className="font-medium text-medical-neutral-900 mb-2">Upload & Preview</h4>
                <p className="text-sm text-medical-neutral-600">
                  Select your medical reports and preview them in an organized grid
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-medical-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-medical-success-600">2</span>
                </div>
                <h4 className="font-medium text-medical-neutral-900 mb-2">AI Processing & Review</h4>
                <p className="text-sm text-medical-neutral-600">
                  Watch AI extract data and review the results before saving
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-medical-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl font-bold text-medical-warning-600">3</span>
                </div>
                <h4 className="font-medium text-medical-neutral-900 mb-2">Success & Summary</h4>
                <p className="text-sm text-medical-neutral-600">
                  View your saved report summary and start another upload
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}