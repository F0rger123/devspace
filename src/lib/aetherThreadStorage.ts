// Aether Robust Durable Thread Storage & Quota-Safe Architecture
// Uses IndexedDB as primary authoritative store for unlimited message history,
// keeping localStorage strictly for lightweight working memory and active session pointers (<50KB).

export interface AetherMessageItem {
  id: string;
  role: 'user' | 'model' | 'agent' | 'assistant';
  content: string;
  timestamp: number;
  toolRefId?: string;
  metadata?: Record<string, any>;
}

export interface AetherThreadItem {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  projectId?: string | null;
  summary?: string;
  messageCount?: number;
}

export interface AetherWorkingMemory {
  activeThreadId: string;
  currentTopic: string;
  activeProjectId?: string | null;
  referencedProjectName?: string | null;
  lastSearchQuery?: string | null;
  lastToolRefId?: string | null;
  lastReportSummary?: string | null;
  lastUpdated: number;
}

const DB_NAME = 'aether_conversation_db_v2';
const DB_VERSION = 1;
const STORE_THREADS = 'threads';
const STORE_MESSAGES = 'messages';
const STORE_TOOL_RESULTS = 'tool_results';

const MIGRATION_KEY = 'aether_history_migrated_v2';
const WORKING_MEMORY_KEY = 'aether_working_memory_v2';
const MAX_LOCAL_STORAGE_BYTES_PER_KEY = 120_000; // 120 KB hard limit per key

