/**
 * Tests for upload flow hooks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUploadFlow, useTabNavigation } from '../use-upload-flow';
import { ExtractionResult } from '@/lib/upload-flow-state';

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('useUploadFlow', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    expect(result.current.state.currentTab).toBe(1);
    expect(result.current.state.uploadedFiles).toEqual([]);
    expect(result.current.state.isProcessing).toBe(false);
    expect(result.current.state.isSaving).toBe(false);
    expect(result.current.state.savedId).toBeNull();
  });

  it('should handle file selection', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    const testFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.setFiles([testFile]);
    });
    
    expect(result.current.state.uploadedFiles).toEqual([testFile]);
    expect(result.current.state.filePreviewUrls).toEqual(['mock-url']);
  });

  it('should handle adding more files', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.setFiles([file1]);
    });
    
    act(() => {
      result.current.addFiles([file2]);
    });
    
    expect(result.current.state.uploadedFiles).toHaveLength(2);
    expect(result.current.state.uploadedFiles[0]).toBe(file1);
    expect(result.current.state.uploadedFiles[1]).toBe(file2);
  });

  it('should handle file removal', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.setFiles([file1, file2]);
    });
    
    act(() => {
      result.current.removeFile(0);
    });
    
    expect(result.current.state.uploadedFiles).toHaveLength(1);
    expect(result.current.state.uploadedFiles[0]).toBe(file2);
  });

  it('should handle tab navigation', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    act(() => {
      result.current.navigateToTab(2);
    });
    
    expect(result.current.state.currentTab).toBe(2);
    
    act(() => {
      result.current.goToPreviousTab();
    });
    
    expect(result.current.state.currentTab).toBe(1);
    
    act(() => {
      result.current.goToNextTab();
    });
    
    expect(result.current.state.currentTab).toBe(2);
  });

  it('should handle processing flow', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    act(() => {
      result.current.startProcessing();
    });
    
    expect(result.current.state.isProcessing).toBe(true);
    expect(result.current.state.showProcessingOverlay).toBe(true);
    
    act(() => {
      result.current.setProcessingProgress(50);
    });
    
    expect(result.current.state.processingProgress).toBe(50);
    
    const mockResult: ExtractionResult = {
      reportType: 'Blood Test',
      reportDate: '2024-01-01',
      metricsAll: []
    };
    
    act(() => {
      result.current.completeProcessing(mockResult);
    });
    
    expect(result.current.state.isProcessing).toBe(false);
    expect(result.current.state.extractedData).toBe(mockResult);
    expect(result.current.state.editedData).toBe(mockResult);
    expect(result.current.state.currentTab).toBe(2); // Auto-advance enabled
  });

  it('should handle saving flow', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    act(() => {
      result.current.startSaving();
    });
    
    expect(result.current.state.isSaving).toBe(true);
    
    act(() => {
      result.current.completeSaving('test-id');
    });
    
    expect(result.current.state.isSaving).toBe(false);
    expect(result.current.state.savedId).toBe('test-id');
    expect(result.current.state.currentTab).toBe(3); // Auto-advance enabled
  });

  it('should handle errors', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    act(() => {
      result.current.startProcessing();
    });
    
    act(() => {
      result.current.setError('Processing failed');
    });
    
    expect(result.current.state.error).toBe('Processing failed');
    expect(result.current.state.isProcessing).toBe(false);
    expect(result.current.state.showProcessingOverlay).toBe(false);
  });

  it('should handle flow reset', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    const testFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.setFiles([testFile]);
      result.current.navigateToTab(2);
      result.current.setError('Some error');
    });
    
    act(() => {
      result.current.resetFlow();
    });
    
    expect(result.current.state.currentTab).toBe(1);
    expect(result.current.state.uploadedFiles).toEqual([]);
    expect(result.current.state.error).toBeNull();
  });

  it('should handle data editing', () => {
    const { result } = renderHook(() => useUploadFlow());
    
    const originalData: ExtractionResult = {
      reportType: 'Blood Test',
      reportDate: '2024-01-01',
      metricsAll: []
    };
    
    const editedData: ExtractionResult = {
      reportType: 'Updated Blood Test',
      reportDate: '2024-01-02',
      metricsAll: []
    };
    
    act(() => {
      result.current.completeProcessing(originalData);
    });
    
    act(() => {
      result.current.setEditedData(editedData);
    });
    
    expect(result.current.state.extractedData).toBe(originalData);
    expect(result.current.state.editedData).toBe(editedData);
  });
});

describe('useTabNavigation', () => {
  it('should validate tab navigation correctly', () => {
    const { result } = renderHook(() => {
      const flow = useUploadFlow();
      const navigation = useTabNavigation(flow.state);
      return { flow, navigation };
    });
    
    // Initially can only go to tab 1
    expect(result.current.navigation.canNavigateToTab(1)).toBe(true);
    expect(result.current.navigation.canNavigateToTab(2)).toBe(false);
    expect(result.current.navigation.canNavigateToTab(3)).toBe(false);
    
    // After adding files, can go to tab 2
    const testFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    act(() => {
      result.current.flow.setFiles([testFile]);
    });
    
    expect(result.current.navigation.canNavigateToTab(2)).toBe(true);
    expect(result.current.navigation.canNavigateToTab(3)).toBe(false);
    
    // After saving, can go to tab 3
    act(() => {
      result.current.flow.completeSaving('test-id');
    });
    
    expect(result.current.navigation.canNavigateToTab(3)).toBe(true);
  });

  it('should determine tab completion status', () => {
    const { result } = renderHook(() => {
      const flow = useUploadFlow();
      const navigation = useTabNavigation(flow.state);
      return { flow, navigation };
    });
    
    // Initially no tabs are completed
    expect(result.current.navigation.isTabCompleted(1)).toBe(false);
    expect(result.current.navigation.isTabCompleted(2)).toBe(false);
    expect(result.current.navigation.isTabCompleted(3)).toBe(false);
    
    // After adding files, tab 1 is completed
    const testFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    act(() => {
      result.current.flow.setFiles([testFile]);
    });
    
    expect(result.current.navigation.isTabCompleted(1)).toBe(true);
    expect(result.current.navigation.isTabCompleted(2)).toBe(false);
    
    // After saving, tabs 2 and 3 are completed
    act(() => {
      result.current.flow.completeSaving('test-id');
    });
    
    expect(result.current.navigation.isTabCompleted(2)).toBe(true);
    expect(result.current.navigation.isTabCompleted(3)).toBe(true);
  });

  it('should create tab transitions correctly', () => {
    const { result } = renderHook(() => {
      const flow = useUploadFlow();
      const navigation = useTabNavigation(flow.state);
      return { flow, navigation };
    });
    
    const forwardTransition = result.current.navigation.getTabTransition(1, 2);
    expect(forwardTransition.from).toBe(1);
    expect(forwardTransition.to).toBe(2);
    expect(forwardTransition.direction).toBe('forward');
    
    const backwardTransition = result.current.navigation.getTabTransition(3, 1);
    expect(backwardTransition.from).toBe(3);
    expect(backwardTransition.to).toBe(1);
    expect(backwardTransition.direction).toBe('backward');
  });
});