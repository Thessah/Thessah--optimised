import sharp from 'sharp'
import { loadPhotoAssets } from './photoAssets.js'

const WIDTH = 1080
const HEIGHT = 1350

export async function resolveBackgroundBuffer() {
  const assets = await loadPhotoAssets()
  if (assets.background) {
    return {
      buffer: assets.background,
      source: assets.backgroundSource || 'goldbg01',
    }
  }

  return {
    buffer: await buildFallback(),
    source: 'gradient',
  }
}

async function buildFallback() {
  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#1a1208"/>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()
}

export async function generateFallbackBackground() {
  const { buffer } = await resolveBackgroundBuffer()
  return buffer
}
