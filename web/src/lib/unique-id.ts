/**
 * Generates a unique ID that's safe for both server and client rendering
 */
export function generateUniqueId(prefix: string = 'id'): string {
  // Use a combination of timestamp and random number for uniqueness
  // This approach is safe for both SSR and client-side rendering
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generates a unique key for file uploads
 */
export function generateFileKey(filename: string, prefix: string = 'reports'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}/${timestamp}-${random}-${filename}`;
}

/**
 * Generates a batch key for multiple file uploads
 */
export function generateBatchKey(index: number, filename: string, prefix: string = 'reports'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}/${timestamp}-batch-${index}-${random}-${filename}`;
}

/**
 * Generates a temporary key for PDF page processing
 */
export function generateTempPageKey(pageNum: number): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `tmp/pages/${timestamp}-${random}-${pageNum}.png`;
}

/**
 * Gets file extension from filename
 */
function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? `.${ext}` : '.jpg'; // Default to .jpg if no extension
}

/**
 * Generates a report key based on uploaded files
 */
export function generateReportKey(uploadedFiles: Array<{ name?: string }>, isBatch: boolean = false): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  if (isBatch || uploadedFiles.length > 1) {
    // ✅ FIXED: Always include file extension for batch uploads
    const firstFile = uploadedFiles[0];
    const extension = firstFile?.name ? getFileExtension(firstFile.name) : '.jpg';
    return `reports/${timestamp}-${random}-batch-report${extension}`;
  } else {
    const filename = uploadedFiles[0]?.name ?? "report.pdf";
    return `reports/${timestamp}-${random}-${filename}`;
  }
}