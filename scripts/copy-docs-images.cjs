const fs = require('fs-extra')
const path = require('path')
const glob = require('fast-glob')
const crypto = require('crypto')

const baseSrcDir = path.resolve(__dirname, '../content/docs')
const baseDestDir = path.resolve(__dirname, '../public')

// List of subdirectories inside content/docs to sync
const subpaths = ['images', 'content/docs/images'] // yes the source path is /content/docs/content/docs/images

// Helper function to calculate file hash
async function getFileHash(filePath) {
  try {
    const data = await fs.readFile(filePath)
    return crypto.createHash('sha256').update(data).digest('hex')
  } catch (error) {
    return null
  }
}

async function copyImages() {
  console.log("Docs image copy starting...")
  const start = Date.now()

  let total = 0
  let copied = 0
  let skipped = 0

  for (const subpath of subpaths) {
    const srcDir = path.join(baseSrcDir, subpath)
    const destDir = path.join(baseDestDir, subpath)

    const files = await glob('**/*.{png,jpg,jpeg,gif,svg}', { cwd: srcDir })
    total += files.length
    await fs.ensureDir(destDir)

    for (const file of files) {
      const srcFile = path.join(srcDir, file)
      const destFile = path.join(destDir, file)

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
        copied++
      } else {
        skipped++
      }
    }
  }

  const end = Date.now()
  console.log(`Docs image copy finished in ${end - start}ms. Total: ${total} files | Copied: ${copied} | Already copied: ${skipped}`)
}

copyImages().catch(error => {
  console.error('Docs image copy error:', error)
  process.exit(1)
})