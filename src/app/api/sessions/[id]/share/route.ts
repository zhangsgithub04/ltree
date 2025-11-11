import { NextRequest, NextResponse } from 'next/server';
import { getSession as getAuthSession } from '@/lib/auth';
import { getSessionWithMessages, toggleSessionPublic } from '@/lib/mongodb-db';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST - Toggle session public/private status
export async function POST(
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
    
    const { isPublic } = await request.json();
    
    const updatedSession = await toggleSessionPublic(id, isPublic);
    
    return NextResponse.json({ 
      session: updatedSession,
      shareUrl: isPublic ? `/share/${updatedSession?.shareToken}` : null
    });
  } catch (error) {
    console.error('Error toggling session visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
