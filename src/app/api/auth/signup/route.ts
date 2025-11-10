import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { setSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, passcode } = await request.json();
    
    // Validate input
    if (!email || !password || !name || !passcode) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Verify access passcode
    const correctPasscode = process.env.ACCESS_PASSCODE;
    if (passcode !== correctPasscode) {
      return NextResponse.json(
        { error: 'Invalid access passcode' },
        { status: 401 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }
    
    // Create user
    const user = await createUser(email, password, name);
    
    // Set session
    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.message === 'User already exists') {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
