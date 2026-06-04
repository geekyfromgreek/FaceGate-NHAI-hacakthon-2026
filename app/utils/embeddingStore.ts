import { calculateCosineSimilarity } from './faceRecognition';

// Mocking SQLite for React Native web/sandbox prototype if direct expo-sqlite is not available.
// In actual device code, it will import * as SQLite from 'expo-sqlite'.
interface UserRow {
  user_id: string;
  name: string;
  embedding: string; // JSON string of number[]
  enrolled_at: string;
}

interface AuthLogRow {
  id: number;
  user_id: string;
  name: string;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: string;
  synced: number; // 0 = Pending, 1 = Synced
}

// Memory-backed SQLite Mock database to run reliably in prototype/test environments
class SQLiteMockDB {
  private usersTable: UserRow[] = [];
  private logsTable: AuthLogRow[] = [];
  private logIdCounter = 1;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedUsers = window.localStorage.getItem('facegate_users');
      const storedLogs = window.localStorage.getItem('facegate_logs');
      const storedCounter = window.localStorage.getItem('facegate_log_counter');

      if (storedUsers) {
        this.usersTable = JSON.parse(storedUsers);
      } else {
        // Seed default users if empty
        this.usersTable = [
          {
            user_id: 'NHAI-2026-08',
            name: 'Rohan Sharma',
            embedding: JSON.stringify(new Array(128).fill(0).map((_, idx) => (idx % 2 === 0 ? 0.1 : -0.1))),
            enrolled_at: new Date().toISOString()
          },
          {
            user_id: 'NHAI-2026-15',
            name: 'Anjali Verma',
            embedding: JSON.stringify(new Array(128).fill(0).map((_, idx) => (idx % 3 === 0 ? 0.15 : -0.05))),
            enrolled_at: new Date().toISOString()
          }
        ];
        this.saveToStorage();
      }

      if (storedLogs) {
        this.logsTable = JSON.parse(storedLogs);
      } else {
        // Seed default logs if empty
        this.logsTable = [
          {
            id: 1,
            user_id: 'NHAI-2026-08',
            name: 'Rohan Sharma',
            status: 'SUCCESS',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            synced: 0
          },
          {
            id: 2,
            user_id: 'NHAI-2026-15',
            name: 'Anjali Verma',
            status: 'SUCCESS',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            synced: 0
          },
          {
            id: 3,
            user_id: 'UNKNOWN',
            name: 'Unrecognized User',
            status: 'FAILURE',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            synced: 0
          }
        ];
        this.saveToStorage();
      }

      if (storedCounter) {
        this.logIdCounter = parseInt(storedCounter, 10);
      } else {
        this.logIdCounter = 4;
      }
    } else {
      // Fallback seeds when localStorage is not available (Node execution)
      this.usersTable = [
        {
          user_id: 'NHAI-2026-08',
          name: 'Rohan Sharma',
          embedding: JSON.stringify(new Array(128).fill(0).map((_, idx) => (idx % 2 === 0 ? 0.1 : -0.1))),
          enrolled_at: new Date().toISOString()
        }
      ];
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('facegate_users', JSON.stringify(this.usersTable));
      window.localStorage.setItem('facegate_logs', JSON.stringify(this.logsTable));
      window.localStorage.setItem('facegate_log_counter', this.logIdCounter.toString());
    }
  }

  insertUser(user: UserRow) {
    this.usersTable = this.usersTable.filter(u => u.user_id !== user.user_id);
    this.usersTable.push(user);
    this.saveToStorage();
  }

  getAllUsers(): UserRow[] {
    return this.usersTable;
  }

  insertLog(log: Omit<AuthLogRow, 'id'>) {
    this.logsTable.push({
      ...log,
      id: this.logIdCounter++
    });
    this.saveToStorage();
  }

  getAllLogs(): AuthLogRow[] {
    return this.logsTable;
  }

  getPendingLogs(): AuthLogRow[] {
    return this.logsTable.filter(l => l.synced === 0);
  }

  markLogsSynced(ids: number[]) {
    this.logsTable = this.logsTable.map(l => 
      ids.includes(l.id) ? { ...l, synced: 1 } : l
    );
    this.saveToStorage();
  }

  purgeSyncedLogs() {
    this.logsTable = this.logsTable.filter(l => l.synced === 0);
    this.saveToStorage();
  }
}

const db = new SQLiteMockDB();

/**
 * Initialize SQLite tables (Simulated)
 */
export async function initDB(): Promise<void> {
  console.log('SQLITE: Initialized database tables users and auth_logs.');
}

/**
 * Enrolls a user by averaging their 3 captured embedding frames.
 */
export async function enrollUser(userId: string, name: string, embeddings: number[][]): Promise<void> {
  if (embeddings.length === 0) throw new Error('No embeddings provided');
  
  // Calculate average embedding vector
  const vectorLength = embeddings[0].length;
  const avgEmbedding = new Array(vectorLength).fill(0);
  
  for (let i = 0; i < vectorLength; i++) {
    let sum = 0;
    for (let j = 0; j < embeddings.length; j++) {
      sum += embeddings[j][i];
    }
    avgEmbedding[i] = sum / embeddings.length;
  }
  
  db.insertUser({
    user_id: userId,
    name: name,
    embedding: JSON.stringify(avgEmbedding),
    enrolled_at: new Date().toISOString()
  });
  
  console.log(`SQLITE: Successfully enrolled user ${name} with ID ${userId}.`);
}

/**
 * Performs Cosine Similarity lookup across all enrolled embeddings in SQLite.
 * Threshold is set to 0.75.
 * 
 * @param liveEmbedding - 128-dimensional embedding from real-time ONNX inference.
 */
export async function matchFace(liveEmbedding: number[]): Promise<{
  success: boolean;
  user?: { user_id: string; name: string };
  score: number;
}> {
  const users = db.getAllUsers();
  let bestMatch: UserRow | null = null;
  let highestSimilarity = -1;

  for (const user of users) {
    const storedVector: number[] = JSON.parse(user.embedding);
    const similarity = calculateCosineSimilarity(liveEmbedding, storedVector);
    
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = user;
    }
  }

  const MATCH_THRESHOLD = 0.75;
  const isMatch = highestSimilarity >= MATCH_THRESHOLD;

  return {
    success: isMatch,
    user: isMatch && bestMatch ? { user_id: bestMatch.user_id, name: bestMatch.name } : undefined,
    score: highestSimilarity
  };
}

/**
 * Log authentication event locally in database.
 */
export async function logAuthAttempt(userId: string, name: string, status: 'SUCCESS' | 'FAILURE'): Promise<void> {
  db.insertLog({
    user_id: userId,
    name: name,
    status: status,
    timestamp: new Date().toISOString(),
    synced: 0
  });
  console.log(`SQLITE: Logged auth attempt for user ${name} (${status}).`);
}

/**
 * Fetch all local authentication records.
 */
export async function fetchAllLogs() {
  return db.getAllLogs();
}

/**
 * Fetch unsynced records.
 */
export async function fetchPendingLogs() {
  return db.getPendingLogs();
}

/**
 * Purge synced records from local database.
 */
export async function purgeSyncedLogs() {
  db.purgeSyncedLogs();
}

/**
 * Mark logs as successfully uploaded to server.
 */
export async function markLogsSynced(ids: number[]) {
  db.markLogsSynced(ids);
}

/**
 * Fetch all enrolled users.
 */
export async function fetchAllUsers() {
  return db.getAllUsers();
}

