import Link from 'next/link'
import { cn } from 'fumadocs-ui/utils/cn'

type SdkLatestVersionProps = {
  version: string
  repoUrl: string
  className?: string
}

export function SdkLatestVersion({
  version,
  repoUrl,
  className,
}: SdkLatestVersionProps) {
  const trimmedRepo = repoUrl.replace(/\/$/, '')
  const releaseHref = `${trimmedRepo}/releases/tag/${encodeURIComponent(version)}`
  const displayVersion = version.startsWith('v') ? version : `v${version}`

  return (
    <Link
      href={releaseHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex w-full items-center text-base italic text-fd-muted-foreground opacity-50 no-underline transition-opacity hover:opacity-100',
        className,
      )}
    >
      Last updated for {displayVersion}
    </Link>
  )
}

