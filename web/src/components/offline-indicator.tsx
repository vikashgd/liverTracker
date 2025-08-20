'use client';

import React, { useState, useEffect } from 'react';
import { useOfflineStorage } from '@/lib/offline-storage';
import { useSyncManager } from '@/lib/sync-manager';

export function OfflineIndicator() {
  const { storage, isInitialized, storageStats, updateStats } = useOfflineStorage();
  const { syncStatus, syncStats, forceSync, resolveConflicts } = useSyncManager();
  const [showDetails, setShowDetails] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      if (syncStats?.lastSyncTime) {
        const time = new Date(syncStats.lastSyncTime);
        setLastUpdate(time.toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [syncStats?.lastSyncTime]);

  if (!isInitialized) {
    return (
      <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
        <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2">
          <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          <span>Initializing offline storage...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) return '🔴';
    if (syncStatus.syncInProgress) return '🔄';
    if (syncStats?.pendingSync > 0) return '⏳';
    if (syncStats?.conflicted > 0) return '⚠️';
    return '🟢';
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline Mode';
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (syncStats?.pendingSync > 0) return `${syncStats.pendingSync} Pending`;
    if (syncStats?.conflicted > 0) return `${syncStats.conflicted} Conflicts`;
    return 'Online & Synced';
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'bg-red-50 border-red-200 text-red-700';
    if (syncStatus.syncInProgress) return 'bg-blue-50 border-blue-200 text-blue-700';
    if (syncStats?.pendingSync > 0) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    if (syncStats?.conflicted > 0) return 'bg-orange-50 border-orange-200 text-orange-700';
    return 'bg-green-50 border-green-200 text-green-700';
  };

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50">
      {/* Main Status Indicator */}
      <div 
        className={`
          ${getStatusColor()}
          border px-3 py-2 rounded-lg shadow-lg text-sm cursor-pointer
          transition-all duration-200 hover:shadow-xl
          flex items-center space-x-2 max-w-xs
        `}
        onClick={() => setShowDetails(!showDetails)}
      >
        <span className="text-base">{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
        {syncStatus.syncInProgress && (
          <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full"></div>
        )}
      </div>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 w-80 max-w-sm">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Offline Storage Status</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Connection Status */}
            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <span>{syncStatus.isOnline ? '🌐' : '📴'}</span>
                <span className="font-medium">
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {syncStats?.lastSyncTime && (
                <p className="text-xs text-gray-500">
                  Last sync: {lastUpdate}
                </p>
              )}
            </div>

            {/* Storage Statistics */}
            {storageStats && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Storage Usage</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Records:</span>
                    <span className="font-medium ml-1">{storageStats.records}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cache:</span>
                    <span className="font-medium ml-1">{storageStats.cachedResponses}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Queue:</span>
                    <span className="font-medium ml-1">{storageStats.syncQueue}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium ml-1">{storageStats.totalSize}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Statistics */}
            {syncStats && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Sync Status</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Synced:</span>
                    <span className="font-medium text-green-600">{syncStats.synced}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium text-yellow-600">{syncStats.pendingSync}</span>
                  </div>
                  {syncStats.conflicted > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conflicts:</span>
                      <span className="font-medium text-red-600">{syncStats.conflicted}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  await forceSync();
                  await updateStats();
                }}
                disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
                className="flex-1 py-2 px-3 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {syncStatus.syncInProgress ? 'Syncing...' : 'Force Sync'}
              </button>
              
              {syncStats?.conflicted > 0 && (
                <button
                  onClick={resolveConflicts}
                  className="flex-1 py-2 px-3 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Resolve Conflicts
                </button>
              )}
            </div>

            {/* Offline Features Notice */}
            {!syncStatus.isOnline && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <p className="text-red-700 font-medium mb-1">Offline Mode Active</p>
                <p className="text-red-600">
                  Your data is being saved locally and will sync when connection is restored.
                </p>
              </div>
            )}

            {/* Tips */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <p className="text-gray-600">
                💡 <strong>Tip:</strong> Your medical data is automatically saved offline and syncs in the background.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mini offline indicator for header
export function OfflineStatusBadge() {
  const { syncStatus } = useSyncManager();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return <div className="w-0 h-0"></div>; // Invisible placeholder to maintain layout
  }
  
  if (syncStatus.isOnline && !syncStatus.syncInProgress) {
    return null; // Hide when online and not syncing
  }

  return (
    <div className="flex items-center space-x-1 text-xs">
      {!syncStatus.isOnline && (
        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full">
          🔴 Offline
        </span>
      )}
      
      {syncStatus.syncInProgress && (
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center space-x-1">
          <div className="animate-spin w-3 h-3 border border-blue-700 border-t-transparent rounded-full"></div>
          <span>Syncing</span>
        </span>
      )}
    </div>
  );
}
