'use client';

// IndexedDB wrapper for offline medical data storage
interface MedicalRecord {
  id: string;
  type: 'report' | 'metric' | 'imaging' | 'calculation';
  data: any;
  timestamp: number;
  lastModified: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  metadata: {
    patientId?: string;
    reportDate?: string;
    category?: string;
    source?: 'upload' | 'manual' | 'ai';
    serverId?: string;
  };
}

interface SyncQueue {
  id: string;
  action: 'create' | 'update' | 'delete';
  recordId: string;
  data?: any;
  timestamp: number;
  retryCount: number;
}

class OfflineStorage {
  private dbName = 'LiverTrackerOffline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to open database');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB: Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.setupObjectStores(db);
      };
    });
  }

  private setupObjectStores(db: IDBDatabase): void {
    // Medical records store
    if (!db.objectStoreNames.contains('medicalRecords')) {
      const recordsStore = db.createObjectStore('medicalRecords', { keyPath: 'id' });
      recordsStore.createIndex('type', 'type', { unique: false });
      recordsStore.createIndex('timestamp', 'timestamp', { unique: false });
      recordsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      recordsStore.createIndex('patientId', 'metadata.patientId', { unique: false });
    }

    // Sync queue store
    if (!db.objectStoreNames.contains('syncQueue')) {
      const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
      syncStore.createIndex('timestamp', 'timestamp', { unique: false });
      syncStore.createIndex('action', 'action', { unique: false });
    }

    // Cache store for API responses
    if (!db.objectStoreNames.contains('apiCache')) {
      const cacheStore = db.createObjectStore('apiCache', { keyPath: 'url' });
      cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      cacheStore.createIndex('expires', 'expires', { unique: false });
    }

    // User preferences store
    if (!db.objectStoreNames.contains('preferences')) {
      db.createObjectStore('preferences', { keyPath: 'key' });
    }

    console.log('📦 IndexedDB: Object stores created');
  }

  // Medical Records Operations
  async saveMedicalRecord(record: Omit<MedicalRecord, 'id' | 'timestamp' | 'lastModified'>): Promise<string> {
    if (!this.db) await this.initialize();

    const id = `${record.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRecord: MedicalRecord = {
      ...record,
      id,
      timestamp: Date.now(),
      lastModified: Date.now(),
      syncStatus: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['medicalRecords'], 'readwrite');
      const store = transaction.objectStore('medicalRecords');
      const request = store.add(fullRecord);

      request.onsuccess = () => {
        console.log('💾 IndexedDB: Medical record saved offline', id);
        this.addToSyncQueue('create', id, fullRecord);
        resolve(id);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to save medical record');
        reject(request.error);
      };
    });
  }

  async getMedicalRecords(type?: string, limit?: number): Promise<MedicalRecord[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['medicalRecords'], 'readonly');
      const store = transaction.objectStore('medicalRecords');
      
      let request: IDBRequest;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let records = request.result;
        
        // Sort by timestamp (newest first)
        records.sort((a: MedicalRecord, b: MedicalRecord) => b.timestamp - a.timestamp);
        
        // Apply limit if specified
        if (limit) {
          records = records.slice(0, limit);
        }

        console.log(`📖 IndexedDB: Retrieved ${records.length} medical records`);
        resolve(records);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to retrieve medical records');
        reject(request.error);
      };
    });
  }

  async updateMedicalRecord(id: string, updates: Partial<MedicalRecord>): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['medicalRecords'], 'readwrite');
      const store = transaction.objectStore('medicalRecords');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (!record) {
          reject(new Error('Record not found'));
          return;
        }

        const updatedRecord = {
          ...record,
          ...updates,
          lastModified: Date.now(),
          syncStatus: 'pending' as const
        };

        const putRequest = store.put(updatedRecord);
        putRequest.onsuccess = () => {
          console.log('✏️ IndexedDB: Medical record updated', id);
          this.addToSyncQueue('update', id, updatedRecord);
          resolve();
        };

        putRequest.onerror = () => {
          reject(putRequest.error);
        };
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  async deleteMedicalRecord(id: string): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['medicalRecords'], 'readwrite');
      const store = transaction.objectStore('medicalRecords');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('🗑️ IndexedDB: Medical record deleted', id);
        this.addToSyncQueue('delete', id);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to delete medical record');
        reject(request.error);
      };
    });
  }

  // Sync Queue Operations
  private async addToSyncQueue(action: SyncQueue['action'], recordId: string, data?: any): Promise<void> {
    if (!this.db) return;

    const syncItem: SyncQueue = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      recordId,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(syncItem);

      request.onsuccess = () => {
        console.log('🔄 IndexedDB: Added to sync queue', action, recordId);
        resolve();
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Failed to add to sync queue');
        reject(request.error);
      };
    });
  }

  async getSyncQueue(): Promise<SyncQueue[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🧹 IndexedDB: Sync queue cleared');
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // API Cache Operations
  async cacheApiResponse(url: string, data: any, ttlMinutes: number = 60): Promise<void> {
    if (!this.db) await this.initialize();

    const cacheItem = {
      url,
      data,
      timestamp: Date.now(),
      expires: Date.now() + (ttlMinutes * 60 * 1000)
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiCache'], 'readwrite');
      const store = transaction.objectStore('apiCache');
      const request = store.put(cacheItem);

      request.onsuccess = () => {
        console.log('📥 IndexedDB: API response cached', url);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getCachedApiResponse(url: string): Promise<any | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiCache'], 'readonly');
      const store = transaction.objectStore('apiCache');
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > result.expires) {
          console.log('⏰ IndexedDB: Cached response expired', url);
          this.deleteCachedApiResponse(url);
          resolve(null);
          return;
        }

        console.log('📤 IndexedDB: Using cached API response', url);
        resolve(result.data);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async deleteCachedApiResponse(url: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiCache'], 'readwrite');
      const store = transaction.objectStore('apiCache');
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // User Preferences
  async savePreference(key: string, value: any): Promise<void> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['preferences'], 'readwrite');
      const store = transaction.objectStore('preferences');
      const request = store.put({ key, value, timestamp: Date.now() });

      request.onsuccess = () => {
        console.log('⚙️ IndexedDB: Preference saved', key);
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getPreference(key: string): Promise<any | null> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['preferences'], 'readonly');
      const store = transaction.objectStore('preferences');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Storage Statistics
  async getStorageStats(): Promise<{
    records: number;
    syncQueue: number;
    cachedResponses: number;
    totalSize: string;
  }> {
    if (!this.db) await this.initialize();

    const [records, syncQueue, cachedResponses] = await Promise.all([
      this.getMedicalRecords(),
      this.getSyncQueue(),
      this.getCachedApiResponses()
    ]);

    // Estimate storage size (rough calculation)
    const totalSize = this.estimateStorageSize(records, syncQueue, cachedResponses);

    return {
      records: records.length,
      syncQueue: syncQueue.length,
      cachedResponses: cachedResponses.length,
      totalSize: this.formatBytes(totalSize)
    };
  }

  private async getCachedApiResponses(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiCache'], 'readonly');
      const store = transaction.objectStore('apiCache');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private estimateStorageSize(records: any[], syncQueue: any[], cache: any[]): number {
    const jsonSize = (obj: any) => new Blob([JSON.stringify(obj)]).size;
    
    const recordsSize = records.reduce((total, record) => total + jsonSize(record), 0);
    const syncSize = syncQueue.reduce((total, item) => total + jsonSize(item), 0);
    const cacheSize = cache.reduce((total, item) => total + jsonSize(item), 0);
    
    return recordsSize + syncSize + cacheSize;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Cleanup operations
  async cleanupExpiredCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['apiCache'], 'readwrite');
      const store = transaction.objectStore('apiCache');
      const index = store.index('expires');
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('🧹 IndexedDB: Expired cache cleaned up');
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Hook for using offline storage in React components
export function useOfflineStorage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageStats, setStorageStats] = useState<any>(null);

  useEffect(() => {
    // Only initialize on client-side
    if (typeof window !== 'undefined') {
      offlineStorage.initialize().then(() => {
        setIsInitialized(true);
        updateStats();
      });
    }
  }, []);

  const updateStats = async () => {
    try {
      const stats = await offlineStorage.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    }
  };

  return {
    storage: offlineStorage,
    isInitialized,
    storageStats,
    updateStats
  };
}

import { useState, useEffect } from 'react';
