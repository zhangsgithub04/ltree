import { NextResponse } from 'next/server';
import { getUserPrivateSessions } from '@/lib/mongodb-db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await getUserPrivateSessions(session.id);
    
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching private sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
