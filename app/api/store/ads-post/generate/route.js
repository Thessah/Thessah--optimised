import { NextResponse } from 'next/server'
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper'
import { isStoreAdminEmail } from '@/lib/storeAdminAuth'
import { generateAdsPost } from '@/lib/adsPost/generatePost'
import fs from 'fs/promises'
import { getPostImagePath } from '@/lib/adsPost/storage'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request) {
  try {
    const { email } = await requireFirebaseAuth(request)

    if (!isStoreAdminEmail(email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const result = await generateAdsPost()

    // Attach base64 preview only after successful generation (keeps route lean on failure)
    let imageBase64 = null
    try {
      const filePath = await getPostImagePath(result.postId)
      if (filePath) {
        const buffer = await fs.readFile(filePath)
        imageBase64 = buffer.toString('base64')
      }
    } catch {
      // preview optional — client can fetch imageUrl
    }

    return NextResponse.json({
      success: true,
      ...result,
      imageBase64,
    })
  } catch (error) {
    console.error('[AdsPost Generate]', error)
    const message = String(error?.message || 'Failed to generate post')

    if (
      message.includes('Authorization') ||
      message.includes('token') ||
      message.includes('Unauthorized') ||
      message.includes('Firebase')
    ) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: message,
        ...(process.env.NODE_ENV === 'development' && { detail: error?.stack }),
      },
      { status: 500 }
    )
  }
}
