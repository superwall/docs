import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import glob from 'fast-glob';

const MAX_WIDTH = 1920;
const QUALITY = 85;

interface ConversionResult {
  original: string;
  webp: string;
  originalSize: number;
  webpSize: number;
  width: number;
  height: number;
}

async function convertImageToWebP(imagePath: string): Promise<ConversionResult | null> {
  try {
    const ext = path.extname(imagePath).toLowerCase();
    
    // Skip if already webp or if it's an SVG/GIF
    if (ext === '.webp' || ext === '.svg' || ext === '.gif') {
      return null;
    }
    
    // Skip backup files
    if (imagePath.includes('.original.')) {
      return null;
    }
    
    const dir = path.dirname(imagePath);
    const basename = path.basename(imagePath, ext);
    const webpPath = path.join(dir, `${basename}.webp`);
    
    // Get original image metadata and stats
    const metadata = await sharp(imagePath).metadata();
    const stats = await fs.stat(imagePath);
    
    if (!metadata.width || !metadata.height) {
      console.log(`Skipping ${imagePath} - could not read dimensions`);
      return null;
    }
    
    // Determine target dimensions
    let targetWidth = metadata.width;
    let targetHeight = metadata.height;
    
    if (metadata.width > MAX_WIDTH) {
      const aspectRatio = metadata.height / metadata.width;
      targetWidth = MAX_WIDTH;
      targetHeight = Math.round(MAX_WIDTH * aspectRatio);
    }
    
    // Convert to WebP with resizing if needed
    await sharp(imagePath)
      .resize(targetWidth, targetHeight, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .webp({ quality: QUALITY })
      .toFile(webpPath);
    
    const webpStats = await fs.stat(webpPath);
    
    return {
      original: imagePath,
      webp: webpPath,
      originalSize: stats.size,
      webpSize: webpStats.size,
      width: targetWidth,
      height: targetHeight
    };
    
  } catch (error) {
    console.error(`Error converting ${imagePath}:`, error);
    return null;
  }
}

async function findAllImages(): Promise<string[]> {
  const patterns = [
    'public/images/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}',
    'content/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}'
  ];
  
  const images = await glob(patterns, {
    absolute: true,
    ignore: ['**/*.original.*', '**/node_modules/**']
  });
  
  return images;
}

async function updateMDXReferences(oldPath: string, newPath: string) {
  // Get relative paths for MDX files
  const oldRelative = oldPath.replace(process.cwd() + '/public', '');
  const newRelative = newPath.replace(process.cwd() + '/public', '').replace(/\\/g, '/');
  
  // Find all MDX files
  const mdxFiles = await glob('content/**/*.{md,mdx}', {
    absolute: true
  });
  
  let updatedFiles = 0;
  
  for (const mdxFile of mdxFiles) {
    try {
      let content = await fs.readFile(mdxFile, 'utf-8');
      const originalContent = content;
      
      // Replace image references
      const oldFilename = path.basename(oldRelative);
      const newFilename = path.basename(newRelative);
      
      // Replace various patterns
      content = content.replace(
        new RegExp(oldFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        newFilename
      );
      
      if (content !== originalContent) {
        await fs.writeFile(mdxFile, content, 'utf-8');
        updatedFiles++;
      }
    } catch (error) {
      console.error(`Error updating ${mdxFile}:`, error);
    }
  }
  
  return updatedFiles;
}

async function main() {
  console.log('Converting images to WebP format...\n');
  
  const images = await findAllImages();
  console.log(`Found ${images.length} images to process\n`);
  
  const results: ConversionResult[] = [];
  let totalOriginalSize = 0;
  let totalWebPSize = 0;
  
  for (const imagePath of images) {
    const result = await convertImageToWebP(imagePath);
    
    if (result) {
      results.push(result);
      totalOriginalSize += result.originalSize;
      totalWebPSize += result.webpSize;
      
      const sizeSaved = ((result.originalSize - result.webpSize) / 1024).toFixed(1);
      const percentage = ((1 - result.webpSize / result.originalSize) * 100).toFixed(1);
      
      console.log(`✓ Converted ${path.basename(result.original)}:`);
      console.log(`  Dimensions: ${result.width}x${result.height}`);
      console.log(`  Original: ${(result.originalSize / 1024).toFixed(1)}KB`);
      console.log(`  WebP: ${(result.webpSize / 1024).toFixed(1)}KB`);
      console.log(`  Saved: ${sizeSaved}KB (${percentage}%)\n`);
    }
  }
  
  if (results.length === 0) {
    console.log('No images to convert!');
    return;
  }
  
  console.log('Updating MDX references...\n');
  
  let totalUpdatedFiles = 0;
  for (const result of results) {
    const updated = await updateMDXReferences(result.original, result.webp);
    totalUpdatedFiles += updated;
  }
  
  console.log(`\nConversion Summary:`);
  console.log(`- Converted ${results.length} images to WebP`);
  console.log(`- Updated ${totalUpdatedFiles} MDX file references`);
  console.log(`- Total size before: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`- Total size after: ${(totalWebPSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`- Total saved: ${((totalOriginalSize - totalWebPSize) / 1024 / 1024).toFixed(2)}MB`);
  
  console.log('\nRemoving original image files...');
  
  // Ask for confirmation before deleting
  if (process.argv.includes('--delete-originals')) {
    for (const result of results) {
      try {
        await fs.unlink(result.original);
      } catch (error) {
        console.error(`Error deleting ${result.original}:`, error);
      }
    }
    console.log('✓ Original files removed');
  } else {
    console.log('\nTo remove original files, run with --delete-originals flag');
    console.log('Example: bun run convert:webp -- --delete-originals');
  }
}

main().catch(console.error);