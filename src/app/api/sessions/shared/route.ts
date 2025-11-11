import { NextResponse } from 'next/server';
import { getPublicSessionsFromOthers } from '@/lib/mongodb-db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching public sessions from others, current user:', session.id);
    const sessions = await getPublicSessionsFromOthers(session.id);
    console.log('Found shared sessions:', sessions.length);
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching shared sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
