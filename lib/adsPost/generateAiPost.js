import { getGoldRates } from '@/lib/goldRates'
import { formatPostDate, buildInstagramCaption } from '@/lib/adsPost/caption'
import { buildGeminiPrompt } from '@/lib/adsPost/defaultAiBrief'
import { generateGeminiPostImage } from '@/lib/adsPost/geminiImageGen'
import { generateOpenAiPostImage } from '@/lib/adsPost/openaiImageGen'
import { isGeminiConfigured } from '@/configs/gemini'
import { isOpenAIConfigured } from '@/configs/openai'
import { savePostImage } from '@/lib/adsPost/storage'

async function generateImageWithFallback(args) {
  const errors = []

  if (isGeminiConfigured()) {
    try {
      const { buffer, model } = await generateGeminiPostImage(args)
      return { buffer, model: `gemini:${model}` }
    } catch (error) {
      errors.push(`Gemini: ${error.message}`)
      console.warn('[AdsPost] Gemini failed, trying OpenAI fallback:', error.message)
    }
  }

  if (isOpenAIConfigured()) {
    try {
      const { buffer, model } = await generateOpenAiPostImage(args)
      return { buffer, model: `openai:${model}` }
    } catch (error) {
      errors.push(`OpenAI: ${error.message}`)
      console.warn('[AdsPost] OpenAI image generation failed:', error.message)
    }
  }

  if (!errors.length) {
    throw new Error(
      'No image provider configured. Add GEMINI_API_KEY or OPENAI_API_KEY to your .env file.'
    )
  }

  const err = new Error(errors.join(' | '))
  err.code = 'ALL_PROVIDERS_FAILED'
  throw err
}

export async function generateAiAdsPost({
  customDetails,
  referenceBuffer,
  referenceMimeType,
  includeRates = true,
}) {
  let formatted = null
  let dateMeta = formatPostDate(new Date())

  if (includeRates) {
    const goldData = await getGoldRates()
    if (!goldData?.formatted) {
      throw new Error('Could not fetch live gold rates')
    }
    formatted = goldData.formatted
  } else {
    dateMeta = formatPostDate(new Date())
  }

  const prompt = buildGeminiPrompt({
    customDetails,
    formatted,
    dateBanner: dateMeta.banner,
    dateSlash: dateMeta.slash,
    hasReference: Boolean(referenceBuffer?.length),
  })

  const { buffer, model } = await generateImageWithFallback({
    prompt,
    referenceBuffer,
    referenceMimeType,
  })

  const saved = await savePostImage(buffer)

  const caption = buildInstagramCaption({
    formatted: formatted || {
      perGram24K: '—',
      perGram22K: '—',
      perGram21K: '—',
      perGram18K: '—',
    },
    dateLong: dateMeta.long,
    dateSlash: dateMeta.slash,
  })

  return {
    postId: saved.id,
    caption,
    rates: formatted,
    dateShort: dateMeta.short,
    dateLong: dateMeta.long,
    dateSlash: dateMeta.slash,
    dateBanner: dateMeta.banner,
    backgroundSource: model,
    imageUrl: `/api/store/ads-post/${saved.id}`,
    mimeType: 'image/png',
    width: 1080,
    height: 1350,
    geminiModel: model,
  }
}
