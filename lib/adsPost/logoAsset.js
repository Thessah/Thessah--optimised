import fs from 'fs/promises'
import path from 'path'

const LOGO_PATHS = [
  path.join(process.cwd(), 'assets', 'logo', 'logo.png'),
  path.join(process.cwd(), 'public', 'thessah-logo.png'),
]

const LOGO_URL =
  'https://res.cloudinary.com/dyccpu74t/image/upload/v1765529523/Asset_6_q7xkxg.png'

/** Returns the THESSAH logo as a PNG buffer, or null if it cannot be loaded. */
export async function loadLogoBuffer() {
  for (const p of LOGO_PATHS) {
    try {
      return await fs.readFile(p)
    } catch {
      // try next path
    }
  }
  try {
    const res = await fetch(LOGO_URL, { cache: 'no-store' })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
  } catch {
    // ignore
  }
  return null
}
