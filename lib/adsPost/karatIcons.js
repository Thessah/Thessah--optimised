import sharp from 'sharp'

/** Render consistent 3D-style gold icons (Star Mint style) for each karat row */
const ICONS = {
  '24K': `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff1a8"/>
        <stop offset="40%" stop-color="#ffd700"/>
        <stop offset="100%" stop-color="#a67c00"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="#1a1208" rx="12"/>
    <rect x="28" y="118" width="144" height="38" rx="5" fill="url(#g)" stroke="#fff8c0" stroke-width="2"/>
    <rect x="34" y="88" width="132" height="38" rx="5" fill="url(#g)" stroke="#fff8c0" stroke-width="2"/>
    <rect x="40" y="58" width="120" height="38" rx="5" fill="url(#g)" stroke="#fff8c0" stroke-width="2"/>
    <text x="100" y="82" text-anchor="middle" fill="#4a3800" font-family="Georgia,serif" font-size="18" font-weight="700">24K</text>
  </svg>`,

  '22K': `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fff1a8"/>
        <stop offset="50%" stop-color="#ffd700"/>
        <stop offset="100%" stop-color="#b8860b"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="#12182a" rx="12"/>
    <ellipse cx="82" cy="112" rx="38" ry="32" fill="none" stroke="url(#g)" stroke-width="11"/>
    <ellipse cx="118" cy="112" rx="38" ry="32" fill="none" stroke="url(#g)" stroke-width="11"/>
    <circle cx="100" cy="88" r="8" fill="#fff8dc"/>
  </svg>`,

  '21K': `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffd700"/>
        <stop offset="100%" stop-color="#b8860b"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="#1a1208" rx="12"/>
    <path d="M60 130 Q100 50 140 130" fill="none" stroke="url(#g)" stroke-width="10" stroke-linecap="round"/>
    <circle cx="100" cy="132" r="14" fill="url(#g)" stroke="#fff8dc" stroke-width="2"/>
    <circle cx="100" cy="132" r="6" fill="#fff8dc"/>
  </svg>`,

  '18K': `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ffe566"/>
        <stop offset="100%" stop-color="#c9a227"/>
      </linearGradient>
    </defs>
    <rect width="200" height="200" fill="#1a1208" rx="12"/>
    <ellipse cx="100" cy="108" rx="62" ry="22" fill="none" stroke="url(#g)" stroke-width="12"/>
    <ellipse cx="100" cy="122" rx="62" ry="22" fill="none" stroke="#d4af37" stroke-width="9" opacity="0.85"/>
    <ellipse cx="100" cy="136" rx="62" ry="22" fill="none" stroke="#b8860b" stroke-width="7" opacity="0.7"/>
  </svg>`,
}

const cache = new Map()

export async function getKaratIcon(karat, size = 88) {
  const key = `${karat}-${size}`
  if (cache.has(key)) return cache.get(key)

  const svg = ICONS[karat]
  if (!svg) return null

  const png = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer()

  cache.set(key, png)
  return png
}

export async function getAllKaratIcons(size = 88) {
  const keys = ['24K', '22K', '21K', '18K']
  const out = {}
  await Promise.all(
    keys.map(async (k) => {
      out[k] = await getKaratIcon(k, size)
    })
  )
  return out
}
