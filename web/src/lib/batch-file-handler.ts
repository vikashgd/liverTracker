/**
 * Batch File Handler
 * 
 * Utilities for handling batch uploads and multiple files
 */

export interface FileInfo {
  objectKey: string;
  fileName: string;
  contentType?: string;
}

export interface BatchFileInfo {
  isBatch: boolean;
  files: FileInfo[];
  batchType?: 'images' | 'mixed' | 'unknown';
}

/**
 * Detect if a file is a batch upload based on naming patterns and content type
 */
export function detectBatchFile(objectKey: string, contentType?: string): boolean {
  const fileName = objectKey.split('/').pop() || '';
  
  // Check for batch indicators
  const batchIndicators = [
    'batch',
    'multiple',
    'gallery',
    'collection',
    'set',
    'group'
  ];
  
  const hasBatchName = batchIndicators.some(indicator => 
    fileName.toLowerCase().includes(indicator)
  );
  
  const hasBatchContentType = contentType === 'image/batch' || 
                             contentType === 'application/batch' ||
                             contentType?.includes('batch');
  
  return hasBatchName || hasBatchContentType;
}

/**
 * Parse batch file information
 */
export function parseBatchFile(objectKey: string, contentType?: string): BatchFileInfo {
  const isBatch = detectBatchFile(objectKey, contentType);
  
  if (!isBatch) {
    return {
      isBatch: false,
      files: [{
        objectKey,
        fileName: objectKey.split('/').pop() || 'Unknown file',
        contentType
      }]
    };
  }
  
  // For now, treat batch as single file until we implement proper batch parsing
  // In the future, this could parse ZIP files or handle multiple object keys
  return {
    isBatch: true,
    files: [{
      objectKey,
      fileName: objectKey.split('/').pop() || 'Batch file',
      contentType
    }],
    batchType: contentType?.includes('image') ? 'images' : 'unknown'
  };
}

/**
 * Generate multiple file info from a report that might have multiple files
 * This is a placeholder for future enhancement where reports can have multiple objectKeys
 */
export function getReportFiles(report: {
  objectKey: string | null;
  contentType?: string | null;
  // Future: objectKeys?: string[];
}): FileInfo[] {
  if (!report.objectKey) {
    return [];
  }
  
  // For now, handle single file
  // In the future, this could handle multiple objectKeys from the database
  return [{
    objectKey: report.objectKey,
    fileName: report.objectKey.split('/').pop() || 'Unknown file',
    contentType: report.contentType || undefined
  }];
}

/**
 * Check if multiple files should be displayed as a gallery
 */
export function shouldUseGallery(files: FileInfo[]): boolean {
  if (files.length <= 1) return false;
  
  // Use gallery if we have multiple images
  const imageCount = files.filter(file => 
    file.contentType?.includes('image/') || 
    file.fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
  ).length;
  
  return imageCount >= 2;
}

/**
 * Get file type statistics
 */
export function getFileTypeStats(files: FileInfo[]) {
  const stats = {
    images: 0,
    pdfs: 0,
    others: 0,
    total: files.length
  };
  
  files.forEach(file => {
    const fileName = file.fileName.toLowerCase();
    
    if (file.contentType?.includes('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
      stats.images++;
    } else if (file.contentType?.includes('pdf') || fileName.match(/\.pdf$/)) {
      stats.pdfs++;
    } else {
      stats.others++;
    }
  });
  
  return stats;
}