class AetherThreadStorageService {
  private dbPromise: Promise<IDBDatabase | null> | null = null;
  private inMemoryThreads: Map<string, AetherThreadItem> = new Map();
  private inMemoryMessages: Map<string, AetherMessageItem[]> = new Map();
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await this.getDB();
      await this.runLegacyMigration();
      this.isInitialized = true;
    } catch (err) {
      console.warn('[AetherThreadStorage] Failed to initialize IndexedDB:', err);
    }
  }

  private getDB(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.resolve(null);
    }

    this.dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result as IDBDatabase;
          if (!db.objectStoreNames.contains(STORE_THREADS)) {
            const threadStore = db.createObjectStore(STORE_THREADS, { keyPath: 'id' });
            threadStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
            const msgStore = db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
            msgStore.createIndex('threadId', 'threadId', { unique: false });
            msgStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_TOOL_RESULTS)) {
            db.createObjectStore(STORE_TOOL_RESULTS, { keyPath: 'id' });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[AetherThreadStorage] IndexedDB open error:', req.error);
          resolve(null);
        };
      } catch (err) {
        console.warn('[AetherThreadStorage] IndexedDB initialization failed:', err);
        resolve(null);
      }
    });

    return this.dbPromise;
  }

  /**
   * Safe LocalStorage Setter with size guard and automatic error suppression
   */
  public safeLocalStorageSet(key: string, value: string, maxBytes = MAX_LOCAL_STORAGE_BYTES_PER_KEY): boolean {
    if (typeof localStorage === 'undefined') return false;
    try {
      // Calculate byte length
      const byteLength = new Blob([value]).size;
      if (byteLength > maxBytes) {
        console.warn(`[AetherThreadStorage] Value for "${key}" is ${byteLength} bytes, exceeding limit of ${maxBytes}. Pruning payload.`);
        return false;
      }
      localStorage.setItem(key, value);
      return true;
    } catch (e: any) {
      if (e?.name === 'QuotaExceededError' || e?.code === 22 || e?.code === 1014) {
        console.warn(`[AetherThreadStorage] QuotaExceeded on localStorage.setItem("${key}"). Performing emergency prune.`);
        this.emergencyPruneLocalStorage();
      }
      return false;
    }
  }

  public safeLocalStorageGet<T>(key: string, fallback: T): T {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item);
    } catch {
      return fallback;
    }
  }

  /**
   * Emergency prune of heavy localStorage keys
   */
  public emergencyPruneLocalStorage() {
    try {
      // Remove oversized legacy keys
      localStorage.removeItem('aether_convo_history');
      
      // Prune chat sessions in localStorage to just top 10 messages of active session
      const rawSessions = localStorage.getItem('aether_chat_sessions');
      if (rawSessions) {
        try {
          const sessions = JSON.parse(rawSessions);
          if (Array.isArray(sessions)) {
            const pruned = sessions.slice(0, 3).map(s => ({
              ...s,
              messages: Array.isArray(s.messages) ? s.messages.slice(-10) : []
            }));
            localStorage.setItem('aether_chat_sessions', JSON.stringify(pruned));
          }
        } catch {
          localStorage.removeItem('aether_chat_sessions');
        }
      }
    } catch (err) {
      console.warn('[AetherThreadStorage] Failed during emergency prune:', err);
    }
  }

  /**
   * Safe Migration from legacy `aether_convo_history` & `aether_chat_sessions`
   */
  public async runLegacyMigration(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    try {
      const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
      if (alreadyMigrated === 'true') {
        // Just ensure legacy key is removed
        if (localStorage.getItem('aether_convo_history')) {
          localStorage.removeItem('aether_convo_history');
        }
        return;
      }

      console.log('[AetherThreadStorage] Running one-time legacy history migration to IndexedDB...');

      // 1. Read legacy conversation history blob
      const legacyConvoRaw = localStorage.getItem('aether_convo_history');
      let legacyConvo: Array<{ role: string; text: string }> = [];
      if (legacyConvoRaw) {
        try {
          legacyConvo = JSON.parse(legacyConvoRaw);
        } catch (e) {
          console.warn('[AetherThreadStorage] Could not parse legacy convo history');
        }
      }

      // 2. Read legacy sessions
      const legacySessionsRaw = localStorage.getItem('aether_chat_sessions');
      let legacySessions: any[] = [];
      if (legacySessionsRaw) {
        try {
          legacySessions = JSON.parse(legacySessionsRaw);
        } catch (e) {
          console.warn('[AetherThreadStorage] Could not parse legacy sessions');
        }
      }

      const activeSessionId = localStorage.getItem('aether_current_session_id') || 'session-default';

      // 3. Migrate sessions into IndexedDB
      if (Array.isArray(legacySessions) && legacySessions.length > 0) {
        for (const sess of legacySessions) {
          if (!sess || !sess.id) continue;
          const thread: AetherThreadItem = {
            id: sess.id,
            title: sess.title || 'Conversation Thread',
            createdAt: sess.createdAt || Date.now(),
            updatedAt: sess.updatedAt || Date.now(),
            projectId: sess.projectId || null,
            messageCount: Array.isArray(sess.messages) ? sess.messages.length : 0
          };
          await this.saveThread(thread);

          if (Array.isArray(sess.messages)) {
            const mapped: AetherMessageItem[] = sess.messages.map((m: any, idx: number) => ({
              id: m.id || `msg-${sess.id}-${idx}`,
              role: (m.role === 'agent' || m.role === 'assistant' ? 'model' : 'user') as any,
              content: m.content || m.text || '',
              timestamp: m.timestamp || (Date.now() - (sess.messages.length - idx) * 1000)
            }));
            await this.saveMessages(sess.id, mapped);
          }
        }
      } else if (legacyConvo.length > 0) {
        // If only legacyConvo existed, migrate it to the default session
        const thread: AetherThreadItem = {
          id: activeSessionId,
          title: 'Central Assistant Session',
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now(),
          messageCount: legacyConvo.length
        };
        await this.saveThread(thread);

        const mapped: AetherMessageItem[] = legacyConvo.map((c, idx) => ({
          id: `msg-migrated-${idx}-${Date.now()}`,
          role: c.role === 'model' || c.role === 'agent' ? 'model' : 'user',
          content: c.text,
          timestamp: Date.now() - (legacyConvo.length - idx) * 1000
        }));
        await this.saveMessages(activeSessionId, mapped);
      }

      // 4. Safely prune localStorage to keep it lightweight (<50KB)
      if (Array.isArray(legacySessions)) {
        const compactSessions = legacySessions.slice(0, 5).map(s => ({
          id: s.id,
          title: s.title,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          messages: Array.isArray(s.messages) ? s.messages.slice(-15) : []
        }));
        this.safeLocalStorageSet('aether_chat_sessions', JSON.stringify(compactSessions), 80_000);
      }

      // Remove the unbounded aether_convo_history key completely
      localStorage.removeItem('aether_convo_history');
      localStorage.setItem(MIGRATION_KEY, 'true');

      console.log('[AetherThreadStorage] Legacy conversation history migrated successfully to IndexedDB.');
    } catch (err) {
      console.error('[AetherThreadStorage] Migration error:', err);
    }
  }

  // --- IndexedDB Operations ---

  public async saveThread(thread: AetherThreadItem): Promise<void> {
    this.inMemoryThreads.set(thread.id, thread);
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_THREADS, 'readwrite');
        const store = tx.objectStore(STORE_THREADS);
        store.put(thread);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getThread(id: string): Promise<AetherThreadItem | null> {
    if (this.inMemoryThreads.has(id)) {
      return this.inMemoryThreads.get(id)!;
    }
    const db = await this.getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_THREADS, 'readonly');
        const store = tx.objectStore(STORE_THREADS);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            this.inMemoryThreads.set(id, req.result);
          }
          resolve(req.result || null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async getAllThreads(): Promise<AetherThreadItem[]> {
    const db = await this.getDB();
    if (!db) {
      return Array.from(this.inMemoryThreads.values());
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_THREADS, 'readonly');
        const store = tx.objectStore(STORE_THREADS);
        const req = store.getAll();
        req.onsuccess = () => {
          const res = req.result || [];
          res.forEach((t: AetherThreadItem) => this.inMemoryThreads.set(t.id, t));
          resolve(res);
        };
        req.onerror = () => resolve(Array.from(this.inMemoryThreads.values()));
      } catch {
        resolve(Array.from(this.inMemoryThreads.values()));
      }
    });
  }

  public async saveMessages(threadId: string, messages: AetherMessageItem[]): Promise<void> {
    this.inMemoryMessages.set(threadId, messages);
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_MESSAGES, STORE_THREADS], 'readwrite');
        const msgStore = tx.objectStore(STORE_MESSAGES);
        const threadStore = tx.objectStore(STORE_THREADS);

        // Put each message with threadId attached
        messages.forEach((msg) => {
          msgStore.put({ ...msg, threadId });
        });

        // Update thread updatedAt and messageCount
        const threadReq = threadStore.get(threadId);
        threadReq.onsuccess = () => {
          const thread = threadReq.result || {
            id: threadId,
            title: 'Conversation Thread',
            createdAt: Date.now()
          };
          thread.updatedAt = Date.now();
          thread.messageCount = messages.length;
          threadStore.put(thread);
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getMessages(threadId: string, limit = 500): Promise<AetherMessageItem[]> {
    if (this.inMemoryMessages.has(threadId)) {
      const cached = this.inMemoryMessages.get(threadId)!;
      if (cached.length > 0) return cached;
    }

    const db = await this.getDB();
    if (!db) {
      return this.inMemoryMessages.get(threadId) || [];
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_MESSAGES, 'readonly');
        const store = tx.objectStore(STORE_MESSAGES);
        const index = store.index('threadId');
        const req = index.getAll(threadId);

        req.onsuccess = () => {
          let list = (req.result || []) as AetherMessageItem[];
          list.sort((a, b) => a.timestamp - b.timestamp);
          if (list.length > limit) {
            list = list.slice(-limit);
          }
          this.inMemoryMessages.set(threadId, list);
          resolve(list);
        };
        req.onerror = () => resolve(this.inMemoryMessages.get(threadId) || []);
      } catch {
        resolve(this.inMemoryMessages.get(threadId) || []);
      }
    });
  }

  /**
   * Store large tool results separately by ID to prevent bloating message history
   */
  public async storeToolResult(id: string, payload: any): Promise<void> {
    const db = await this.getDB();
    if (!db) return;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_TOOL_RESULTS, 'readwrite');
        const store = tx.objectStore(STORE_TOOL_RESULTS);
        store.put({ id, payload, timestamp: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getToolResult(id: string): Promise<any | null> {
    const db = await this.getDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_TOOL_RESULTS, 'readonly');
        const store = tx.objectStore(STORE_TOOL_RESULTS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.payload : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Working Memory Context Management (<10KB)
   */
  public getWorkingMemory(): AetherWorkingMemory {
    return this.safeLocalStorageGet<AetherWorkingMemory>(WORKING_MEMORY_KEY, {
      activeThreadId: 'session-default',
      currentTopic: 'General Workspace',
      lastUpdated: Date.now()
    });
  }

  public saveWorkingMemory(memory: Partial<AetherWorkingMemory>): void {
    const current = this.getWorkingMemory();
    const updated: AetherWorkingMemory = {
      ...current,
      ...memory,
      lastUpdated: Date.now()
    };
    this.safeLocalStorageSet(WORKING_MEMORY_KEY, JSON.stringify(updated), 30_000);
  }
}

export const aetherThreadStorage = new AetherThreadStorageService();
