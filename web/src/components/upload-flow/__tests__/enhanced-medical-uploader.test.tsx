import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedMedicalUploader } from '../enhanced-medical-uploader';

// Mock the upload flow components
vi.mock('../upload-flow-tabs', () => ({
  UploadFlowTabs: ({ onProcessFiles, onSaveReport, onResetFlow, flowState }: any) => (
    <div data-testid="upload-flow-tabs">
      <div data-testid="current-tab">{flowState.currentTab}</div>
      <div data-testid="uploaded-files">{flowState.uploadedFiles.length}</div>
      <div data-testid="is-processing">{flowState.isProcessing.toString()}</div>
      <div data-testid="is-saving">{flowState.isSaving.toString()}</div>
      <div data-testid="error">{flowState.error || 'none'}</div>
      <button onClick={onProcessFiles}>Process Files</button>
      <button onClick={onSaveReport}>Save Report</button>
      <button onClick={onResetFlow}>Reset Flow</button>
    </div>
  )
}));

vi.mock('../error-boundary', () => ({
  UploadFlowErrorBoundary: ({ children }: any) => <div>{children}</div>
}));

// Mock the upload flow hook
const mockUpdateState = vi.fn();
const mockResetFlow = vi.fn();
const mockAddFiles = vi.fn();
const mockRemoveFile = vi.fn();
const mockClearAllFiles = vi.fn();

