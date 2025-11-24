'use client'

import { useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronsUpDown } from 'fumadocs-ui/internal/icons'
import { cn } from 'fumadocs-ui/utils/cn'
import { isActive } from 'fumadocs-ui/utils/is-active'
import { useSidebar } from 'fumadocs-ui/contexts/sidebar'
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover'
import { type Option } from 'fumadocs-ui/components/layout/root-toggle'
import { getSmartNavigationUrl, parseDocsPath } from '@/lib/navigation-utils'

interface SmartOption extends Option {
  smartUrl?: string
}

interface SmartRootToggleProps {
  options: Option[]
  placeholder?: React.ReactNode
  className?: string
}

/**
 * Smart Root Toggle that preserves current page path when switching between SDK sections
 */
export function SmartRootToggle({ options, placeholder, ...props }: SmartRootToggleProps) {
  const [open, setOpen] = useState(false)
  const { closeOnRedirect } = useSidebar()
  const pathname = usePathname()

  // Find the currently selected root folder option
  const selected = useMemo(() => {
    return options.findLast((item) => 
      item.urls
        ? item.urls.has(pathname.endsWith('/') ? pathname.slice(0, -1) : pathname)
        : isActive(item.url, pathname, true)
    )
  }, [options, pathname])

  // Generate smart navigation options
  const smartOptions = useMemo(() => {
    return options.map(option => {
      // Extract the SDK name from the original URL
      // The URLs are like "/ios", "/android", "/react-native", etc. not "/docs/ios"
      const sdkMatch = option.url.match(/^\/([\w-]+)/)
      if (!sdkMatch) return option
      
      const targetSdk = sdkMatch[1] as any
      const smartUrl = getSmartNavigationUrl(targetSdk, pathname)
      
      return {
        ...option,
        smartUrl
      } as SmartOption
    })
  }, [options, pathname])
  

  const onClick = () => {
    closeOnRedirect.current = false
    setOpen(false)
  }

  const item = selected ? <Item {...selected} /> : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {item ? (
        <PopoverTrigger 
          {...props} 
          className={cn(
            'flex items-center gap-2.5 rounded-lg pe-2 hover:text-fd-accent-foreground', 
            props.className
          )}
        >
          {item}
          <ChevronsUpDown className="size-4 text-fd-muted-foreground" />
        </PopoverTrigger>
      ) : null}
      <PopoverContent className="w-(--radix-popover-trigger-width) overflow-hidden p-0">
        {smartOptions.map((item) => (
          <Link
            key={item.url}
            href={(item as SmartOption).smartUrl || item.url}
            onClick={onClick}
            {...item.props}
            className={cn(
              'flex w-full flex-row items-center gap-2 px-2 py-1.5',
              selected === item
                ? 'bg-fd-accent text-fd-accent-foreground'
                : 'hover:bg-fd-accent/50',
              item.props?.className
            )}
          >
            <Item {...item} />
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Individual item component (copied from Fumadocs)
 */
function Item(props: Option) {
  return (
    <>
      {props.icon}
      <div className="flex-1 text-start">
        <p className="text-[15px] font-medium md:text-sm">{props.title}</p>
        {props.description ? (
          <p className="text-sm text-fd-muted-foreground md:text-xs">
            {props.description}
          </p>
        ) : null}
      </div>
    </>
  )
}