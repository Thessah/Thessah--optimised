import connectDB from '@/lib/mongoose';
import StoreUser from '@/models/StoreUser';
import Store from '@/models/Store';
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper';
import authSeller from '@/middlewares/authSeller';
import { sendTeamInviteEmail } from '@/lib/email';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// GET: List all team members for the store
export async function GET(request) {
  try {
    await connectDB();
    const { uid: userId } = await requireFirebaseAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const teamMembers = await StoreUser.find({ storeId }).sort({ createdAt: -1 });
    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error('[TEAM MEMBERS GET]', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST: Send invite or create team member
export async function POST(request) {
  try {
    await connectDB();
    const { uid: userId } = await requireFirebaseAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const { email, role } = await request.json();

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Role must be admin or member' }, { status: 400 });
    }

    // Check if email already exists in store
    const existing = await StoreUser.findOne({ storeId, email });
    if (existing) {
      return NextResponse.json(
        { error: 'This email is already invited or a member of this store' },
        { status: 409 }
      );
    }

    // Get store info
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create store user record
    const storeUser = await StoreUser.create({
      storeId,
      email,
      role,
      status: 'invited',
      invitedById: userId,
      inviteToken,
      inviteExpiry,
    });

    // Send invite email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thessah.ae';
    const inviteLink = `${appUrl}/accept-invite?token=${inviteToken}`;
    
    try {
      await sendTeamInviteEmail({
        email,
        storeName: store.username || 'Your Store',
        role,
        inviteLink,
      });
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Don't fail the request if email fails - they can resend later
    }

    return NextResponse.json({
      message: 'Invite sent successfully',
      storeUser,
      inviteLink, // For testing purposes
    });
  } catch (error) {
    console.error('[TEAM MEMBERS POST]', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT: Update team member role/status
export async function PUT(request) {
  try {
    await connectDB();
    const { uid: userId } = await requireFirebaseAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const { memberId, role, status } = await request.json();

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const member = await StoreUser.findById(memberId);
    if (!member || member.storeId !== storeId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Only allow updating role and status
    if (role && ['admin', 'member'].includes(role)) {
      member.role = role;
    }

    if (status && ['approved', 'rejected', 'removed'].includes(status)) {
      member.status = status;
      if (status === 'approved') {
        member.approvedById = userId;
      }
    }

    await member.save();

    return NextResponse.json({
      message: 'Member updated successfully',
      member,
    });
  } catch (error) {
    console.error('[TEAM MEMBERS PUT]', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE: Remove team member
export async function DELETE(request) {
  try {
    await connectDB();
    const { uid: userId } = await requireFirebaseAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const member = await StoreUser.findById(memberId);
    if (!member || member.storeId !== storeId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    await StoreUser.findByIdAndDelete(memberId);

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('[TEAM MEMBERS DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
