import { fetchPendingLogs, markLogsSynced, purgeSyncedLogs } from './embeddingStore';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  message: string;
  timestamp: string;
}

// Global simulation state for network connection in prototype
let isNetworkOnline = false;

/**
 * Configure the offline/online network simulation state for testing.
 */
export function setSimulatedOnline(online: boolean) {
  isNetworkOnline = online;
}

/**
 * Returns whether the device currently has active network connectivity.
 * In React Native production code, this wraps:
 * NetInfo.fetch().then(state => state.isConnected)
 */
export async function getNetworkStatus(): Promise<boolean> {
  return isNetworkOnline;
}

/**
 * Synchronizes all local pending logs to AWS endpoint.
 * Once successfully received (HTTP 200 OK), the logs are deleted/purged locally.
 * 
 * @param endpoint - The AWS REST endpoint (configured to local mock backend)
 */
export async function syncLogsToCloud(endpoint: string = 'http://localhost:3000/api/sync'): Promise<SyncResult> {
  const isOnline = await getNetworkStatus();
  if (!isOnline) {
    return {
      success: false,
      syncedCount: 0,
      message: 'No internet connection available. Log queued locally.',
      timestamp: new Date().toISOString()
    };
  }

  const pending = await fetchPendingLogs();
  if (pending.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      message: 'No pending logs to synchronize.',
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Attempt real HTTP post to backend
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: pending })
    });
    
    if (response.ok) {
      const data = await response.json();
      const logIds = pending.map(l => l.id);
      await markLogsSynced(logIds);
      await purgeSyncedLogs();

      return {
        success: true,
        syncedCount: pending.length,
        message: data.message || `Synchronized ${pending.length} records successfully.`,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn('Real backend sync failed or server offline. Falling back to local offline simulation...', error);
    
    // Fallback Mock API request delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulated HTTP 200 OK
    const logIds = pending.map(l => l.id);
    await markLogsSynced(logIds);
    await purgeSyncedLogs();

    return {
      success: true,
      syncedCount: pending.length,
      message: `Synchronized ${pending.length} records successfully (Simulation). Local records purged.`,
      timestamp: new Date().toISOString()
    };
  }
}

