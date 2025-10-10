import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { watch } from 'fs'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const baseSrcDir = path.resolve(__dirname, '../content/docs')
const baseDestDir = path.resolve(__dirname, '../public')

// List of subdirectories inside content/docs to sync
const subpaths = ['images', 'content/docs/images']

// Helper function to calculate file hash
async function getFileHash(filePath: string): Promise<string | null> {
  try {
    const data = await fs.readFile(filePath)
    return crypto.createHash('sha256').update(data).digest('hex')
  } catch (error) {
    return null
  }
}

// Helper function to copy a single image file
async function copyImageFile(srcFile: string, subpath: string) {
  const relativePath = path.relative(path.join(baseSrcDir, subpath), srcFile)
  const destFile = path.join(baseDestDir, subpath, relativePath)

  try {
    const destExists = await fs.pathExists(destFile)
    let shouldCopy = !destExists

    if (destExists) {
      // Compare file hashes to determine if content has changed
      const [srcHash, destHash] = await Promise.all([
        getFileHash(srcFile),
        getFileHash(destFile)
      ])
      shouldCopy = srcHash !== destHash
    }

    if (shouldCopy) {
      await fs.ensureDir(path.dirname(destFile))
      await fs.copyFile(srcFile, destFile)
      console.log(`✓ Copied: ${relativePath}`)
    }
  } catch (error) {
    console.error(`✗ Error copying ${srcFile}:`, error)
  }
}

// Helper function to remove a file from destination
async function removeImageFile(srcFile: string, subpath: string) {
  const relativePath = path.relative(path.join(baseSrcDir, subpath), srcFile)
  const destFile = path.join(baseDestDir, subpath, relativePath)

  try {
    if (await fs.pathExists(destFile)) {
      await fs.remove(destFile)
      console.log(`✗ Removed: ${relativePath}`)
    }
  } catch (error) {
    console.error(`✗ Error removing ${destFile}:`, error)
  }
}

// Check if a file is an image
function isImageFile(filename: string): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg']
  const ext = path.extname(filename).toLowerCase()
  return imageExtensions.includes(ext)
}

// Initial copy of all images
async function initialCopy() {
  console.log("📸 Initial image copy starting...")
  const start = Date.now()

  let total = 0
  let copied = 0
  let skipped = 0

  for (const subpath of subpaths) {
    const srcDir = path.join(baseSrcDir, subpath)

    if (!await fs.pathExists(srcDir)) {
      console.log(`⚠ Skipping ${subpath} (directory doesn't exist)`)
      continue
    }

    const destDir = path.join(baseDestDir, subpath)
    await fs.ensureDir(destDir)

    // Recursively read all image files
    const files = await fs.readdir(srcDir, { recursive: true })

    for (const file of files) {
      const fileName = typeof file === 'string' ? file : file.toString()
      const fullPath = path.join(srcDir, fileName)
      const stat = await fs.stat(fullPath)

      if (stat.isFile() && isImageFile(fullPath)) {
        total++
        const destFile = path.join(destDir, fileName)
        const destExists = await fs.pathExists(destFile)

        let shouldCopy = !destExists

        if (destExists) {
          const [srcHash, destHash] = await Promise.all([
            getFileHash(fullPath),
            getFileHash(destFile)
          ])
          shouldCopy = srcHash !== destHash
        }

        if (shouldCopy) {
          await fs.ensureDir(path.dirname(destFile))
          await fs.copyFile(fullPath, destFile)
          copied++
        } else {
          skipped++
        }
      }
    }
  }

  const end = Date.now()
  console.log(`📸 Initial copy finished in ${end - start}ms. Total: ${total} | Copied: ${copied} | Already synced: ${skipped}\n`)
}

// Watch for changes
async function watchImages() {
  console.log("👀 Watching for image changes...\n")

  for (const subpath of subpaths) {
    const srcDir = path.join(baseSrcDir, subpath)

    if (!await fs.pathExists(srcDir)) {
      console.log(`⚠ Skipping watch for ${subpath} (directory doesn't exist)`)
      continue
    }

    const watcher = watch(srcDir, { recursive: true }, async (eventType, filename) => {
      if (!filename || !isImageFile(filename)) return

      const srcFile = path.join(srcDir, filename)

      if (eventType === 'rename') {
        // Could be a delete or a new file
        const exists = await fs.pathExists(srcFile)
        if (exists) {
          await copyImageFile(srcFile, subpath)
        } else {
          await removeImageFile(srcFile, subpath)
        }
      } else if (eventType === 'change') {
        await copyImageFile(srcFile, subpath)
      }
    })

    // Keep the process running
    process.on('SIGINT', () => {
      watcher.close()
      console.log('\n\n👋 Stopped watching images')
      process.exit(0)
    })
  }
}

// Main function
async function main() {
  try {
    await initialCopy()
    await watchImages()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
