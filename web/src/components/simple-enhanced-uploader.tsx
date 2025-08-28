"use client";

import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  X,
  Camera,
  Sparkles
} from "lucide-react";

interface UploadState {
  currentTab: string;
  files: File[];
  isProcessing: boolean;
  isSaving: boolean;
  extractedData: any;
  savedId: string | null;
  error: string | null;
}

export function SimpleEnhancedUploader() {
  const [state, setState] = useState<UploadState>({
    currentTab: "upload",
    files: [],
    isProcessing: false,
    isSaving: false,
    extractedData: null,
    savedId: null,
    error: null
  });

  const updateState = useCallback((updates: Partial<UploadState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    updateState({ files, error: null });
  }, [updateState]);

  const handleFileRemove = useCallback((index: number) => {
    updateState({ 
      files: state.files.filter((_, i) => i !== index) 
    });
  }, [state.files, updateState]);

  const handleProcessFiles = useCallback(async () => {
    if (state.files.length === 0) {
      updateState({ error: "Please select at least one file" });
      return;
    }

    updateState({ isProcessing: true, error: null });

    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock extracted data
      const mockData = {
        reportType: "Blood Test",
        reportDate: new Date().toISOString().split('T')[0],
        metrics: [
          { name: "Hemoglobin", value: "14.2", unit: "g/dL", status: "Normal" },
          { name: "White Blood Cells", value: "7.5", unit: "10³/μL", status: "Normal" },
          { name: "Platelets", value: "250", unit: "10³/μL", status: "Normal" }
        ]
      };

      updateState({ 
        extractedData: mockData, 
        isProcessing: false,
        currentTab: "review"
      });
    } catch (error) {
      updateState({ 
        error: "Processing failed. Please try again.",
        isProcessing: false 
      });
    }
  }, [state.files, updateState]);

  const handleSaveReport = useCallback(async () => {
    updateState({ isSaving: true, error: null });

    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reportId = `report_${Date.now()}`;
      updateState({ 
        savedId: reportId,
        isSaving: false,
        currentTab: "success"
      });
    } catch (error) {
      updateState({ 
        error: "Save failed. Please try again.",
        isSaving: false 
      });
    }
  }, [updateState]);

  const handleReset = useCallback(() => {
    setState({
      currentTab: "upload",
      files: [],
      isProcessing: false,
      isSaving: false,
      extractedData: null,
      savedId: null,
      error: null
    });
  }, []);

  const canGoNext = () => {
    switch (state.currentTab) {
      case "upload":
        return state.files.length > 0 && !state.isProcessing;
      case "review":
        return state.extractedData && !state.isSaving;
      default:
        return false;
    }
  };

  const canGoBack = () => {
    return state.currentTab !== "upload" && !state.isProcessing && !state.isSaving;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex items-center space-x-2 ${state.currentTab === "upload" ? "text-medical-primary-600" : "text-medical-success-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              state.currentTab === "upload" ? "bg-medical-primary-600 text-white" : "bg-medical-success-600 text-white"
            }`}>
              {state.currentTab === "upload" ? "1" : <CheckCircle className="w-5 h-5" />}
            </div>
            <span className="font-medium">Upload & Preview</span>
          </div>
          
          <div className={`flex-1 h-0.5 mx-4 ${
            ["review", "success"].includes(state.currentTab) ? "bg-medical-success-600" : "bg-medical-neutral-200"
          }`} />
          
          <div className={`flex items-center space-x-2 ${
            state.currentTab === "review" ? "text-medical-primary-600" : 
            state.currentTab === "success" ? "text-medical-success-600" : "text-medical-neutral-400"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              state.currentTab === "review" ? "bg-medical-primary-600 text-white" :
              state.currentTab === "success" ? "bg-medical-success-600 text-white" : "bg-medical-neutral-200 text-medical-neutral-500"
            }`}>
              {state.currentTab === "success" ? <CheckCircle className="w-5 h-5" /> : "2"}
            </div>
            <span className="font-medium">Processing & Review</span>
          </div>
          
          <div className={`flex-1 h-0.5 mx-4 ${
            state.currentTab === "success" ? "bg-medical-success-600" : "bg-medical-neutral-200"
          }`} />
          
          <div className={`flex items-center space-x-2 ${
            state.currentTab === "success" ? "text-medical-success-600" : "text-medical-neutral-400"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              state.currentTab === "success" ? "bg-medical-success-600 text-white" : "bg-medical-neutral-200 text-medical-neutral-500"
            }`}>
              {state.currentTab === "success" ? <CheckCircle className="w-5 h-5" /> : "3"}
            </div>
            <span className="font-medium">Success</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs value={state.currentTab} className="w-full">
        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <div className="bg-white border border-medical-neutral-200 rounded-xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-medical-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-medical-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
                Upload Your Medical Reports
              </h3>
              <p className="text-medical-neutral-600 mb-6">
                Select images or PDF files of your lab reports
              </p>
              
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-6 py-4 bg-medical-primary-600 text-white rounded-lg hover:bg-medical-primary-700 cursor-pointer transition-colors text-lg font-medium min-h-[48px] touch-manipulation"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Choose Files
                </label>
                
                {/* Mobile-specific file input */}
                <div className="block md:hidden">
                  <button
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg text-lg font-medium min-h-[48px] touch-manipulation"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <Camera className="w-6 h-6 mr-3" />
                    📱 Tap to Upload Files
                  </button>
                </div>
              </div>
            </div>

            {/* File Preview */}
            {state.files.length > 0 && (
              <div className="mt-6 pt-6 border-t border-medical-neutral-200">
                <h4 className="font-medium text-medical-neutral-900 mb-4">
                  Selected Files ({state.files.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.files.map((file, index) => (
                    <div key={index} className="relative bg-medical-neutral-50 border border-medical-neutral-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-medical-primary-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-medical-neutral-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-medical-neutral-500">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => handleFileRemove(index)}
                          className="text-medical-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Processing & Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <div className="bg-white border border-medical-neutral-200 rounded-xl p-6">
            {state.isProcessing ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-medical-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-medical-primary-600 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
                  Processing Your Reports
                </h3>
                <p className="text-medical-neutral-600">
                  Our AI is extracting data from your medical reports...
                </p>
              </div>
            ) : state.extractedData ? (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-medical-success-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-medical-success-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-medical-neutral-900">
                      Review Extracted Data
                    </h3>
                    <p className="text-medical-neutral-600">
                      Please review and edit the extracted information
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-medical-neutral-700 mb-1">
                        Report Type
                      </label>
                      <input
                        type="text"
                        value={state.extractedData.reportType}
                        className="w-full px-3 py-2 border border-medical-neutral-300 rounded-lg focus:ring-2 focus:ring-medical-primary-500 focus:border-transparent"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-medical-neutral-700 mb-1">
                        Report Date
                      </label>
                      <input
                        type="date"
                        value={state.extractedData.reportDate}
                        className="w-full px-3 py-2 border border-medical-neutral-300 rounded-lg focus:ring-2 focus:ring-medical-primary-500 focus:border-transparent"
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-medical-neutral-900 mb-3">Extracted Metrics</h4>
                    <div className="space-y-3">
                      {state.extractedData.metrics.map((metric: any, index: number) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-medical-neutral-50 rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-medical-neutral-600 mb-1">
                              Metric Name
                            </label>
                            <input
                              type="text"
                              value={metric.name}
                              className="w-full px-2 py-1 text-sm border border-medical-neutral-300 rounded focus:ring-1 focus:ring-medical-primary-500"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-medical-neutral-600 mb-1">
                              Value
                            </label>
                            <input
                              type="text"
                              value={metric.value}
                              className="w-full px-2 py-1 text-sm border border-medical-neutral-300 rounded focus:ring-1 focus:ring-medical-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-medical-neutral-600 mb-1">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={metric.unit}
                              className="w-full px-2 py-1 text-sm border border-medical-neutral-300 rounded focus:ring-1 focus:ring-medical-primary-500"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-medical-neutral-600 mb-1">
                              Status
                            </label>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              metric.status === "Normal" ? "bg-medical-success-100 text-medical-success-800" : "bg-medical-warning-100 text-medical-warning-800"
                            }`}>
                              {metric.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </TabsContent>

        {/* Success Tab */}
        <TabsContent value="success" className="space-y-6">
          <div className="bg-white border border-medical-neutral-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-medical-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-medical-success-600" />
            </div>
            <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
              Report Saved Successfully!
            </h3>
            <p className="text-medical-neutral-600 mb-6">
              Your medical report has been processed and saved to your account.
            </p>
            
            {state.savedId && (
              <div className="bg-medical-success-50 border border-medical-success-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-medical-success-800">
                  <strong>Report ID:</strong> {state.savedId}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleReset}
                className="bg-medical-primary-600 hover:bg-medical-primary-700 text-white px-6 py-2"
              >
                Upload Another Report
              </Button>
              <div>
                <a
                  href="/dashboard"
                  className="text-medical-primary-600 hover:text-medical-primary-700 text-sm underline"
                >
                  View Dashboard
                </a>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-medical-neutral-200">
        <div>
          {canGoBack() && (
            <Button
              variant="outline"
              onClick={() => {
                const tabs = ["upload", "review", "success"];
                const currentIndex = tabs.indexOf(state.currentTab);
                if (currentIndex > 0) {
                  updateState({ currentTab: tabs[currentIndex - 1] });
                }
              }}
              disabled={state.isProcessing || state.isSaving}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        
        <div>
          {state.currentTab === "upload" && (
            <Button
              onClick={handleProcessFiles}
              disabled={state.isProcessing || state.files.length === 0}
              className="bg-medical-primary-600 hover:bg-medical-primary-700 text-white disabled:opacity-50"
            >
              {state.isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process Files ({state.files.length})
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
          
          {state.currentTab === "review" && canGoNext() && (
            <Button
              onClick={handleSaveReport}
              disabled={state.isSaving}
              className="bg-medical-primary-600 hover:bg-medical-primary-700 text-white"
            >
              {state.isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Report"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{state.error}</span>
            <button
              onClick={() => updateState({ error: null })}
              className="ml-auto text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}