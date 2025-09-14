"use client";

import React, { useState } from "react";
import { Download, Printer, FileText, User, Calendar, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendsAnalysisTab } from "./trends-analysis-tab";
import { ConsolidatedReportTab } from "./consolidated-report-tab";
import { AIInsightsTab } from "./ai-insights-tab";
import { ScoringTab } from "./scoring-tab";
import { PatientProfileTab } from "./patient-profile-tab";
import { OriginalDocumentsTab } from "./original-documents-tab";
import { LabResultsTab } from "./lab-results-tab";

interface ProfessionalMedicalViewProps {
  shareToken: string;
  medicalData: any;
  shareInfo: any;
}

export function ProfessionalMedicalView({ 
  shareToken, 
  medicalData, 
  shareInfo 
}: ProfessionalMedicalViewProps) {
  const [activeTab, setActiveTab] = useState("lab-results");



  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/share/${shareToken}/export/pdf`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medical-report-${shareInfo.title || 'shared'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadData = async () => {
    try {
      const response = await fetch(`/api/share/${shareToken}/export/csv`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab-data-${shareInfo.title || 'shared'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-medical-neutral-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-medical-neutral-200 print:border-b-0">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo150x150.png" 
                alt="LiverTracker Logo" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-medical-neutral-900">
                  LiverTracker - {shareInfo.title || 'Medical Report'}
                </h1>
                <div className="flex items-center gap-4 text-sm text-medical-neutral-600">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{medicalData.patient?.name || 'Patient'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Generated: {new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Secure Share</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Toolbar */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-medical-primary-600 text-white rounded-lg hover:bg-medical-primary-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Watermark */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-6xl font-bold text-medical-neutral-200 opacity-10 pointer-events-none z-0 print:opacity-30">
        CONFIDENTIAL
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 relative z-10">
        {/* Executive Summary - Always visible first */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-medical-primary-600" />
              Executive Summary
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Laboratory Reports</h3>
                  <div className="text-2xl font-bold text-blue-700">
                    {medicalData?.reports?.individual?.length || 0}
                  </div>
                  <p className="text-blue-600 text-sm">Total reports analyzed</p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Clinical Scoring</h3>
                  <div className="text-2xl font-bold text-green-700">
                    {medicalData?.scoring ? '✓' : '—'}
                  </div>
                  <p className="text-green-600 text-sm">
                    {medicalData?.scoring ? 'Available' : 'Not calculated'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-2">AI Analysis</h3>
                  <div className="text-2xl font-bold text-purple-700">
                    {medicalData?.aiAnalysis ? '✓' : '—'}
                  </div>
                  <p className="text-purple-600 text-sm">
                    {medicalData?.aiAnalysis ? 'Insights available' : 'Not available'}
                  </p>
                </div>
              </div>
              
              {medicalData?.executiveSummary && (
                <div className="bg-medical-neutral-50 rounded-lg p-4 border border-medical-neutral-200">
                  <h4 className="font-medium text-medical-neutral-900 mb-2">Key Findings</h4>
                  <div className="prose max-w-none text-medical-neutral-700">
                    {typeof medicalData.executiveSummary === 'string' 
                      ? medicalData.executiveSummary 
                      : 'Comprehensive medical data analysis available in detailed tabs below.'
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabbed Medical Content */}
        <div className="bg-white rounded-xl shadow-sm border border-medical-neutral-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-t-xl border-b-2 border-blue-200">
              <TabsTrigger 
                value="lab-results" 
                className="text-base font-semibold px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100 text-blue-700"
              >
                🧪 Lab Results
              </TabsTrigger>
              <TabsTrigger 
                value="consolidated" 
                className="text-base font-semibold px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-green-100 text-green-700"
              >
                📊 Consolidated Report
              </TabsTrigger>
              <TabsTrigger 
                value="trends" 
                className="text-base font-semibold px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-100 text-purple-700"
              >
                📈 Trends
              </TabsTrigger>
              <TabsTrigger 
                value="scoring" 
                className="text-base font-semibold px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-orange-100 text-orange-700"
              >
                🎯 Clinical Scoring
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="text-base font-semibold px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-indigo-100 text-indigo-700"
              >
                👤 Patient Profile
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="lab-results" className="mt-0">
                <LabResultsTab reports={medicalData?.reports?.individual || medicalData?.reports || []} />
              </TabsContent>

              <TabsContent value="consolidated" className="mt-0">
                <ConsolidatedReportTab reports={medicalData?.reports?.individual || medicalData?.reports || []} trends={medicalData?.trends} />
              </TabsContent>

              <TabsContent value="trends" className="mt-0">
                <TrendsAnalysisTab trends={medicalData?.reports?.trends || []} />
              </TabsContent>

              <TabsContent value="scoring" className="mt-0">
                <ScoringTab scoring={medicalData?.scoring} />
              </TabsContent>



              <TabsContent value="profile" className="mt-0">
                <PatientProfileTab profile={
                  medicalData?.patient ? (() => {
                    // Import privacy utilities
                    const { createPrivacyCompliantProfile } = require('@/lib/medical-sharing/privacy-utils');
                    
                    // Merge demographics and profile data
                    const rawProfile = {
                      name: medicalData.patient.demographics?.name || medicalData.patient.name,
                      age: medicalData.patient.demographics?.age,
                      gender: medicalData.patient.demographics?.gender,
                      dateOfBirth: medicalData.patient.demographics?.dateOfBirth,
                      primaryDiagnosis: medicalData.patient.demographics?.primaryDiagnosis,
                      diagnosisDate: medicalData.patient.demographics?.diagnosisDate,
                      location: medicalData.patient.demographics?.location,
                      height: medicalData.patient.profile?.height,
                      weight: medicalData.patient.profile?.weight,
                      onDialysis: medicalData.patient.profile?.onDialysis,
                      dialysisSessionsPerWeek: medicalData.patient.profile?.dialysisSessionsPerWeek,
                      dialysisStartDate: medicalData.patient.profile?.dialysisStartDate,
                      dialysisType: medicalData.patient.profile?.dialysisType,
                      liverDiseaseType: medicalData.patient.profile?.liverDiseaseType,
                      transplantCandidate: medicalData.patient.profile?.transplantCandidate,
                      transplantListDate: medicalData.patient.profile?.transplantListDate,
                      alcoholUse: medicalData.patient.profile?.alcoholUse,
                      smokingStatus: medicalData.patient.profile?.smokingStatus,
                      primaryPhysician: medicalData.patient.profile?.primaryPhysician,
                      hepatologist: medicalData.patient.profile?.hepatologist,
                      transplantCenter: medicalData.patient.profile?.transplantCenter,
                      ascites: medicalData.patient.profile?.ascites,
                      encephalopathy: medicalData.patient.profile?.encephalopathy
                    };
                    
                    // Apply privacy-compliant anonymization for healthcare provider sharing
                    return createPrivacyCompliantProfile(rawProfile, 'HEALTHCARE_PROVIDER');
                  })() : null
                } />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer Information */}
        <div className="mt-8 text-center text-xs text-medical-neutral-500 print:text-black">
          <div className="bg-white rounded-lg p-4 border border-medical-neutral-200">
            <p className="mb-2">
              <strong>Confidential Medical Information</strong> - This report contains protected health information. 
              Unauthorized disclosure is prohibited.
            </p>
            <p>
              Generated by LiverTracker - Track Your Liver. Extend Your Life. • Share Token: {shareToken} • 
              Accessed: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}