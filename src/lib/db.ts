// Simple file-based user database (replace with real database in production)
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string; // Changed to string for JSON serialization
}

// File path for storing users
const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load users from file
function loadUsers(): Map<string, User> {
  ensureDataDirectory();
  
  if (!fs.existsSync(usersFilePath)) {
    return new Map();
  }
  
  try {
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    const usersArray: User[] = JSON.parse(data);
    return new Map(usersArray.map(u => [u.id, u]));
  } catch (error) {
    console.error('Error loading users:', error);
    return new Map();
  }
}

// Save users to file
function saveUsers(users: Map<string, User>) {
  ensureDataDirectory();
  
  try {
    const usersArray = Array.from(users.values());
    fs.writeFileSync(usersFilePath, JSON.stringify(usersArray, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const users = loadUsers();
  
  // Check if user already exists
  const existingUser = Array.from(users.values()).find(u => u.email === email);
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user: User = {
    id: crypto.randomUUID(),
    email,
    name,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };
  
  users.set(user.id, user);
  saveUsers(users);
  
  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = loadUsers();
  const user = Array.from(users.values()).find(u => u.email === email);
  return user || null;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

export function getUserWithoutPassword(user: User): Omit<User, 'password'> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ==================== CHAT SESSIONS ====================

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  conversationTree: any[]; // Store the tree structure
  createdAt: string;
  updatedAt: string;
}

const sessionsFilePath = path.join(process.cwd(), 'data', 'sessions.json');

// Load sessions from file
function loadSessions(): Map<string, ChatSession> {
  ensureDataDirectory();
  
  if (!fs.existsSync(sessionsFilePath)) {
    return new Map();
  }
  
  try {
    const data = fs.readFileSync(sessionsFilePath, 'utf-8');
    const sessionsArray: ChatSession[] = JSON.parse(data);
    return new Map(sessionsArray.map(s => [s.id, s]));
  } catch (error) {
    console.error('Error loading sessions:', error);
    return new Map();
  }
}

// Save sessions to file
function saveSessions(sessions: Map<string, ChatSession>) {
  ensureDataDirectory();
  
  try {
    const sessionsArray = Array.from(sessions.values());
    fs.writeFileSync(sessionsFilePath, JSON.stringify(sessionsArray, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving sessions:', error);
  }
}

export async function createSession(userId: string, title: string): Promise<ChatSession> {
  const sessions = loadSessions();
  
  const session: ChatSession = {
    id: crypto.randomUUID(),
    userId,
    title,
    messages: [],
    conversationTree: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  sessions.set(session.id, session);
  saveSessions(sessions);
  
  return session;
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const sessions = loadSessions();
  return sessions.get(sessionId) || null;
}

export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  const sessions = loadSessions();
  return Array.from(sessions.values())
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function updateSession(
  sessionId: string,
  updates: {
    title?: string;
    messages?: ChatMessage[];
    conversationTree?: any[];
  }
): Promise<ChatSession | null> {
  const sessions = loadSessions();
  const session = sessions.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  const updatedSession: ChatSession = {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  sessions.set(sessionId, updatedSession);
  saveSessions(sessions);
  
  return updatedSession;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const sessions = loadSessions();
  const deleted = sessions.delete(sessionId);
  
  if (deleted) {
    saveSessions(sessions);
  }
  
  return deleted;
}
