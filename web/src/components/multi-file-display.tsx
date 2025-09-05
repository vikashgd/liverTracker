'use client';

import React, { useState, useEffect } from 'react';
import { FileImageDisplay, FilePdfDisplay, FileDownloadDisplay } from './file-display-components';
import { ImageGallery } from './image-gallery';

interface FileInfo {
  objectKey: string;
  fileName: string;
  contentType?: string;
}

interface MultiFileDisplayProps {
  reportId: string;
  files: FileInfo[];
}

export function MultiFileDisplay({ reportId, files }: MultiFileDisplayProps) {
  const [fileTypes, setFileTypes] = useState<{
    images: FileInfo[];
    pdfs: FileInfo[];
    others: FileInfo[];
  }>({
    images: [],
    pdfs: [],
    others: []
  });

  useEffect(() => {
    // Categorize files by type
    const categorized = files.reduce((acc, file) => {
      const fileName = file.fileName || file.objectKey.split('/').pop() || 'unknown';
      
      if (file.contentType?.includes('image/') || fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
        acc.images.push({ ...file, fileName });
      } else if (file.contentType?.includes('pdf') || fileName.match(/\.pdf$/i)) {
        acc.pdfs.push({ ...file, fileName });
      } else {
        acc.others.push({ ...file, fileName });
      }
      
      return acc;
    }, { images: [] as FileInfo[], pdfs: [] as FileInfo[], others: [] as FileInfo[] });

    setFileTypes(categorized);
  }, [files]);

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">📁</div>
        <p className="text-gray-600">No files available</p>
      </div>
    );
  }

  // Single file - use existing components
  if (files.length === 1) {
    const file = files[0];
    const fileName = file.fileName || file.objectKey.split('/').pop() || 'unknown';
    
    if (fileTypes.images.length === 1) {
      return <FileImageDisplay objectKey={file.objectKey} fileName={fileName} contentType={file.contentType} />;
    } else if (fileTypes.pdfs.length === 1) {
      return <FilePdfDisplay objectKey={file.objectKey} fileName={fileName} contentType={file.contentType} />;
    } else {
      return <FileDownloadDisplay objectKey={file.objectKey} fileName={fileName} contentType={file.contentType} />;
    }
  }

  // Multiple files - clean display
  return (
    <div className="space-y-6">
      {/* Images Section - Simplified */}
      {fileTypes.images.length > 0 && (
        <ImageGallery images={fileTypes.images} reportId={reportId} />
      )}

      {/* PDFs Section - Simplified */}
      {fileTypes.pdfs.length > 0 && (
        <div className="space-y-3">
          {fileTypes.pdfs.length > 1 && (
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              📄 PDF Documents ({fileTypes.pdfs.length})
            </h3>
          )}
          {fileTypes.pdfs.map((pdf, index) => (
            <FilePdfDisplay 
              key={index}
              objectKey={pdf.objectKey} 
              fileName={pdf.fileName} 
              contentType={pdf.contentType} 
            />
          ))}
        </div>
      )}

      {/* Other Files Section - Simplified */}
      {fileTypes.others.length > 0 && (
        <div className="space-y-3">
          {fileTypes.others.length > 1 && (
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              📎 Other Files ({fileTypes.others.length})
            </h3>
          )}
          {fileTypes.others.map((file, index) => (
            <FileDownloadDisplay 
              key={index}
              objectKey={file.objectKey} 
              fileName={file.fileName} 
              contentType={file.contentType} 
            />
          ))}
        </div>
      )}


    </div>
  );
}