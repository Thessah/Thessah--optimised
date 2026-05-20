import connectDB from '@/lib/mongoose';
import StoreUser from '@/models/StoreUser';
import Store from '@/models/Store';
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper';
import { NextResponse } from 'next/server';

// POST: Accept team invite
export async function POST(request) {
  try {
    await connectDB();
    const { uid: userId } = await requireFirebaseAuth(request);
    const { inviteToken } = await request.json();

    if (!inviteToken) {
      return NextResponse.json({ error: 'Invite token required' }, { status: 400 });
    }

    // Find the invite
    const storeUser = await StoreUser.findOne({ inviteToken });

    if (!storeUser) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
    }

    // Check if invite has expired
    if (storeUser.inviteExpiry && new Date(storeUser.inviteExpiry) < new Date()) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    // Check if invite was already accepted
    if (storeUser.status === 'approved') {
      return NextResponse.json({ error: 'This invite has already been accepted' }, { status: 409 });
    }

    // Check if invite was rejected
    if (storeUser.status === 'rejected') {
      return NextResponse.json({ error: 'This invite was rejected' }, { status: 403 });
    }

    // Update the store user
    storeUser.userId = userId;
    storeUser.status = 'approved';
    storeUser.inviteToken = null; // Clear token after use
    storeUser.approvedById = userId;
    await storeUser.save();

    // Get store info for response
    const store = await Store.findById(storeUser.storeId);

    return NextResponse.json({
      message: 'Invite accepted successfully',
      storeUser,
      storeName: store?.username || 'Your Store',
    });
  } catch (error) {
    console.error('[ACCEPT INVITE]', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
