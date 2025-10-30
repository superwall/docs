import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const IMAGE_SIZES = [640, 828, 1200, 1920];
const MAX_WIDTH = 1920; // Maximum width for any image
const QUALITY = 85;

async function optimizeImage(imagePath: string) {
  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const basename = path.basename(imagePath, ext);
  
  try {
    // Get image dimensions
    const { stdout: dimensions } = await execAsync(
      `identify -format "%wx%h" "${imagePath}"`
    );
    const [width, height] = dimensions.trim().split('x').map(Number);
    
    // Skip if image is already small
    if (width <= MAX_WIDTH) {
      console.log(`Skipping ${imagePath} - already optimized (${width}x${height})`);
      return;
    }
    
    console.log(`Optimizing ${imagePath} (${width}x${height})`);
    
    // Create backup
    const backupPath = path.join(dir, `${basename}.original${ext}`);
    await fs.copyFile(imagePath, backupPath);
    
    // Resize to max width while maintaining aspect ratio
    const aspectRatio = height / width;
    const newHeight = Math.round(MAX_WIDTH * aspectRatio);
    
    await execAsync(
      `convert "${imagePath}" -resize ${MAX_WIDTH}x${newHeight} -quality ${QUALITY} "${imagePath}"`
    );
    
    console.log(`✓ Resized to ${MAX_WIDTH}x${newHeight}`);
    
    // Generate responsive sizes
    for (const size of IMAGE_SIZES) {
      if (size >= width) continue;
      
      const responsivePath = path.join(dir, `${basename}-${size}w${ext}`);
      const responsiveHeight = Math.round(size * aspectRatio);
      
      await execAsync(
        `convert "${backupPath}" -resize ${size}x${responsiveHeight} -quality ${QUALITY} "${responsivePath}"`
      );
      
      console.log(`✓ Created ${size}w version`);
    }
    
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error);
  }
}

async function findLargeImages() {
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  const files = await fs.readdir(imagesDir, { recursive: true });
  
  const imageFiles = files
    .filter(file => typeof file === 'string')
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .map(file => path.join(imagesDir, file));
  
  // Check file sizes
  const largeImages = [];
  for (const file of imageFiles) {
    const stats = await fs.stat(file);
    if (stats.size > 200 * 1024) { // > 200KB
      largeImages.push(file);
    }
  }
  
  return largeImages;
}

async function main() {
  console.log('Finding large images...');
  
  try {
    // Check if ImageMagick is installed
    await execAsync('which convert');
  } catch {
    console.error('ImageMagick is required. Install with: brew install imagemagick');
    process.exit(1);
  }
  
  const largeImages = await findLargeImages();
  
  if (largeImages.length === 0) {
    console.log('No large images found!');
    return;
  }
  
  console.log(`Found ${largeImages.length} large images to optimize:\n`);
  
  for (const image of largeImages) {
    await optimizeImage(image);
    console.log('');
  }
  
  console.log('Done! Original images have been backed up with .original extension');
}

main().catch(console.error);