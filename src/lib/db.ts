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
