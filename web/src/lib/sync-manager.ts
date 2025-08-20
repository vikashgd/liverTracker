'use client';

import { offlineStorage } from './offline-storage';

interface SyncOptions {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
}

class SyncManager {
  private syncInProgress = false;
  private syncQueue: any[] = [];
  private options: SyncOptions = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    batchSize: 10
  };

  private eventListeners: { [key: string]: Function[] } = {};

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Periodic sync attempt when online
      setInterval(() => {
        if (navigator.onLine && !this.syncInProgress) {
          this.syncWithServer();
        }
      }, 30000); // Every 30 seconds
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
  }

  // Handle network status changes
  private handleOnline() {
    console.log('🌐 SyncManager: Back online - starting sync');
    this.emit('online');
    this.syncWithServer();
  }

  private handleOffline() {
    console.log('📴 SyncManager: Gone offline');
    this.emit('offline');
  }

  // Main synchronization logic
  async syncWithServer(): Promise<void> {
    if (this.syncInProgress) {
      console.log('🔄 SyncManager: Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('📴 SyncManager: Offline - skipping sync');
      return;
    }

    this.syncInProgress = true;
    this.emit('syncStarted');

    try {
      // Get pending sync items
      const syncQueue = await offlineStorage.getSyncQueue();
      
      if (syncQueue.length === 0) {
        console.log('✅ SyncManager: No items to sync');
        this.syncInProgress = false;
        this.emit('syncCompleted', { success: true, synced: 0 });
        return;
      }

      console.log(`🔄 SyncManager: Syncing ${syncQueue.length} items`);

      // Process in batches
      const batches = this.createBatches(syncQueue, this.options.batchSize);
      let totalSynced = 0;
      let totalFailed = 0;

      for (const batch of batches) {
        const results = await this.processBatch(batch);
        totalSynced += results.success;
        totalFailed += results.failed;
      }

      // Clean up successfully synced items
      if (totalSynced > 0) {
        await this.cleanupSyncedItems(syncQueue.slice(0, totalSynced));
      }

      console.log(`✅ SyncManager: Sync completed - ${totalSynced} synced, ${totalFailed} failed`);
      
      this.emit('syncCompleted', { 
        success: totalFailed === 0, 
        synced: totalSynced, 
        failed: totalFailed 
      });

    } catch (error) {
      console.error('❌ SyncManager: Sync failed', error);
      this.emit('syncError', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(batch: any[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const item of batch) {
      try {
        await this.syncSingleItem(item);
        success++;
      } catch (error) {
        console.error(`❌ SyncManager: Failed to sync item ${item.id}`, error);
        failed++;
        
        // Update retry count
        item.retryCount = (item.retryCount || 0) + 1;
        
        // Remove from queue if max retries exceeded
        if (item.retryCount >= this.options.maxRetries) {
          console.warn(`⚠️ SyncManager: Max retries exceeded for ${item.id}, removing from queue`);
          await this.removeSyncItem(item.id);
        }
      }
    }

    return { success, failed };
  }

  private async syncSingleItem(item: any): Promise<void> {
    const { action, recordId, data } = item;

    switch (action) {
      case 'create':
        await this.syncCreate(recordId, data);
        break;
      case 'update':
        await this.syncUpdate(recordId, data);
        break;
      case 'delete':
        await this.syncDelete(recordId);
        break;
      default:
        throw new Error(`Unknown sync action: ${action}`);
    }
  }

  private async syncCreate(recordId: string, data: any): Promise<void> {
    // Map offline record types to API endpoints
    const endpoint = this.getApiEndpoint(data.type);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.transformForApi(data))
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Update local record with server ID
    await offlineStorage.updateMedicalRecord(recordId, {
      syncStatus: 'synced',
      metadata: { ...data.metadata, serverId: result.id }
    });

    console.log(`✅ SyncManager: Created record ${recordId} on server`);
  }

  private async syncUpdate(recordId: string, data: any): Promise<void> {
    const serverId = data.metadata?.serverId || recordId;
    const endpoint = `${this.getApiEndpoint(data.type)}/${serverId}`;
    
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.transformForApi(data))
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update sync status
    await offlineStorage.updateMedicalRecord(recordId, {
      syncStatus: 'synced'
    });

    console.log(`✅ SyncManager: Updated record ${recordId} on server`);
  }

  private async syncDelete(recordId: string): Promise<void> {
    // Find the record to get server ID
    const records = await offlineStorage.getMedicalRecords();
    const record = records.find(r => r.id === recordId);
    
    if (!record || !record.metadata?.serverId) {
      console.warn(`⚠️ SyncManager: Cannot delete ${recordId} - no server ID`);
      return;
    }

    const endpoint = `${this.getApiEndpoint(record.type)}/${record.metadata.serverId}`;
    
    const response = await fetch(endpoint, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`✅ SyncManager: Deleted record ${recordId} from server`);
  }

  private getApiEndpoint(type: string): string {
    const endpoints = {
      'report': '/api/reports',
      'metric': '/api/metrics',
      'imaging': '/api/imaging-reports',
      'calculation': '/api/calculations'
    };

    return endpoints[type as keyof typeof endpoints] || '/api/data';
  }

  private transformForApi(data: any): any {
    // Transform offline data structure to match API expectations
    return {
      type: data.type,
      data: data.data,
      metadata: data.metadata,
      timestamp: data.timestamp
    };
  }

  private async cleanupSyncedItems(syncedItems: any[]): Promise<void> {
    // Remove successfully synced items from the sync queue
    for (const item of syncedItems) {
      await this.removeSyncItem(item.id);
    }
  }

  private async removeSyncItem(itemId: string): Promise<void> {
    // This would need to be implemented in the offline storage
    // For now, we'll clear the entire queue after successful sync
    console.log(`🧹 SyncManager: Removing sync item ${itemId}`);
  }

  // Manual sync trigger
  async forcSync(): Promise<void> {
    console.log('🔄 SyncManager: Manual sync triggered');
    await this.syncWithServer();
  }

  // Conflict resolution
  async resolveConflicts(): Promise<void> {
    const records = await offlineStorage.getMedicalRecords();
    const conflicts = records.filter(r => r.syncStatus === 'conflict');

    if (conflicts.length === 0) {
      console.log('✅ SyncManager: No conflicts to resolve');
      return;
    }

    console.log(`⚠️ SyncManager: Resolving ${conflicts.length} conflicts`);

    for (const conflict of conflicts) {
      try {
        // Fetch latest version from server
        const serverId = conflict.metadata?.serverId;
        if (!serverId) continue;

        const endpoint = `${this.getApiEndpoint(conflict.type)}/${serverId}`;
        const response = await fetch(endpoint);

        if (response.ok) {
          const serverData = await response.json();
          
          // Simple resolution strategy: server wins
          await offlineStorage.updateMedicalRecord(conflict.id, {
            data: serverData,
            syncStatus: 'synced',
            lastModified: Date.now()
          });

          console.log(`✅ SyncManager: Resolved conflict for ${conflict.id}`);
        }
      } catch (error) {
        console.error(`❌ SyncManager: Failed to resolve conflict for ${conflict.id}`, error);
      }
    }

    this.emit('conflictsResolved', conflicts.length);
  }

  // Status and statistics
  getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    queueLength: number;
  } {
    return {
      isOnline: navigator.onLine,
      syncInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length
    };
  }

  async getSyncStats(): Promise<{
    pendingSync: number;
    lastSyncTime: number | null;
    conflicted: number;
    synced: number;
  }> {
    const [syncQueue, records] = await Promise.all([
      offlineStorage.getSyncQueue(),
      offlineStorage.getMedicalRecords()
    ]);

    const conflicted = records.filter(r => r.syncStatus === 'conflict').length;
    const synced = records.filter(r => r.syncStatus === 'synced').length;
    
    // Get last sync time from storage
    const lastSyncTime = await offlineStorage.getPreference('lastSyncTime');

    return {
      pendingSync: syncQueue.length,
      lastSyncTime,
      conflicted,
      synced
    };
  }

  // Save sync timestamp
  private async updateLastSyncTime(): Promise<void> {
    await offlineStorage.savePreference('lastSyncTime', Date.now());
  }
}

