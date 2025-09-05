'use client';

import React, { useState, useEffect } from 'react';

interface ImageGalleryProps {
  images: Array<{
    objectKey: string;
    fileName: string;
    contentType?: string;
  }>;
  reportId: string;
}

interface ImageGalleryState {
  currentIndex: number;
  showLightbox: boolean;
  loadedImages: Set<number>;
  failedImages: Set<number>;
}

export function ImageGallery({ images, reportId }: ImageGalleryProps) {
  const [state, setState] = useState<ImageGalleryState>({
    currentIndex: 0,
    showLightbox: false,
    loadedImages: new Set(),
    failedImages: new Set(),
  });

  const getImageUrl = (objectKey: string) => `/api/files/${encodeURIComponent(objectKey)}`;

  const handleImageLoad = (index: number) => {
    setState(prev => ({
      ...prev,
      loadedImages: new Set([...prev.loadedImages, index])
    }));
  };

  const handleImageError = (index: number) => {
    setState(prev => ({
      ...prev,
      failedImages: new Set([...prev.failedImages, index])
    }));
  };

  const openLightbox = (index: number) => {
    setState(prev => ({
      ...prev,
      currentIndex: index,
      showLightbox: true
    }));
  };

  const closeLightbox = () => {
    setState(prev => ({
      ...prev,
      showLightbox: false
    }));
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    setState(prev => {
      const newIndex = direction === 'next' 
        ? (prev.currentIndex + 1) % images.length
        : (prev.currentIndex - 1 + images.length) % images.length;
      
      return {
        ...prev,
        currentIndex: newIndex
      };
    });
  };

  const downloadAllImages = async () => {
    // For now, download images individually
    // In the future, could implement ZIP download
    images.forEach((image, index) => {
      const link = document.createElement('a');
      link.href = getImageUrl(image.objectKey);
      link.download = image.fileName || `image-${index + 1}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!state.showLightbox) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          navigateImage('prev');
          break;
        case 'ArrowRight':
          navigateImage('next');
          break;
        case 'Escape':
          closeLightbox();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.showLightbox]);

  if (images.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">🖼️</div>
        <p className="text-gray-600">No images available</p>
      </div>
    );
  }

  // Single image - use existing simple display
  if (images.length === 1) {
    const image = images[0];
    const imageUrl = getImageUrl(image.objectKey);
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🖼️</span>
            <span className="font-medium text-gray-900">{image.fileName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => openLightbox(0)}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              🔍 Zoom
            </button>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = image.fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
            >
              📥 Download
            </button>
          </div>
        </div>
        
        <div className="relative bg-gray-50 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={image.fileName}
            className="w-full h-auto max-h-96 object-contain cursor-pointer"
            onClick={() => openLightbox(0)}
            onLoad={() => handleImageLoad(0)}
            onError={() => handleImageError(0)}
          />
          
          {state.failedImages.has(0) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="text-4xl mb-2">🖼️</div>
                <p className="text-gray-600 font-medium">{image.fileName}</p>
                <p className="text-sm text-gray-500 mt-1">Image could not be loaded</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Multiple images - clean gallery view
  return (
    <div className="space-y-4">
      {/* Clean Gallery Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800 flex items-center space-x-2">
          <span>🖼️</span>
          <span>Medical Images ({images.length})</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openLightbox(0)}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
          >
            <span>🔍</span>
            <span>View Gallery</span>
          </button>
          <button
            onClick={downloadAllImages}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
          >
            <span>📥</span>
            <span>Download All {images.length} Files</span>
          </button>
        </div>
      </div>

      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => {
          const imageUrl = getImageUrl(image.objectKey);
          const isLoaded = state.loadedImages.has(index);
          const hasFailed = state.failedImages.has(index);
          
          return (
            <div
              key={index}
              className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openLightbox(index)}
            >
              {!hasFailed ? (
                <>
                  <img
                    src={imageUrl}
                    alt={image.fileName}
                    className="w-full h-full object-cover"
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                  />
                  
                  {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                  <div className="text-2xl mb-1">🖼️</div>
                  <p className="text-xs text-gray-600 text-center px-2 truncate w-full">
                    {image.fileName}
                  </p>
                  <p className="text-xs text-gray-500">Failed to load</p>
                </div>
              )}
              
              {/* Image number overlay */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {state.showLightbox && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <div className="relative w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🖼️</div>
                <div>
                  <h3 className="font-semibold text-white">
                    {images[state.currentIndex].fileName}
                  </h3>
                  <p className="text-sm text-gray-300">
                    Image {state.currentIndex + 1} of {images.length}
                  </p>
                </div>
              </div>
              <button
                onClick={closeLightbox}
                className="p-2 text-white hover:text-gray-300 text-xl"
              >
                ✕
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative max-w-full max-h-full">
                <img
                  src={getImageUrl(images[state.currentIndex].objectKey)}
                  alt={images[state.currentIndex].fileName}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateImage('prev')}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => navigateImage('next')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70 transition-opacity"
                    >
                      →
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
              <div className="flex items-center space-x-4 text-sm text-white">
                <span>🖼️ {images[state.currentIndex].fileName}</span>
                <span>•</span>
                <span>{state.currentIndex + 1} of {images.length}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = getImageUrl(images[state.currentIndex].objectKey);
                    link.download = images[state.currentIndex].fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  📥 Download
                </button>
                <button
                  onClick={closeLightbox}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}