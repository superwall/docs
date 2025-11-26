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

// 1) Configure your plugins once
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
const OUT     = path.resolve(process.cwd(), 'public')
const BASEURL = 'https://superwall.com/docs'

// 2) Recursively gather all .mdx files
async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(e => {
    const res = path.join(dir, e.name)
    return e.isDirectory() ? walk(res) : res.endsWith('.mdx') ? [res] : []
  }))
  return Array.prototype.concat(...files)
}

// 3) Filters to mirror your assembleLLM.ts logic
const filters = [
  { name: 'all',      suffix: '', readableName: 'Superwall' },
  { name: 'ios',      suffix: '-ios', readableName: 'Superwall iOS SDK' },
  { name: 'expo',     suffix: '-expo', readableName: 'Superwall Expo SDK' },
  { name: 'android',  suffix: '-android', readableName: 'Superwall Android SDK' },
  { name: 'flutter',  suffix: '-flutter', readableName: 'Superwall Flutter SDK' },
  { name: 'react-native', suffix: '-react-native', readableName: 'Superwall React Native SDK (Deprecated)' },
  { name: 'integrations', suffix: '-integrations', readableName: 'Superwall Integrations' },
  { name: 'web-checkout', suffix: '-web-checkout', readableName: 'Superwall Web Checkout' },
  { name: 'dashboard', suffix: '-dashboard', readableName: 'Superwall Dashboard' }
]

// 4) Main script
async function main() {
  await fs.mkdir(OUT, { recursive: true })
  const allFiles = await walk(CONTENT)
  const interactive = Boolean(process.stdout.isTTY)
  const summaries: Array<{ name: string; count: number }> = []

  // Calculate total files across all filters for cumulative progress
  const totalFiles = filters.reduce((sum, { name }) => {
    const subset = name === 'all'
      ? allFiles
      : allFiles.filter(fp => {
          const rel = path.relative(CONTENT, fp).replace(/\\/g, '/')
          return rel.startsWith(name)
        })
    return sum + subset.length
  }, 0)

  // Create a single cumulative progress bar
  const progress = createProgressBar('LLM generation', totalFiles)

  for (const { name, suffix, readableName } of filters) {
    // apply your folder logic; e.g. filePath.includes('/ios/')
    const subset = name === 'all'
      ? allFiles
      : allFiles.filter(fp => {
          const rel = path.relative(CONTENT, fp).replace(/\\/g, '/')
          return rel.startsWith(name)
        })

    // build full and index
    const fullDocs: string[]  = []
    const indexDocs: string[] = [`# ${readableName}\n\n## Docs\n`]

    for (const filePath of subset) {
      const raw    = await fs.readFile(filePath, 'utf8')
      const { data, content } = matter(raw)  // extracts front-matter
      const vfile  = await processor.process({ path: filePath, value: content })
      const text   = String(vfile)
      const url    = BASEURL + '/' + path.relative(CONTENT, filePath).replace(/\.mdx$/, '')
      fullDocs.push(
        `# ${data.title}\n` +
        `Source: ${url}\n\n` +
        `${data.description}\n\n` +
        text
      )
      indexDocs.push(
        `- [${data.title}](${url}): ${data.description}`
      )
      progress?.increment()
    }

    // write out
    await fs.writeFile(path.join(OUT, `llms-full${suffix}.txt`), fullDocs.join('\n\n---\n\n'), 'utf8')
    await fs.writeFile(path.join(OUT, `llms${suffix}.txt`), indexDocs.join('\n') + '\n\n## Optional\n\n- [GitHub](https://github.com/superwall)\n- [Twitter](https://twitter.com/superwall)\n- [Blog](https://superwall.com/blog)\n', 'utf8')
    summaries.push({ name, count: subset.length })

    if (!interactive) {
      console.log(`✓ Generated llms-full${suffix}.txt & llms${suffix}.txt (${subset.length} files)`)
    }
  }

  progress?.stop()

  if (interactive) {
    const totalDocs = allFiles.length
    const variantCount = summaries.length
    console.log(`✓ Generated LLM bundles (${variantCount} variants, ${totalDocs} docs)`)
  }
}

main()
  .catch(err => {
    console.error('❌ Error generating LLM files:')
    console.error(err.stack || err)
    process.exit(1)
  })