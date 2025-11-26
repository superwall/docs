import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkMdx from 'remark-mdx'
import remarkGfm from 'remark-gfm'
import remarkTabsSyntax from "../plugins/remark-tabs-syntax"
import remarkCodeGroupToTabs from "../plugins/remark-codegroup-to-tabs"
import remarkCodeLanguage from "../plugins/remark-code-language"
import remarkImagePaths from "../plugins/remark-image-paths"
import remarkFollowExport from "../plugins/remark-follow-export"
import remarkDirective from "remark-directive"
import { remarkInclude } from 'fumadocs-mdx/config';
import remarkSdkFilter from "../plugins/remark-sdk-filter"
import { createProgressBar } from './utils/progress'

// Configure the processor with all plugins
const processor = remark()
  .use(remarkImagePaths as any)
  .use(remarkFollowExport as any)
  .use(remarkMdx as any)
  .use(remarkInclude as any)
  .use(remarkGfm as any)
  .use(remarkDirective as any)
  .use(remarkTabsSyntax as any)
  .use(remarkCodeLanguage as any)
  .use(remarkCodeGroupToTabs as any)
  .use(remarkSdkFilter as any)

const CONTENT = path.resolve(process.cwd(), 'content/docs')
const OUT = path.resolve(process.cwd(), 'public')
const BASEURL = 'https://superwall.com/docs'

// Recursively gather all .mdx files
async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(e => {
    const res = path.join(dir, e.name)
    return e.isDirectory() ? walk(res) : res.endsWith('.mdx') ? [res] : []
  }))
  return Array.prototype.concat(...files)
}

// Generate relative path for URL
function getRelativePath(filePath: string): string {
  return path.relative(CONTENT, filePath).replace(/\.mdx$/, '').replace(/\\/g, '/')
}

// Main script
async function main() {
  await fs.mkdir(OUT, { recursive: true })
  const allFiles = await walk(CONTENT)
  const interactive = Boolean(process.stdout.isTTY)
  const progress = createProgressBar('MD export', allFiles.length)

  for (const filePath of allFiles) {
    try {
      const raw = await fs.readFile(filePath, 'utf8')
      const { data, content } = matter(raw)  // extracts front-matter
      const vfile = await processor.process({ path: filePath, value: content })
      const processedContent = String(vfile)
      
      // Clean up the content (remove frontmatter delimiters)
      const cleanedContent = processedContent.replace(/\*\*\*[\s\S]*?^-{3,}\n/m, '')
      
      const relativePath = getRelativePath(filePath)
      const url = `${BASEURL}/${relativePath}`
      
      // Create the markdown text
      const text = `# ${data.title}
Source: ${url}

${data.description ? data.description + '\n\n' : ''}${cleanedContent}`
      
      // Create directory structure for the output file
      const outputPath = path.join(OUT, relativePath + '.md')
      await fs.mkdir(path.dirname(outputPath), { recursive: true })
      
      // Write the .md file
      await fs.writeFile(outputPath, text, 'utf8')
      
      progress?.increment()
      if (!interactive) {
        console.log(`✓ Generated ${relativePath}.md`)
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error)
    }
  }

  progress?.stop()

  if (interactive) {
    console.log(`✓ Exported ${allFiles.length} Markdown files`)
  }
}

main()
  .catch(err => {
    console.error('❌ Error generating MD files:')
    console.error(err.stack || err)
    process.exit(1)
  })