import { isGeminiConfigured } from '@/configs/gemini'

let _sharp
let _sharpFailed = false

async function resizeToPost(buffer) {
  if (_sharpFailed) return buffer
  try {
    if (!_sharp) {
      _sharp = (await import('sharp')).default
    }
    return await _sharp(buffer)
      .resize(1080, 1350, { fit: 'cover', position: 'centre' })
      .png({ compressionLevel: 6 })
      .toBuffer()
  } catch (error) {
    _sharpFailed = true
    console.warn('[AdsPost Gemini] sharp unavailable, returning unresized image:', error.message)
    return buffer
  }
}

const MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image',
  'gemini-3-pro-image',
  'nano-banana-pro-preview',
]

function extractImageBuffer(data) {
  const parts = data?.candidates?.[0]?.content?.parts || []
  for (const part of parts) {
    if (part.inlineData?.data) {
      return Buffer.from(part.inlineData.data, 'base64')
    }
  }
  return null
}

async function callGeminiModel(model, prompt, reference) {
  const apiKey = process.env.GEMINI_API_KEY
  const parts = [{ text: prompt }]

  if (reference?.buffer?.length) {
    parts.push({
      inlineData: {
        mimeType: reference.mimeType || 'image/png',
        data: reference.buffer.toString('base64'),
      },
    })
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    const rawMsg = json?.error?.message || `Gemini API error (${res.status})`
    if (res.status === 429) {
      const err = new Error(
        'Gemini image generation quota exceeded (free tier has no image quota). ' +
          'Enable billing on your Google AI / Cloud project for this API key to use image generation.'
      )
      err.code = 'QUOTA'
      err.status = 429
      throw err
    }
    if (res.status === 404) {
      const err = new Error(`Model not available: ${model}`)
      err.code = 'MODEL_NOT_FOUND'
      err.status = 404
      throw err
    }
    throw new Error(rawMsg)
  }

  const image = extractImageBuffer(json)
  if (!image) {
    throw new Error('Gemini returned no image — try a different reference or prompt')
  }

  return { image, model }
}

export async function generateGeminiPostImage({ prompt, referenceBuffer, referenceMimeType }) {
  if (!isGeminiConfigured()) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to your .env file.')
  }

  const reference =
    referenceBuffer?.length > 0
      ? { buffer: referenceBuffer, mimeType: referenceMimeType }
      : null

  let lastError
  for (const model of MODELS) {
    try {
      const { image, model: usedModel } = await callGeminiModel(model, prompt, reference)
      const normalized = await resizeToPost(image)
      return { buffer: normalized, model: usedModel }
    } catch (error) {
      lastError = error
      console.warn(`[AdsPost Gemini] ${model} failed:`, error.message)
    }
  }

  throw lastError || new Error('Gemini image generation failed')
}
