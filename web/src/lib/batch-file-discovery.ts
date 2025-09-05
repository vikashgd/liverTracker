/**
 * Utility to discover all files related to a batch upload
 */

interface BatchFileInfo {
  objectKey: string;
  fileName: string;
  contentType?: string;
}

/**
 * Discovers all files related to a batch upload based on the primary objectKey
 * For example, if primary key is "reports/123-batch-0-456-file1.jpg"
 * it will find "reports/123-batch-1-456-file2.jpg", etc.
 */
export async function discoverBatchFiles(primaryObjectKey: string): Promise<BatchFileInfo[]> {
  try {
    // Extract timestamp from the primary key
    const keyParts = primaryObjectKey.split('/');
    const fileName = keyParts[keyParts.length - 1];
    
    // Extract timestamp (first part before any dash)
    const timestampMatch = fileName.match(/^(\d+)/);
    if (!timestampMatch) {
      // Not a batch file, return just the primary file
      return [{
        objectKey: primaryObjectKey,
        fileName: fileName,
        contentType: 'image/jpeg' // Default assumption
      }];
    }
    
    const timestamp = timestampMatch[1];
    
    // Call API to discover related files
    const response = await fetch(`/api/files/discover-batch?timestamp=${timestamp}&primaryKey=${encodeURIComponent(primaryObjectKey)}`);
    
    if (!response.ok) {
      console.warn('Failed to discover batch files, falling back to single file');
      return [{
        objectKey: primaryObjectKey,
        fileName: fileName,
        contentType: 'image/jpeg'
      }];
    }
    
    const batchFiles = await response.json();
    return batchFiles;
    
  } catch (error) {
    console.error('Error discovering batch files:', error);
    // Fallback to single file
    const fileName = primaryObjectKey.split('/').pop() || 'unknown';
    return [{
      objectKey: primaryObjectKey,
      fileName: fileName,
      contentType: 'image/jpeg'
    }];
  }
}

/**
 * Checks if an objectKey represents a batch upload
 */
export function isBatchUpload(objectKey: string, contentType?: string): boolean {
  const fileName = objectKey.split('/').pop() || '';
  return contentType === 'image/batch' || fileName.includes('batch-');
}