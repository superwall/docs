import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface TitleMap {
  [filepath: string]: string;
}

/**
 * Extract title from MDX content
 * Priority: frontmatter title > first # heading > filename
 */
function extractTitle(content: string, filepath: string): string {
  // Try frontmatter title first
  const frontmatterMatch = content.match(/^---\s*\n.*?title:\s*["'](.+?)["']/ms);
  if (frontmatterMatch) {
    return frontmatterMatch[1];
  }

  // Try first markdown heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }

  // Fallback to filename
  const filename = path.basename(filepath, path.extname(filepath));
  return filename
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate a map of relative file paths to their titles
 */
async function generateTitleMap() {
  const contentDir = path.join(process.cwd(), 'content/docs');
  const outputFile = path.join(process.cwd(), 'src/lib/title-map.json');

  console.log('🔍 Scanning for MDX files in:', contentDir);

  // Find all .mdx and .md files
  const files = await glob('**/*.{md,mdx}', {
    cwd: contentDir,
    absolute: false,
  });

  console.log(`📄 Found ${files.length} markdown files`);

  const titleMap: TitleMap = {};

  for (const file of files) {
    const fullPath = path.join(contentDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const title = extractTitle(content, file);

    // Store with original extension for matching with RAG responses
    titleMap[file] = title;

    // Also store without extension (for .md vs .mdx matching)
    const withoutExt = file.replace(/\.mdx?$/, '') + '.md';
    if (withoutExt !== file) {
      titleMap[withoutExt] = title;
    }
  }

  console.log(`✅ Generated title map with ${Object.keys(titleMap).length} entries`);

  // Create output directory if it doesn't exist
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the map to a JSON file
  fs.writeFileSync(outputFile, JSON.stringify(titleMap, null, 2));

  console.log(`💾 Saved title map to: ${outputFile}`);
}

// Run the script
generateTitleMap().catch(error => {
  console.error('❌ Error generating title map:', error);
  process.exit(1);
});
