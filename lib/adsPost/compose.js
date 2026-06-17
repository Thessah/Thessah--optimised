import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { KARAT_ORDER } from './photoAssets.js'
import { getAllKaratIcons } from './karatIcons.js'
import { STORE_CONTACT, phonesDisplay } from './storeContact.js'

const W = 1080
const H = 1350

const LOGO_PATHS = [
  path.join(process.cwd(), 'assets', 'logo', 'logo.png'),
  path.join(process.cwd(), 'public', 'thessah-logo.png'),
]

const LOGO_URL =
  'https://res.cloudinary.com/dyccpu74t/image/upload/v1765529523/Asset_6_q7xkxg.png'

const PANEL = { x: 78, y: 318, w: 924, h: 698 }
const ROW0 = PANEL.y + 148
const ROW_H = 108
const ICON = 80
const ICON_X = PANEL.x + 36

function esc(v) {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function ornateCorner(x, y, fx, fy) {
  const sx = fx ? -1 : 1
  const sy = fy ? -1 : 1
  return `<g transform="translate(${x},${y}) scale(${sx},${sy})">
    <path d="M0 0 L0 40 L8 40 L8 8 L40 8 L40 0 Z" fill="#c9a227"/>
    <path d="M0 0 Q20 0 20 20 Q20 40 40 40" fill="none" stroke="#ffd700" stroke-width="1.5"/>
  </g>`
}

function goldRibbon(y, w, h, text, fontSize = 24) {
  const x = (W - w) / 2
  const mid = x + w / 2
  return `
  <path d="M${x + 28} ${y} L${x + w - 28} ${y} L${x + w} ${y + h / 2} L${x + w - 28} ${y + h} L${x + 28} ${y + h} L${x} ${y + h / 2} Z" fill="#d4af37" stroke="#ffd700" stroke-width="2"/>
  <polygon points="${x + 8},${y + h / 2} ${x + 28},${y + 8} ${x + 28},${y + h - 8}" fill="#b8860b"/>
  <polygon points="${x + w - 8},${y + h / 2} ${x + w - 28},${y + 8} ${x + w - 28},${y + h - 8}" fill="#b8860b"/>
  <text x="${mid}" y="${y + h / 2 + 8}" text-anchor="middle" fill="#1a1008" font-family="Georgia,serif" font-size="${fontSize}" font-weight="700" letter-spacing="2">${text}</text>`
}

function rateRow(y, karat, price, last) {
  const div = last
    ? ''
    : `<line x1="${PANEL.x + 32}" y1="${y + ROW_H - 4}" x2="${PANEL.x + PANEL.w - 32}" y2="${y + ROW_H - 4}" stroke="#3d4a6a" stroke-width="1"/>`

  return `<g>
    <rect x="${ICON_X}" y="${y + 10}" width="${ICON}" height="${ICON}" rx="8" fill="#12182a" stroke="#c9a227" stroke-width="1.5"/>
    <text x="${PANEL.x + 148}" y="${y + 64}" fill="#ffd700" font-family="Georgia,serif" font-size="36" font-weight="700">${karat}</text>
    <line x1="${PANEL.x + 218}" y1="${y + 18}" x2="${PANEL.x + 218}" y2="${y + 88}" stroke="#c9a227" stroke-width="2"/>
    <text x="${PANEL.x + 500}" y="${y + 68}" text-anchor="middle" fill="#ffffff" font-family="Georgia,serif" font-size="46" font-weight="700">${esc(price)}</text>
    <text x="${PANEL.x + PANEL.w - 78}" y="${y + 64}" text-anchor="middle" fill="#ffd700" font-family="Georgia,serif" font-size="28" font-weight="700">AED</text>
    ${div}
  </g>`
}

function buildOverlay({ formatted, dateBanner, dateSlash }) {
  const prices = [
    formatted.perGram24K,
    formatted.perGram22K,
    formatted.perGram21K,
    formatted.perGram18K,
  ]
  const rows = KARAT_ORDER.map((k, i) =>
    rateRow(ROW0 + i * ROW_H, k, prices[i], i === 3)
  ).join('')

  const phones = phonesDisplay('  |  ')
  const brandX = 140
  const brandW = 800

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a67c00"/>
      <stop offset="50%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#a67c00"/>
    </linearGradient>
    <radialGradient id="vignette" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.45"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#vignette)"/>

  <!-- emblem ring (logo composited inside) -->
  <circle cx="540" cy="118" r="78" fill="none" stroke="url(#gold)" stroke-width="4"/>
  <circle cx="540" cy="118" r="68" fill="#1a1208" stroke="#c9a227" stroke-width="2" opacity="0.85"/>

  <!-- brand banner -->
  <rect x="${brandX}" y="208" width="${brandW}" height="64" fill="#2a1810" stroke="#c9a227" stroke-width="2.5"/>
  ${ornateCorner(brandX, 208, false, false)}${ornateCorner(brandX + brandW, 208, true, false)}
  ${ornateCorner(brandX, 272, false, true)}${ornateCorner(brandX + brandW, 272, true, true)}
  <text x="540" y="250" text-anchor="middle" fill="url(#gold)" font-family="Georgia,serif" font-size="32" font-weight="700">${esc(STORE_CONTACT.name)}</text>

  ${goldRibbon(284, 680, 48, 'DAILY GOLD PRICE UPDATE', 22)}

  <!-- navy rates panel -->
  <rect x="${PANEL.x}" y="${PANEL.y}" width="${PANEL.w}" height="${PANEL.h}" rx="16" fill="#1c2340" stroke="#c9a227" stroke-width="3"/>
  <rect x="${PANEL.x + 10}" y="${PANEL.y + 10}" width="${PANEL.w - 20}" height="${PANEL.h - 20}" rx="12" fill="none" stroke="#d4af37" stroke-width="1"/>

  <!-- panel header gold strip -->
  <rect x="${PANEL.x + 16}" y="${PANEL.y + 16}" width="${PANEL.w - 32}" height="72" rx="8" fill="#d4af37"/>
  <text x="540" y="${PANEL.y + 48}" text-anchor="middle" fill="#1a1008" font-family="Georgia,serif" font-size="24" font-weight="700">GOLD PRICE PER GRAM (AED)</text>
  <text x="540" y="${PANEL.y + 72}" text-anchor="middle" fill="#3d2914" font-family="Arial,sans-serif" font-size="16" font-weight="600">${esc(dateBanner || dateSlash)}</text>

  ${rows}

  <!-- panel footer gold strip -->
  <rect x="${PANEL.x + 16}" y="${PANEL.y + PANEL.h - 88}" width="${PANEL.w - 32}" height="56" rx="8" fill="#d4af37"/>
  <text x="540" y="${PANEL.y + PANEL.h - 52}" text-anchor="middle" fill="#1a1008" font-family="Arial,sans-serif" font-size="17" font-weight="600">${esc(STORE_CONTACT.website)}  |  ${esc(phones)}</text>

  ${goldRibbon(1048, 620, 52, 'Visit THESSAH Today', 26)}

  <text x="540" y="1128" text-anchor="middle" fill="#ffd700" font-family="Arial,sans-serif" font-size="15">${esc(STORE_CONTACT.email)}</text>
  <text x="540" y="1154" text-anchor="middle" fill="#f5e6c8" font-family="Arial,sans-serif" font-size="13">${esc(STORE_CONTACT.address.line1)}, ${esc(STORE_CONTACT.address.line2)}</text>
  <text x="540" y="1180" text-anchor="middle" fill="#c9a227" font-family="Arial,sans-serif" font-size="12">Indicative rates per gram — subject to market change</text>
</svg>`
}

async function loadLogo() {
  for (const p of LOGO_PATHS) {
    try {
      return await fs.readFile(p)
    } catch {
      // continue
    }
  }
  const res = await fetch(LOGO_URL, { cache: 'no-store' })
  return Buffer.from(await res.arrayBuffer())
}

async function prepBg(buf) {
  return sharp(buf)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .modulate({ brightness: 0.95, saturation: 1.08 })
    .blur(1.2)
    .jpeg({ quality: 93 })
    .toBuffer()
}

export async function composeAdsPostImage({ backgroundBuffer, formatted, dateBanner, dateSlash }) {
  if (!backgroundBuffer) throw new Error('No background')

  const [bg, overlay, icons, logoRaw] = await Promise.all([
    prepBg(backgroundBuffer),
    sharp(Buffer.from(buildOverlay({ formatted, dateBanner, dateSlash }))).png().toBuffer(),
    getAllKaratIcons(ICON - 6),
    loadLogo().catch(() => null),
  ])

  const layers = [{ input: overlay, top: 0, left: 0 }]

  KARAT_ORDER.forEach((karat, i) => {
    if (icons[karat]) {
      layers.push({
        input: icons[karat],
        top: ROW0 + i * ROW_H + 13,
        left: ICON_X + 3,
      })
    }
  })

  if (logoRaw) {
    const logo = await sharp(logoRaw).resize(110, 110, { fit: 'inside' }).png().toBuffer()
    const meta = await sharp(logo).metadata()
    layers.push({
      input: logo,
      top: 118 - Math.round((meta.height || 110) / 2),
      left: 540 - Math.round((meta.width || 110) / 2),
    })
  }

  return sharp(bg).composite(layers).png({ compressionLevel: 6 }).toBuffer()
}
