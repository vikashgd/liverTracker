"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Users, Clock, Eye } from "lucide-react";
import { ShareManagementPanel } from "@/components/medical-sharing/share-management-panel";

export function ShareManagementClient() {
  return (
    <div className="min-h-screen bg-medical-neutral-50">
      <div className="medical-layout-container py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-medical-primary-600 hover:text-medical-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-medical-primary-500 to-medical-primary-600 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-medical-neutral-900">
                Share Management
              </h1>
              <p className="text-medical-neutral-600">
                Securely share your medical reports with healthcare providers
              </p>
            </div>
          </div>
          
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-medical-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-medical-neutral-900">Secure Sharing</h3>
                  <p className="text-sm text-medical-neutral-600">
                    Encrypted links with access controls
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-medical-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-medical-neutral-900">Time-Limited</h3>
                  <p className="text-sm text-medical-neutral-600">
                    Links expire automatically for security
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-medical-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-medical-neutral-900">Full Control</h3>
                  <p className="text-sm text-medical-neutral-600">
                    Monitor access and revoke anytime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Management Panel */}
        <div className="max-w-4xl mx-auto">
          <ShareManagementPanel />
        </div>
        
        {/* Help Section */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-4">How Medical Report Sharing Works</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Creating Share Links</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Choose what medical data to include</li>
                  <li>• Set expiry dates and view limits</li>
                  <li>• Add password protection if needed</li>
                  <li>• Restrict access to specific email addresses</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Security & Privacy</h4>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• All access is logged and monitored</li>
                  <li>• Links expire automatically for security</li>
                  <li>• You can revoke access at any time</li>
                  <li>• HIPAA-compliant sharing process</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <p className="text-blue-900 text-sm">
                <strong>Privacy Notice:</strong> When you create a share link, you're giving consent 
                to share the selected medical information with healthcare providers who access the link. 
                All sharing activity is logged for security and compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}