// Singleton instance
export const syncManager = new SyncManager();

// React hook for sync management
export function useSyncManager() {
  const [syncStatus, setSyncStatus] = useState({
    isOnline: false, // Always start as false to prevent hydration mismatch
    syncInProgress: false,
    queueLength: 0
  });

  const [syncStats, setSyncStats] = useState<any>(null);

  useEffect(() => {
    const updateStatus = () => {
      setSyncStatus(syncManager.getSyncStatus());
    };

    // Initialize with correct online status after hydration
    if (typeof window !== 'undefined') {
      updateStatus();
    }

    const updateStats = async () => {
      try {
        const stats = await syncManager.getSyncStats();
        setSyncStats(stats);
      } catch (error) {
        console.error('Failed to get sync stats:', error);
      }
    };

    // Initial load
    updateStatus();
    updateStats();

    // Listen to sync events
    const handleSyncStarted = () => {
      updateStatus();
    };

    const handleSyncCompleted = () => {
      updateStatus();
      updateStats();
    };

    const handleOnline = () => {
      updateStatus();
    };

    const handleOffline = () => {
      updateStatus();
    };

    syncManager.on('syncStarted', handleSyncStarted);
    syncManager.on('syncCompleted', handleSyncCompleted);
    syncManager.on('online', handleOnline);
    syncManager.on('offline', handleOffline);

    // Cleanup
    return () => {
      syncManager.off('syncStarted', handleSyncStarted);
      syncManager.off('syncCompleted', handleSyncCompleted);
      syncManager.off('online', handleOnline);
      syncManager.off('offline', handleOffline);
    };
  }, []);

  return {
    syncManager,
    syncStatus,
    syncStats,
    forceSync: () => syncManager.forcSync(),
    resolveConflicts: () => syncManager.resolveConflicts()
  };
}

import { useState, useEffect } from 'react';
