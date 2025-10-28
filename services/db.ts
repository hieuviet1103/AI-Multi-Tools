import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ChatSession, HistoryMessage } from '../types';

const DB_NAME = 'AIToolChatHistory';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const MESSAGES_STORE = 'messages';
const DEVICE_ID_KEY = 'gemini-multi-tool-device-id';

interface ChatHistoryDB extends DBSchema {
  [SESSIONS_STORE]: {
    key: string;
    value: ChatSession;
    indexes: { 'by-deviceId': string };
  };
  [MESSAGES_STORE]: {
    key: number;
    value: HistoryMessage;
    indexes: { 'by-sessionId': string };
  };
}

let dbPromise: Promise<IDBPDatabase<ChatHistoryDB>> | null = null;

const initDB = () => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = openDB<ChatHistoryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        sessionStore.createIndex('by-deviceId', 'deviceId');
      }
      if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
        const messageStore = db.createObjectStore(MESSAGES_STORE, { autoIncrement: true, keyPath: 'id' });
        messageStore.createIndex('by-sessionId', 'sessionId');
      }
    },
  });
  return dbPromise;
};

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const saveNewSession = async (session: ChatSession): Promise<void> => {
  const db = await initDB();
  await db.put(SESSIONS_STORE, session);
};

export const saveMessage = async (message: HistoryMessage): Promise<void> => {
  const db = await initDB();
  await db.add(MESSAGES_STORE, message);
};

export const getSessions = async (deviceId: string): Promise<ChatSession[]> => {
  const db = await initDB();
  const sessions = await db.getAllFromIndex(SESSIONS_STORE, 'by-deviceId', deviceId);
  // Sort by timestamp descending to show newest first
  return sessions.sort((a, b) => b.timestamp - a.timestamp);
};

export const getMessages = async (sessionId: string): Promise<HistoryMessage[]> => {
  const db = await initDB();
  const messages = await db.getAllFromIndex(MESSAGES_STORE, 'by-sessionId', sessionId);
  return messages.sort((a, b) => a.timestamp - b.timestamp);
};
