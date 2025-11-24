import { source } from "@/lib/source"
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from "fumadocs-ui/page"
import { notFound } from "next/navigation"
// import { createRelativeLink } from "fumadocs-ui/mdx"
import { getMDXComponents } from "@/mdx-components"
import { createElement } from "react"
import { Rate } from "@/components/rate"
import { CopyPageButton } from "@/components/CopyPageButton"

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDXContent = page.data.body
  // const A = createRelativeLink(source, page);

  const hideRate = params.slug?.some(segment => segment === 'ai');

  // Get current path for copy button
  const currentPath = params.slug ? `/${params.slug.join('/')}` : '/';

  const disabledPages = ['/home', '/support', '/ios', '/android', '/flutter', '/expo', '/react-native', '/dashboard'];
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
      {!hideRate && (
        <Rate 
          githubPath={(page as any).file?.path || (page as any).path || (params.slug ? params.slug.join('/') : 'home')}
        />
      )}
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}
