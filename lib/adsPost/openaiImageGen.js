import { toFile } from 'openai'
import { ensureOpenAI, isOpenAIConfigured } from '@/configs/openai'

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
    console.warn('[AdsPost OpenAI] sharp unavailable, returning unresized image:', error.message)
    return buffer
  }
}

function pickBuffer(result) {
  const b64 = result?.data?.[0]?.b64_json
  if (b64) return Buffer.from(b64, 'base64')
  return null
}

/**
 * Generate a post image with OpenAI's image model.
 * Uses gpt-image-1 edits when a reference image is supplied so the output
 * follows the reference layout; otherwise a plain generation.
 */
export async function generateOpenAiPostImage({ prompt, referenceBuffer, referenceMimeType }) {
  if (!isOpenAIConfigured()) {
    throw new Error('OPENAI_API_KEY is not configured. Add it to your .env file.')
  }

  const client = ensureOpenAI()
  const size = '1024x1536' // portrait, closest to 4:5

  try {
    let result
    if (referenceBuffer?.length > 0) {
      const ext = (referenceMimeType || 'image/png').includes('jpeg') ? 'jpg' : 'png'
      const file = await toFile(referenceBuffer, `reference.${ext}`, {
        type: referenceMimeType || 'image/png',
      })
      result = await client.images.edit({
        model: 'gpt-image-1',
        image: file,
        prompt,
        size,
      })
    } else {
      result = await client.images.generate({
        model: 'gpt-image-1',
        prompt,
        size,
      })
    }

    const buffer = pickBuffer(result)
    if (!buffer) throw new Error('OpenAI returned no image data')

    return { buffer: await resizeToPost(buffer), model: 'gpt-image-1' }
  } catch (error) {
    const status = error?.status || error?.response?.status
    const raw = error?.error?.message || error?.message || 'OpenAI image generation failed'

    if (status === 403 || /verif/i.test(raw)) {
      const err = new Error(
        'OpenAI image generation needs organization verification for gpt-image-1. ' +
          'Verify your org at platform.openai.com/settings/organization, or enable Gemini billing.'
      )
      err.code = 'OPENAI_VERIFY'
      throw err
    }
    if (status === 429 || /quota|billing|insufficient/i.test(raw)) {
      const err = new Error('OpenAI image quota/billing limit reached: ' + raw)
      err.code = 'QUOTA'
      throw err
    }
    throw new Error(raw)
  }
}
