import fs from 'fs/promises'
import path from 'path'

const CACHE_DIR = path.join(process.cwd(), '.tmp', 'ads-post-assets')
const LOCAL_KARAT_DIR = path.join(process.cwd(), 'public', 'ads-post', 'karat')

const BACKGROUND_CANDIDATES = [
  path.join(process.cwd(), 'assets', 'goldbg01.webp'),
  path.join(process.cwd(), 'assets', 'goldbg.png'),
]

export const PHOTO_ASSETS = {}

export const KARAT_PHOTOS = {
  '24K': { key: 'karat24Bars', file: '24k-bars.jpg', label: 'Gold bars' },
  '22K': { key: 'karat22Ring', file: '22k-ring.jpg', label: 'Gold ring' },
  '21K': { key: 'karat21Necklace', file: '21k-necklace.jpg', label: 'Gold necklace' },
  '18K': { key: 'karat18Bangle', file: '18k-bangle.jpg', label: 'Gold bangle' },
}

export const KARAT_ORDER = ['24K', '22K', '21K', '18K']

async function loadLocalBackground() {
  for (const candidate of BACKGROUND_CANDIDATES) {
    try {
      await fs.access(candidate)
      return { buffer: await fs.readFile(candidate), source: path.basename(candidate) }
    } catch {
      // try next
    }
  }
  throw new Error('No background image found (goldbg01.webp / goldbg.png)')
}

async function loadLocalKaratPhoto(fileName) {
  return fs.readFile(path.join(LOCAL_KARAT_DIR, fileName))
}

export async function loadPhotoAssets() {
  const loaded = {}

  try {
    const bg = await loadLocalBackground()
    loaded.background = bg.buffer
    loaded.backgroundSource = bg.source
  } catch (error) {
    console.warn('[AdsPost]', error.message)
  }

  await Promise.all(
    Object.values(KARAT_PHOTOS).map(async ({ key, file }) => {
      try {
        loaded[key] = await loadLocalKaratPhoto(file)
      } catch (error) {
        console.warn(`[AdsPost] Local karat photo ${key} missing:`, error.message)
      }
    })
  )

  return loaded
}

export function getKaratIconKeys() {
  return KARAT_ORDER.map((k) => KARAT_PHOTOS[k].key)
}

export async function clearPhotoCache() {
  try {
    await fs.rm(CACHE_DIR, { recursive: true, force: true })
  } catch {
    // ignore
  }
}
