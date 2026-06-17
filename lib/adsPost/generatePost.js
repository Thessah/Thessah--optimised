import { getGoldRates } from '@/lib/goldRates'
import { formatPostDate, buildInstagramCaption } from '@/lib/adsPost/caption'
import { resolveBackgroundBuffer } from '@/lib/adsPost/geminiBackground'
import { clearPhotoCache } from '@/lib/adsPost/photoAssets'
import { composeAdsPostImage } from '@/lib/adsPost/compose'
import { savePostImage } from '@/lib/adsPost/storage'

export async function generateAdsPost({ refreshAssets = false } = {}) {
  if (refreshAssets) {
    await clearPhotoCache()
  }
  const goldData = await getGoldRates()
  if (!goldData?.formatted) {
    throw new Error('Could not fetch gold rates')
  }

  const { short: dateShort, long: dateLong, slash: dateSlash, banner: dateBanner } =
    formatPostDate(new Date())

  let backgroundBuffer
  let backgroundSource = 'photo'
  try {
    const resolved = await resolveBackgroundBuffer()
    backgroundBuffer = resolved.buffer
    backgroundSource = resolved.source
  } catch (error) {
    throw new Error(`Background generation failed: ${error.message}`)
  }

  let imageBuffer
  try {
    imageBuffer = await composeAdsPostImage({
      backgroundBuffer,
      formatted: goldData.formatted,
      dateBanner,
      dateSlash,
    })
  } catch (error) {
    throw new Error(`Image composition failed: ${error.message}`)
  }

  let postId
  try {
    const saved = await savePostImage(imageBuffer)
    postId = saved.id
  } catch (error) {
    throw new Error(`Failed to save image: ${error.message}`)
  }

  const caption = buildInstagramCaption({
    formatted: goldData.formatted,
    dateLong,
    dateSlash,
  })

  return {
    postId,
    caption,
    rates: goldData.formatted,
    dateShort,
    dateLong,
    dateSlash,
    dateBanner,
    backgroundSource,
    imageUrl: `/api/store/ads-post/${postId}`,
    mimeType: 'image/png',
    width: 1080,
    height: 1350,
  }
}
