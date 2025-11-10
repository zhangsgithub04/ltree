import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSession, getUserSessions } from '@/lib/mongodb-db';

// GET - List all sessions for current user
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const sessions = await getUserSessions(session.id);
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST - Create a new session
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { title } = await request.json();
    
    const newSession = await createSession(
      session.id,
      title || 'New Conversation'
    );
    
    return NextResponse.json({ session: newSession });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
