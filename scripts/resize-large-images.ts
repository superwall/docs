import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const MAX_WIDTH = 1920;
const QUALITY = 85;

async function resizeImage(imagePath: string) {
  try {
    const metadata = await sharp(imagePath).metadata();
    const { width, height } = metadata;
    
    if (!width || !height) {
      console.log(`Skipping ${imagePath} - could not read dimensions`);
      return;
    }
    
    if (width <= MAX_WIDTH) {
      console.log(`Skipping ${imagePath} - already optimized (${width}x${height})`);
      return;
    }
    
    const dir = path.dirname(imagePath);
    const ext = path.extname(imagePath);
    const basename = path.basename(imagePath, ext);
    
    // Create backup
    const backupPath = path.join(dir, `${basename}.original${ext}`);
    await fs.copyFile(imagePath, backupPath);
    
    // Resize image
    const aspectRatio = height / width;
    const newHeight = Math.round(MAX_WIDTH * aspectRatio);
    
    await sharp(backupPath)
      .resize(MAX_WIDTH, newHeight)
      .jpeg({ quality: QUALITY })
      .toFile(imagePath);
    
    const stats = await fs.stat(imagePath);
    const originalStats = await fs.stat(backupPath);
    
    console.log(`✓ Resized ${basename}${ext}:`);
    console.log(`  Original: ${width}x${height} (${(originalStats.size / 1024).toFixed(1)}KB)`);
    console.log(`  New: ${MAX_WIDTH}x${newHeight} (${(stats.size / 1024).toFixed(1)}KB)`);
    console.log(`  Saved: ${((originalStats.size - stats.size) / 1024).toFixed(1)}KB`);
    
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error);
  }
}

async function findLargeImages(): Promise<string[]> {
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  const files = await fs.readdir(imagesDir, { recursive: true });
  
  const imageFiles = files
    .filter(file => typeof file === 'string')
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .filter(file => !file.includes('.original.')) // Skip backup files
    .map(file => path.join(imagesDir, file));
  
  const largeImages = [];
  
  for (const file of imageFiles) {
    try {
      const metadata = await sharp(file).metadata();
      const stats = await fs.stat(file);
      
      if (metadata.width && metadata.width > MAX_WIDTH && stats.size > 500 * 1024) {
        largeImages.push(file);
      }
    } catch {
      // Skip files that can't be read
    }
  }
  
  return largeImages;
}

async function main() {
  console.log('Finding and resizing large images...\n');
  
  const largeImages = await findLargeImages();
  
  if (largeImages.length === 0) {
    console.log('No large images found to optimize!');
    return;
  }
  
  console.log(`Found ${largeImages.length} images to optimize\n`);
  
  for (const imagePath of largeImages) {
    await resizeImage(imagePath);
  }
  
  console.log('\nDone! Original images have been backed up with .original extension');
  console.log('Run "bun run build" to see the improvements');
}

main().catch(console.error);