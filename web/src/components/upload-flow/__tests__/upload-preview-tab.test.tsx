import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UploadPreviewTab } from '../upload-preview-tab';
import { UploadFlowState } from '@/lib/upload-flow-state';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('UploadPreviewTab', () => {
  const mockProps = {
    flowState: {
      currentTab: 1,
      uploadedFiles: [],
      extractedData: null,
      isProcessing: false,
      isSaving: false,
      savedId: null,
      error: null
    } as UploadFlowState,
    onFilesSelected: vi.fn(),
    onFileRemoved: vi.fn(),
    onUploadAndExtract: vi.fn(),
    onClearAll: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('renders upload options correctly', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      expect(screen.getByText('Upload Medical Report')).toBeInTheDocument();
      expect(screen.getByText('Choose Files')).toBeInTheDocument();
      expect(screen.getByText('Take Photos')).toBeInTheDocument();
      expect(screen.getByText('Upload PDF or images from storage')).toBeInTheDocument();
    });

    it('shows correct camera option text when no files selected', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      expect(screen.getByText('Capture photos with camera')).toBeInTheDocument();
    });

    it('does not show Upload & Extract button when no files selected', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      expect(screen.queryByText('Upload & Extract')).not.toBeInTheDocument();
    });

    it('shows supported formats information', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      expect(screen.getByText('Supported Formats:')).toBeInTheDocument();
      expect(screen.getByText('• PDF files (multi-page reports)')).toBeInTheDocument();
      expect(screen.getByText('• Images: JPG, PNG, HEIC')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('calls onFilesSelected when files are selected via file input', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(mockProps.onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('calls onFilesSelected when files are selected via camera input', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      const cameraInput = screen.getByLabelText(/take photos/i);
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(cameraInput, { target: { files: [file] } });
      
      expect(mockProps.onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('handles multiple file selection', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const files = [
        new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ];
      
      fireEvent.change(fileInput, { target: { files } });
      
      expect(mockProps.onFilesSelected).toHaveBeenCalledWith(files);
    });
  });

  describe('File Preview Display', () => {
    const mockFlowStateWithFiles = {
      ...mockProps.flowState,
      uploadedFiles: [
        new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ]
    };

    it('shows file preview section when files are selected', () => {
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('displays file previews correctly', () => {
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      expect(screen.getAllByText('test1.pdf')).toHaveLength(2); // Appears in PDF preview and file info
      expect(screen.getByText('test2.jpg')).toBeInTheDocument(); // Appears in file info only (image shows preview)
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('IMG')).toBeInTheDocument();
    });

    it('shows file size information', () => {
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      expect(screen.getByText(/Total size:/)).toBeInTheDocument();
    });

    it('shows Upload & Extract button when files are selected', () => {
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      expect(screen.getByText('Upload & Extract')).toBeInTheDocument();
    });

    it('updates camera option text when files are present', () => {
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      expect(screen.getByText('Add more photos')).toBeInTheDocument();
    });
  });

  describe('File Management', () => {
    const mockFlowStateWithFiles = {
      ...mockProps.flowState,
      uploadedFiles: [
        new File(['test1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
      ]
    };

    it('calls onFileRemoved when delete button is clicked', () => {
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      const deleteButtons = screen.getAllByTitle(/remove this file/i);
      fireEvent.click(deleteButtons[0]);
      
      expect(mockProps.onFileRemoved).toHaveBeenCalledWith(0);
    });

    it('calls onClearAll when Clear All button is clicked', () => {
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      const clearAllButton = screen.getByText('Clear All');
      fireEvent.click(clearAllButton);
      
      expect(mockProps.onClearAll).toHaveBeenCalled();
    });

    it('adds more files when camera input is used with existing files', () => {
      const propsWithFiles = {
        ...mockProps,
        flowState: mockFlowStateWithFiles
      };
      
      render(<UploadPreviewTab {...propsWithFiles} />);
      
      const cameraInput = screen.getByLabelText(/take photos/i);
      const newFile = new File(['test3'], 'test3.jpg', { type: 'image/jpeg' });
      
      fireEvent.change(cameraInput, { target: { files: [newFile] } });
      
      expect(mockProps.onFilesSelected).toHaveBeenCalledWith([
        ...mockFlowStateWithFiles.uploadedFiles,
        newFile
      ]);
    });
  });

  describe('Navigation', () => {
    const mockFlowStateWithFiles = {
      ...mockProps.flowState,
      uploadedFiles: [new File(['test'], 'test.pdf', { type: 'application/pdf' })]
    };

    it('calls onUploadAndExtract when Upload & Extract button is clicked', () => {
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      const uploadExtractButton = screen.getByText('Upload & Extract');
      fireEvent.click(uploadExtractButton);
      
      expect(mockProps.onUploadAndExtract).toHaveBeenCalled();
    });

    it('does not show Upload & Extract button when no files are selected', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      // Upload & Extract button should not be present when no files
      expect(screen.queryByText('Upload & Extract')).not.toBeInTheDocument();
    });

    it('shows loading state when processing', () => {
      const mockFlowStateProcessing = {
        ...mockFlowStateWithFiles,
        isProcessing: true
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateProcessing} />);
      
      expect(screen.getByText('Extracting...')).toBeInTheDocument();
      const uploadButton = screen.getByLabelText('Upload files and extract medical data');
      expect(uploadButton).toBeDisabled();
    });

    it('disables Upload & Extract button when processing', () => {
      const mockFlowStateProcessing = {
        ...mockFlowStateWithFiles,
        isProcessing: true
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateProcessing} />);
      
      const button = screen.getByLabelText('Upload files and extract medical data');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-label', 'Upload files and extract medical data');
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error is present', () => {
      const mockFlowStateWithError = {
        ...mockProps.flowState,
        error: 'Upload failed. Please try again.'
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithError} />);
      
      expect(screen.getByText('Upload failed. Please try again.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('does not display error section when no error', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for file inputs', () => {
      render(<UploadPreviewTab {...mockProps} />);
      
      const fileInput = screen.getByLabelText(/choose files/i);
      const cameraInput = screen.getByLabelText(/take photos/i);
      
      expect(fileInput).toHaveAttribute('aria-describedby', 'file-help');
      expect(cameraInput).toHaveAttribute('aria-describedby', 'camera-help');
    });

    it('has proper ARIA labels for delete buttons', () => {
      const mockFlowStateWithFiles = {
        ...mockProps.flowState,
        uploadedFiles: [new File(['test'], 'test.pdf', { type: 'application/pdf' })]
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      const deleteButton = screen.getByLabelText('Remove test.pdf');
      expect(deleteButton).toBeInTheDocument();
    });

    it('has proper role and aria-live for error messages', () => {
      const mockFlowStateWithError = {
        ...mockProps.flowState,
        error: 'Test error'
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithError} />);
      
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('File Type Handling', () => {
    it('displays PDF icon for PDF files', () => {
      const mockFlowStateWithPdf = {
        ...mockProps.flowState,
        uploadedFiles: [new File(['test'], 'test.pdf', { type: 'application/pdf' })]
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithPdf} />);
      
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    it('displays image preview for image files', () => {
      const mockFlowStateWithImage = {
        ...mockProps.flowState,
        uploadedFiles: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithImage} />);
      
      expect(screen.getByText('IMG')).toBeInTheDocument();
      expect(screen.getByAltText('Preview 1')).toBeInTheDocument();
    });

    it('handles image load errors gracefully', () => {
      const mockFlowStateWithImage = {
        ...mockProps.flowState,
        uploadedFiles: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })]
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithImage} />);
      
      const image = screen.getByAltText('Preview 1');
      fireEvent.error(image);
      
      // Image should be hidden on error
      expect(image).toHaveStyle('display: none');
    });
  });

  describe('File Size Display', () => {
    it('displays individual file sizes', () => {
      const mockFile = new File(['x'.repeat(1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
      const mockFlowStateWithFiles = {
        ...mockProps.flowState,
        uploadedFiles: [mockFile]
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    });

    it('calculates total size correctly', () => {
      const mockFiles = [
        new File(['x'.repeat(1024 * 1024)], 'test1.pdf', { type: 'application/pdf' }),
        new File(['x'.repeat(2 * 1024 * 1024)], 'test2.pdf', { type: 'application/pdf' })
      ];
      const mockFlowStateWithFiles = {
        ...mockProps.flowState,
        uploadedFiles: mockFiles
      };
      
      render(<UploadPreviewTab {...mockProps} flowState={mockFlowStateWithFiles} />);
      
      expect(screen.getByText('Total size: 3.0 MB')).toBeInTheDocument();
    });
  });
});