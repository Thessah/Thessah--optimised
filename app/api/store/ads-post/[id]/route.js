import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper'
import { isStoreAdminEmail } from '@/lib/storeAdminAuth'
import { getPostImagePath, deletePostImage } from '@/lib/adsPost/storage'

export const runtime = 'nodejs'

async function authorize(request) {
  const { email } = await requireFirebaseAuth(request)
  if (!isStoreAdminEmail(email)) {
    throw new Error('FORBIDDEN')
  }
}

export async function GET(request, { params }) {
  try {
    await authorize(request)
    const { id } = await params
    const filePath = await getPostImagePath(id)

    if (!filePath) {
      return NextResponse.json({ error: 'Post not found or expired' }, { status: 404 })
    }

    const buffer = await fs.readFile(filePath)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="thessah-gold-rate-${id.slice(0, 8)}.png"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    if (
      error.message?.includes('Authorization') ||
      error.message?.includes('token')
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await authorize(request)
    const { id } = await params
    const deleted = await deletePostImage(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Post deleted' })
  } catch (error) {
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    if (
      error.message?.includes('Authorization') ||
      error.message?.includes('token')
    ) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
