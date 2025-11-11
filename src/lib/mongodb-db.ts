// MongoDB-based database with master-slave (parent-child) collections
import bcrypt from 'bcryptjs';
import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';

// ==================== USERS ====================

interface User {
  _id?: ObjectId;
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const db = await getDb();
  const usersCollection = db.collection<User>('users');
  
  // Check if user already exists
  const existingUser = await usersCollection.findOne({ email });
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
    createdAt: new Date(),
  };
  
  await usersCollection.insertOne(user);
  
  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const usersCollection = db.collection<User>('users');
  
  const user = await usersCollection.findOne({ email });
  return user;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

export function getUserWithoutPassword(user: User): Omit<User, 'password'> {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ==================== CHAT SESSIONS (Master Collection) ====================

export interface ChatMessage {
  _id?: ObjectId;
  id: string;
  sessionId: string; // Reference to parent session
  role: string;
  content: string;
  timestamp: Date;
  order: number; // To maintain message order
}

export interface ChatSession {
  _id?: ObjectId;
  id: string;
  userId: string;
  title: string;
  conversationTree: any[]; // Store the tree structure
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number; // Denormalized count for performance
  isPublic?: boolean; // Whether the session is publicly shareable
  shareToken?: string; // Unique token for sharing
}

export async function createSession(userId: string, title: string): Promise<ChatSession> {
  const db = await getDb();
  const sessionsCollection = db.collection<ChatSession>('sessions');
  
  const session: ChatSession = {
    id: crypto.randomUUID(),
    userId,
    title,
    conversationTree: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    messageCount: 0,
    isPublic: false,
    shareToken: crypto.randomUUID(), // Generate unique share token
  };
  
  await sessionsCollection.insertOne(session);
  
  return session;
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  const db = await getDb();
  const sessionsCollection = db.collection<ChatSession>('sessions');
  
  const session = await sessionsCollection.findOne({ id: sessionId });
  return session;
}

export async function getSessionWithMessages(sessionId: string): Promise<{
  session: ChatSession | null;
  messages: ChatMessage[];
}> {
  const db = await getDb();
  const sessionsCollection = db.collection<ChatSession>('sessions');
  const messagesCollection = db.collection<ChatMessage>('messages');
  
  const session = await sessionsCollection.findOne({ id: sessionId });
  
  if (!session) {
    return { session: null, messages: [] };
  }
  
  // Fetch all messages for this session, ordered by order field
  const messages = await messagesCollection
    .find({ sessionId })
    .sort({ order: 1 })
    .toArray();
  
  return { session, messages };
}

export async function getUserSessions(userId: string): Promise<ChatSession[]> {
  const db = await getDb();
  const sessionsCollection = db.collection<ChatSession>('sessions');
  
  const sessions = await sessionsCollection
    .find({ userId })
    .sort({ updatedAt: -1 })
    .toArray();
  
  return sessions;
}

export async function updateSession(
  sessionId: string,
  updates: {
    title?: string;
    messages?: Array<{ id: string; role: string; content: string; timestamp: string }>;
    conversationTree?: any[];
  }
): Promise<ChatSession | null> {
  const db = await getDb();
  const sessionsCollection = db.collection<ChatSession>('sessions');
  const messagesCollection = db.collection<ChatMessage>('messages');
  
  const session = await sessionsCollection.findOne({ id: sessionId });
  
  if (!session) {
    return null;
  }
  
  // Update session metadata
  const sessionUpdates: any = {
    updatedAt: new Date(),
  };
  
  if (updates.title) {
    sessionUpdates.title = updates.title;
  }
  
  if (updates.conversationTree) {
    sessionUpdates.conversationTree = updates.conversationTree;
  }
  
  // Handle messages - master-slave approach
  if (updates.messages && updates.messages.length > 0) {
    // Get existing messages to compare
    const existingMessages = await messagesCollection
      .find({ sessionId })
      .toArray();
    
    const existingMessageIds = new Set(existingMessages.map(m => m.id));
    
    // Insert only new messages
    const newMessages = updates.messages.filter(m => !existingMessageIds.has(m.id));
    
    if (newMessages.length > 0) {
      const messagesToInsert: ChatMessage[] = newMessages.map((msg, index) => ({
        id: msg.id,
        sessionId,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        order: existingMessages.length + index,
      }));
      
      await messagesCollection.insertMany(messagesToInsert);
      
      // Update message count
      sessionUpdates.messageCount = existingMessages.length + newMessages.length;
    } else {
      sessionUpdates.messageCount = existingMessages.length;
    }
  }
  
  // Update session
  await sessionsCollection.updateOne(
    { id: sessionId },
    { $set: sessionUpdates }
  );
  
  // Return updated session
  const updatedSession = await sessionsCollection.findOne({ id: sessionId });
  return updatedSession;
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  const db = await getDb();
  const sessionsCollection = db.collection<ChatSession>('sessions');
  const messagesCollection = db.collection<ChatMessage>('messages');
  
  // Delete all messages for this session (slave records)
  await messagesCollection.deleteMany({ sessionId });
  
  // Delete session (master record)
  const result = await sessionsCollection.deleteOne({ id: sessionId });
  
  return result.deletedCount > 0;
}

// ==================== MESSAGES (Slave Collection) ====================

export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const db = await getDb();
  const messagesCollection = db.collection<ChatMessage>('messages');
  
  const messages = await messagesCollection
    .find({ sessionId })
    .sort({ order: 1 })
    .toArray();
  
  return messages;
}

export async function addMessage(
  sessionId: string,
  message: { id: string; role: string; content: string }
): Promise<ChatMessage> {
  const db = await getDb();
  const messagesCollection = db.collection<ChatMessage>('messages');
  const sessionsCollection = db.collection<ChatSession>('sessions');
  
  // Get current message count to set order
  const messageCount = await messagesCollection.countDocuments({ sessionId });
  
  const newMessage: ChatMessage = {
    id: message.id,
    sessionId,
    role: message.role,
    content: message.content,
    timestamp: new Date(),
    order: messageCount,
  };
  
  await messagesCollection.insertOne(newMessage);
  
  // Update session's updatedAt and messageCount
  await sessionsCollection.updateOne(
    { id: sessionId },
    {
      $set: { updatedAt: new Date(), messageCount: messageCount + 1 }
    }
  );
  
  return newMessage;
}

// ==================== SHARING ====================

export async function toggleSessionPublic(
  sessionId: string,
  isPublic: boolean
): Promise<ChatSession | null> {
  const db = await getDb();
  const sessionsCollection = db.collection<ChatSession>('sessions');
  
  await sessionsCollection.updateOne(
    { id: sessionId },
    { 
      $set: { 
        isPublic,
        updatedAt: new Date()
      } 
    }
  );
  
  const updatedSession = await sessionsCollection.findOne({ id: sessionId });
  return updatedSession;
}

export async function getPublicSession(shareToken: string): Promise<{
  session: ChatSession | null;
  messages: ChatMessage[];
}> {
  const db = await getDb();
  const sessionsCollection = db.collection<ChatSession>('sessions');
  const messagesCollection = db.collection<ChatMessage>('messages');
  
  // Find public session by share token
  const session = await sessionsCollection.findOne({ 
    shareToken,
    isPublic: true 
  });
  
  if (!session) {
    return { session: null, messages: [] };
  }
  
  // Fetch all messages for this session
  const messages = await messagesCollection
    .find({ sessionId: session.id })
    .sort({ order: 1 })
    .toArray();
  
  return { session, messages };
}
