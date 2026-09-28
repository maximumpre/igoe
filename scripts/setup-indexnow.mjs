/**
 * Writes public/<INDEXNOW_KEY>.txt so Bing/Yandex can verify the key during deploy builds.
 * Set INDEXNOW_KEY in Vercel when you rotate the key (must match keyLocation URL).
 */
import fs from "node:fs"
import path from "node:path"

const key = process.env.INDEXNOW_KEY?.trim()
if (!key) {
  process.exit(0)
}

const publicDir = path.join(process.cwd(), "public")
fs.mkdirSync(publicDir, { recursive: true })
const out = path.join(publicDir, `${key}.txt`)
fs.writeFileSync(out, `${key}\n`, "utf8")
