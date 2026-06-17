import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const TMP_DIR = path.join(process.cwd(), '.tmp', 'ads-posts')
const MAX_AGE_MS = 60 * 60 * 1000

export async function ensureTmpDir() {
  await fs.mkdir(TMP_DIR, { recursive: true })
}

export async function cleanupOldPosts() {
  try {
    await ensureTmpDir()
    const files = await fs.readdir(TMP_DIR)
    const now = Date.now()
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(TMP_DIR, file)
        const stat = await fs.stat(filePath)
        if (now - stat.mtimeMs > MAX_AGE_MS) {
          await fs.unlink(filePath).catch(() => {})
        }
      })
    )
  } catch {
    // ignore cleanup errors
  }
}

export async function savePostImage(buffer) {
  await cleanupOldPosts()
  await ensureTmpDir()
  const id = randomUUID()
  const filePath = path.join(TMP_DIR, `${id}.png`)
  await fs.writeFile(filePath, buffer)
  return { id, filePath }
}

export async function getPostImagePath(id) {
  if (!id || !/^[a-f0-9-]{36}$/i.test(id)) return null
  const filePath = path.join(TMP_DIR, `${id}.png`)
  try {
    await fs.access(filePath)
    return filePath
  } catch {
    return null
  }
}

export async function deletePostImage(id) {
  const filePath = await getPostImagePath(id)
  if (!filePath) return false
  await fs.unlink(filePath).catch(() => {})
  return true
}
