import { NextResponse } from 'next/server'
import { generateAdsPost } from '@/lib/adsPost/generatePost'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Dev-only smoke test — no auth required */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  try {
    const result = await generateAdsPost()
    return NextResponse.json({
      success: true,
      postId: result.postId,
      dateSlash: result.dateSlash,
      rates: result.rates,
      width: result.width,
      height: result.height,
    })
  } catch (error) {
    console.error('[AdsPost DevTest]', error)
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
