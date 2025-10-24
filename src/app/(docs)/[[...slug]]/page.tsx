import { source } from "@/lib/source"
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from "fumadocs-ui/page"
import { notFound, redirect } from "next/navigation"
// import { createRelativeLink } from "fumadocs-ui/mdx"
import { getMDXComponents } from "@/mdx-components"
import { Rate } from "@/components/rate"
import { CopyPageButton } from "@/components/CopyPageButton"

const ASK_AI_SLUG = 'ai';

function isAskAISlug(slug?: string[]) {
  return Array.isArray(slug) && slug.length === 1 && slug[0] === ASK_AI_SLUG;
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params

  if (isAskAISlug(params.slug)) {
    redirect('/?ai=fullscreen')
  }

  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDXContent = page.data.body
  // const A = createRelativeLink(source, page);

  const hideRate = params.slug?.some(segment => segment === 'ai');

  // Get current path for copy button
  const currentPath = params.slug ? `/${params.slug.join('/')}` : '/';

  const disabledPages = ['/home', '/docs/support', '/ios', '/android', '/flutter', '/expo', '/dashboard'];
  const shouldDisableButton = disabledPages.includes(currentPath);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <DocsTitle className="mb-0">{page.data.title}</DocsTitle>
        <CopyPageButton 
          disabled={shouldDisableButton}
          currentPath={currentPath}
        />
      </div>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            // a: (props) => <A {...(props as any)} />,
          })}
        />
      </DocsBody>
      {!hideRate && <Rate />}
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params
  if (isAskAISlug(params.slug)) {
    return {
      title: 'Ask AI',
      description: 'Get instant answers to your questions about Superwall.',
    }
  }
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
