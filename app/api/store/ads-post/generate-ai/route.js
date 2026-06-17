import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import { requireFirebaseAuth } from '@/lib/firebase-auth-helper'
import { isStoreAdminEmail } from '@/lib/storeAdminAuth'
import { generateAiAdsPost } from '@/lib/adsPost/generateAiPost'
import { getPostImagePath } from '@/lib/adsPost/storage'

export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_REFERENCE_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/jpg'])

export async function POST(request) {
  try {
    const { email } = await requireFirebaseAuth(request)

    if (!isStoreAdminEmail(email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const form = await request.formData()
    const customDetails = String(form.get('customDetails') || '').trim()
    const includeRates = form.get('includeRates') !== 'false'
    const referenceFile = form.get('referenceImage')

    let referenceBuffer = null
    let referenceMimeType = null

    if (referenceFile && typeof referenceFile === 'object' && 'arrayBuffer' in referenceFile) {
      if (referenceFile.size > MAX_REFERENCE_BYTES) {
        return NextResponse.json(
          { error: 'Reference image must be under 8 MB' },
          { status: 400 }
        )
      }

      const mime = referenceFile.type || 'image/png'
      if (!ALLOWED_TYPES.has(mime)) {
        return NextResponse.json(
          { error: 'Reference must be PNG, JPG, or WebP' },
          { status: 400 }
        )
      }

      referenceBuffer = Buffer.from(await referenceFile.arrayBuffer())
      referenceMimeType = mime
    }

    const result = await generateAiAdsPost({
      customDetails,
      referenceBuffer,
      referenceMimeType,
      includeRates,
    })

    let imageBase64 = null
    try {
      const filePath = await getPostImagePath(result.postId)
      if (filePath) {
        imageBase64 = (await fs.readFile(filePath)).toString('base64')
      }
    } catch {
      // optional preview
    }

    return NextResponse.json({
      success: true,
      ...result,
      imageBase64,
    })
  } catch (error) {
    console.error('[AdsPost Generate AI]', error)
    const message = String(error?.message || 'Failed to generate AI post')

    if (
      message.includes('Authorization') ||
      message.includes('token') ||
      message.includes('Unauthorized') ||
      message.includes('Firebase')
    ) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    if (message.includes('GEMINI_API_KEY')) {
      return NextResponse.json({ error: message }, { status: 503 })
    }

    if (error?.code === 'QUOTA' || message.toLowerCase().includes('quota')) {
      return NextResponse.json({ error: message }, { status: 429 })
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
