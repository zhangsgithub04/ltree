import { NextRequest, NextResponse } from 'next/server';
import { getSession as getAuthSession } from '@/lib/auth';
import { getSessionWithMessages, updateSession, deleteSession } from '@/lib/mongodb-db';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Get a specific session
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authSession = await getAuthSession();
    
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const { session, messages } = await getSessionWithMessages(id);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Check if session belongs to user
    if (session.userId !== authSession.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      session: {
        ...session,
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT - Update a session
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authSession = await getAuthSession();
    
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const { session } = await getSessionWithMessages(id);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Check if session belongs to user
    if (session.userId !== authSession.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { title, messages, conversationTree } = await request.json();
    
    const updatedSession = await updateSession(id, {
      title,
      messages,
      conversationTree,
    });
    
    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authSession = await getAuthSession();
    
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const { session } = await getSessionWithMessages(id);
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    
    // Check if session belongs to user
    if (session.userId !== authSession.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await deleteSession(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
