import { NextRequest, NextResponse } from 'next/server';
import { getPublicSession } from '@/lib/mongodb-db';

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

// GET - Get public session by share token
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params;
    const { session, messages } = await getPublicSession(token);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or not public' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      session: {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messageCount,
      },
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
    });
  } catch (error) {
    console.error('Error fetching public session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