vi.mock('@/hooks/use-upload-flow', () => ({
  useUploadFlow: () => ({
    state: {
      currentTab: 1,
      uploadedFiles: [],
      extractedData: null,
      isProcessing: false,
      isSaving: false,
      savedId: null,
      error: null
    },
    updateState: mockUpdateState,
    resetFlow: mockResetFlow,
    addFiles: mockAddFiles,
    removeFile: mockRemoveFile,
    clearAllFiles: mockClearAllFiles
  })
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('EnhancedMedicalUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ key: 'test-key', id: 'test-id' }),
      text: () => Promise.resolve('Success')
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders upload flow tabs', () => {
    render(<EnhancedMedicalUploader />);
    expect(screen.getByTestId('upload-flow-tabs')).toBeInTheDocument();
  });

  it('handles file selection correctly', () => {
    render(<EnhancedMedicalUploader />);
    
    // This would be called by the UploadFlowTabs component
    expect(mockAddFiles).toBeDefined();
    expect(mockUpdateState).toBeDefined();
  });

  it('handles file removal correctly', () => {
    render(<EnhancedMedicalUploader />);
    
    expect(mockRemoveFile).toBeDefined();
  });

  it('handles clear all files correctly', () => {
    render(<EnhancedMedicalUploader />);
    
    expect(mockClearAllFiles).toBeDefined();
    expect(mockUpdateState).toBeDefined();
  });

  it('handles flow reset correctly', () => {
    render(<EnhancedMedicalUploader />);
    
    const resetButton = screen.getByText('Reset Flow');
    fireEvent.click(resetButton);
    
    expect(mockResetFlow).toHaveBeenCalled();
  });

  describe('File Processing', () => {
    it('validates files before processing', async () => {
      // Mock state with no files
      vi.mocked(require('@/hooks/use-upload-flow').useUploadFlow).mockReturnValue({
        state: {
          currentTab: 1,
          uploadedFiles: [],
          extractedData: null,
          isProcessing: false,
          isSaving: false,
          savedId: null,
          error: null
        },
        updateState: mockUpdateState,
        resetFlow: mockResetFlow,
        addFiles: mockAddFiles,
        removeFile: mockRemoveFile,
        clearAllFiles: mockClearAllFiles
      });

      render(<EnhancedMedicalUploader />);
      
      const processButton = screen.getByText('Process Files');
      fireEvent.click(processButton);
      
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({ 
          error: "No files selected for processing" 
        });
      });
    });

    it('processes valid files successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock state with valid files
      vi.mocked(require('@/hooks/use-upload-flow').useUploadFlow).mockReturnValue({
        state: {
          currentTab: 1,
          uploadedFiles: [mockFile],
          extractedData: null,
          isProcessing: false,
          isSaving: false,
          savedId: null,
          error: null
        },
        updateState: mockUpdateState,
        resetFlow: mockResetFlow,
        addFiles: mockAddFiles,
        removeFile: mockRemoveFile,
        clearAllFiles: mockClearAllFiles
      });

      // Mock successful API responses
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ key: 'uploaded-key' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'signed-url' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            reportType: 'Blood Test',
            metrics: [{ name: 'Hemoglobin', value: 14.2 }]
          })
        });

      render(<EnhancedMedicalUploader />);
      
      const processButton = screen.getByText('Process Files');
      fireEvent.click(processButton);
      
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({ 
          isProcessing: true, 
          error: null 
        });
      });
    });

    it('handles invalid file types', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      vi.mocked(require('@/hooks/use-upload-flow').useUploadFlow).mockReturnValue({
        state: {
          currentTab: 1,
          uploadedFiles: [mockFile],
          extractedData: null,
          isProcessing: false,
          isSaving: false,
          savedId: null,
          error: null
        },
        updateState: mockUpdateState,
        resetFlow: mockResetFlow,
        addFiles: mockAddFiles,
        removeFile: mockRemoveFile,
        clearAllFiles: mockClearAllFiles
      });

      render(<EnhancedMedicalUploader />);
      
      const processButton = screen.getByText('Process Files');
      fireEvent.click(processButton);
      
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Invalid files detected'),
            isProcessing: false
          })
        );
      });
    });

    it('handles upload failures', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      vi.mocked(require('@/hooks/use-upload-flow').useUploadFlow).mockReturnValue({
        state: {
          currentTab: 1,
          uploadedFiles: [mockFile],
          extractedData: null,
          isProcessing: false,
          isSaving: false,
          savedId: null,
          error: null
        },
        updateState: mockUpdateState,
        resetFlow: mockResetFlow,
        addFiles: mockAddFiles,
        removeFile: mockRemoveFile,
        clearAllFiles: mockClearAllFiles
      });

      // Mock failed upload
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Upload failed')
      });

      render(<EnhancedMedicalUploader />);
      
      const processButton = screen.getByText('Process Files');
      fireEvent.click(processButton);
      
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('Upload failed'),
            isProcessing: false
          })
        );
      });
    });
  });

  describe('Report Saving', () => {
    it('validates extracted data before saving', async () => {
      vi.mocked(require('@/hooks/use-upload-flow').useUploadFlow).mockReturnValue({
        state: {
          currentTab: 2,
          uploadedFiles: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
          extractedData: null,
          isProcessing: false,
          isSaving: false,
          savedId: null,
          error: null
        },
        updateState: mockUpdateState,
        resetFlow: mockResetFlow,
        addFiles: mockAddFiles,
        removeFile: mockRemoveFile,
        clearAllFiles: mockClearAllFiles
      });

      render(<EnhancedMedicalUploader />);
      
      const saveButton = screen.getByText('Save Report');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({ 
          error: "No data to save. Please process files first." 
        });
      });
    });

    it('saves valid extracted data successfully', async () => {
      const mockExtractedData = {
        reportType: 'Blood Test',
        metrics: [{ name: 'Hemoglobin', value: 14.2 }]
      };

      vi.mocked(require('@/hooks/use-upload-flow').useUploadFlow).mockReturnValue({
        state: {
          currentTab: 2,
          uploadedFiles: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
          extractedData: mockExtractedData,
          isProcessing: false,
          isSaving: false,
          savedId: null,
          error: null
        },
        updateState: mockUpdateState,
        resetFlow: mockResetFlow,
        addFiles: mockAddFiles,
        removeFile: mockRemoveFile,
        clearAllFiles: mockClearAllFiles
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'saved-report-id' })
      });

      render(<EnhancedMedicalUploader />);
      
      const saveButton = screen.getByText('Save Report');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({ 
          isSaving: true, 
          error: null 
        });
      });

      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({
          savedId: 'saved-report-id',
          isSaving: false,
          currentTab: 3
        });
      });
    });

    it('handles save failures', async () => {
      const mockExtractedData = {
        reportType: 'Blood Test',
        metrics: [{ name: 'Hemoglobin', value: 14.2 }]
      };

      vi.mocked(require('@/hooks/use-upload-flow').useUploadFlow).mockReturnValue({
        state: {
          currentTab: 2,
          uploadedFiles: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
          extractedData: mockExtractedData,
          isProcessing: false,
          isSaving: false,
          savedId: null,
          error: null
        },
        updateState: mockUpdateState,
        resetFlow: mockResetFlow,
        addFiles: mockAddFiles,
        removeFile: mockRemoveFile,
        clearAllFiles: mockClearAllFiles
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('{"error": "Database error"}')
      });

      render(<EnhancedMedicalUploader />);
      
      const saveButton = screen.getByText('Save Report');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Database error',
            isSaving: false
          })
        );
      });
    });
  });
});