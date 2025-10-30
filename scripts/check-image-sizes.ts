import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const MAX_WIDTH = 1920;
const MAX_FILE_SIZE_KB = 500;

interface OversizedImage {
  path: string;
  width: number;
  height: number;
  sizeKB: number;
}

async function checkImage(imagePath: string): Promise<OversizedImage | null> {
  try {
    const stats = await fs.stat(imagePath);
    const sizeKB = stats.size / 1024;
    
    // Check file size
    if (sizeKB <= MAX_FILE_SIZE_KB) {
      return null;
    }
    
    // Check dimensions
    const metadata = await sharp(imagePath).metadata();
    const { width, height } = metadata;
    
    if (!width || !height) {
      return null;
    }
    
    if (width > MAX_WIDTH) {
      return {
        path: imagePath,
        width,
        height,
        sizeKB: Math.round(sizeKB)
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking ${imagePath}:`, error);
    return null;
  }
}

async function findAllImages(): Promise<string[]> {
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  const files = await fs.readdir(imagesDir, { recursive: true });
  
  return files
    .filter(file => typeof file === 'string')
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .filter(file => !file.includes('.original.')) // Skip backup files
    .filter(file => !path.basename(file).startsWith('.')) // Skip hidden files
    .map(file => path.join(imagesDir, file));
}

async function main() {
  console.log('Checking image sizes...\n');
  
  const images = await findAllImages();
  const oversizedImages: OversizedImage[] = [];
  
  for (const imagePath of images) {
    const result = await checkImage(imagePath);
    if (result) {
      oversizedImages.push(result);
    }
  }
  
  if (oversizedImages.length === 0) {
    console.log('✓ All images are optimized!');
    process.exit(0);
  }
  
  console.log(`Found ${oversizedImages.length} oversized images:\n`);
  
  for (const img of oversizedImages) {
    const relativePath = path.relative(process.cwd(), img.path);
    console.log(`  ${relativePath}`);
    console.log(`    Dimensions: ${img.width}x${img.height}`);
    console.log(`    File size: ${img.sizeKB}KB\n`);
  }
  
  console.log('\nTo optimize these images, run:');
  console.log('  bun run optimize:images\n');
  
  // Exit with error code to fail the build
  if (process.env.CI === 'true') {
    console.error('Build failed: Oversized images detected');
    process.exit(1);
  }
}

main().catch(console.error);