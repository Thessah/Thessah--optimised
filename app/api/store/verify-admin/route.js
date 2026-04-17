import { NextResponse } from "next/server";
import { auth as adminAuth } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ isAdmin: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const allowedEmails = [
      process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL,
      process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    ]
      .filter(Boolean)
      .map((email) => email.toLowerCase());

    const email = (decodedToken.email || '').toLowerCase();

    if (email && allowedEmails.includes(email)) {
      return NextResponse.json({ 
        isAdmin: true,
        message: 'Authorized',
        email,
        uid: decodedToken.uid,
      });
    }

    return NextResponse.json({ 
      isAdmin: false,
      message: 'Forbidden'
    }, { status: 403 });
  } catch (error) {
    console.error('Verify admin error:', error?.message || error);
    return NextResponse.json({ 
      isAdmin: false,
      message: 'Verification failed'
    }, { status: 500 });
  }
}
