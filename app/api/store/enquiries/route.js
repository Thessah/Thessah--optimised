import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import EnquiryMessage from '@/models/EnquiryMessage';
import authSeller from '@/middlewares/authSeller';
import { auth as adminAuth } from '@/lib/firebase-admin';

async function authorizeSeller(request) {
  const authHeader = request.headers.get('authorization');
  let userId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split(' ')[1];

    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch {
      return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }
  }

  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const storeId = await authSeller(userId);
  if (!storeId) {
    return { ok: false, response: NextResponse.json({ error: 'Not authorized as seller' }, { status: 401 }) };
  }

  return { ok: true, userId, storeId };
}

export async function GET(request) {
  try {
    const auth = await authorizeSeller(request);
    if (!auth.ok) return auth.response;

    await connectDB();

    const enquiries = await EnquiryMessage.find({ store: auth.storeId })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return NextResponse.json({ enquiries });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await authorizeSeller(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json({ error: 'Enquiry id is required' }, { status: 400 });
    }

    await connectDB();

    const deleted = await EnquiryMessage.findOneAndDelete({ _id: id, store: auth.storeId }).lean();
    if (!deleted) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 });
  }
}
