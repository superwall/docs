import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import { Tab, Tabs } from "fumadocs-ui/components/tabs"
import Link from "next/link"
import * as Lucide from "lucide-react"
import { ArrowUpRight } from "lucide-react"
import { AlertCircle, Lightbulb, Info as InfoCircle, AlertTriangle, Check as CheckIcon } from "lucide-react"
import React from "react"
import { Accordion, Accordions as AccordionGroup } from 'fumadocs-ui/components/accordion';
import { ImageZoom as Frame } from 'fumadocs-ui/components/image-zoom'
import { SDKContent } from './components/SDKContent'
import { GithubInfo as GithubInfoComponent } from 'fumadocs-ui/components/github-info';
import { WhenLoggedIn, WhenLoggedOut, LoginStatusProvider, BasedOnAuth, LoggedIn, LoggedOut } from './components/LoginStatusContext';

// We'll add custom components here

// const CodeGroup = ({ children }: { children: React.ReactNode }) => {
//   return <div className="flex flex-col gap-4">{children}</div>;
// };

// Shared Callout component
const Callout = ({
  icon,
  borderColor,
  bgColor,
  textColor,
  children,
}: {
  icon: React.ReactNode
  borderColor: string
  bgColor: string
  textColor: string
  children: React.ReactNode
}) => {
  return (
    <div className={`flex items-start gap-4 rounded-[var(--radius-lg)] border ${borderColor} ${bgColor} py-3 px-4 my-4`}>
      <span className={`mt-0.5 w-4`}>
        {icon}
      </span>
      <span className={`text-sm prose min-w-0 w-full  ${textColor}`}>
        {children}
      </span>
    </div>
  )
}

const Note = ({ children }: { children: React.ReactNode }) => {
  return (
    <Callout
      icon={
        <AlertCircle width="14" height="14" className="w-4 h-4 text-sky-500" />
      }
      borderColor="border-sky-500/30"
      bgColor="bg-sky-500/10"
      textColor="text-sky-200"
    >
      {children}
    </Callout>
  )
}

const Tip = ({ children }: { children: React.ReactNode }) => {
  return (
    <Callout
      icon={
        <Lightbulb width="14" height="14" className="w-4 h-4 text-emerald-500" />
      }
      borderColor="border-emerald-400/30"
      bgColor="bg-emerald-400/10"
      textColor="text-emerald-200"
    >
      {children}
    </Callout>
  )
}

const Info = ({ children }: { children: React.ReactNode }) => {
  return (
    <Callout
      icon={
        <InfoCircle width="14" height="14" className="w-4 h-4 text-zinc-300" />
      }
      borderColor="border-zinc-500/30"
      bgColor="bg-zinc-500/10"
      textColor="text-zinc-300"
    >
      {children}
    </Callout>
  )
}

const Warning = ({ children }: { children: React.ReactNode }) => {
  return (
    <Callout
      icon={
        <AlertTriangle width="14" height="14" className="w-4 h-4 text-amber-300/80" />
      }
      borderColor="border-amber-500/30"
      bgColor="bg-amber-500/10"
      textColor="text-amber-200"
    >
      {children}
    </Callout>
  )
}

const Check = ({ children }: { children: React.ReactNode }) => {
  return (
    <Callout
      icon={
        <CheckIcon width="14" height="14" className="w-4 h-4 text-emerald-500" />
      }
      borderColor="border-emerald-400/30"
      bgColor="bg-emerald-400/10"
      textColor="text-emerald-200"
    >
      {children}
    </Callout>
  )
}

const Card = ({
  title,
  icon,
  iconType,
  href,
  children,
}: {
  title: string
  icon?: string | React.ReactNode
  iconType?: string // kept for API parity, currently unused
  href: string
  children: React.ReactNode
}) => {
  // Attempt to find a matching Lucide icon or use provided ReactNode icon
  let RenderedIcon: React.ReactNode = null;

  if (icon) {
    if (typeof icon === 'string') {
      const LucideIcon =
        (Lucide as Record<string, any>)[
          icon.charAt(0).toUpperCase() + icon.slice(1)
        ];
      if (LucideIcon) {
        RenderedIcon = (
          <LucideIcon
            size={24}
            strokeWidth={2}
            className="h-6 w-6 text-teal-300"
          />
        );
      }
    } else if (React.isValidElement(icon)) {
      RenderedIcon = React.cloneElement(icon as any, {
        className: 'h-6 w-6 text-teal-300',
      });
    }
  }

  const isExternal = /^https?:\/\//.test(href)
  const Wrapper: any = isExternal ? "a" : Link

  return (
    <Wrapper
      href={href}
      className="px-5 py-4 relative flex flex-col rounded-[var(--radius-lg)] border border-white/10 transition-colors hover:border-white/20 no-underline"
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {RenderedIcon}
      <div className="flex flex-col gap-2">
        <h2 className="not-prose font-semibold text-base text-gray-800 dark:text-white mt-4">{title}</h2>
        <p className="prose mt-1 font-normal text-sm leading-6 text-gray-600 dark:text-gray-400 mb-0">{children}</p>
      </div>
      {isExternal && (
        <ArrowUpRight
          size={24}
          strokeWidth={2}
          className="absolute top-4 right-4 text-zinc-500 w-4 h-4"
        />
      )}
    </Wrapper>
  )
}

const CardGroup = ({
  children,
  cols = 1,
}: {
  children: React.ReactNode
  cols?: number
}) => {
  const colClass =
    cols === 3
      ? "sm:grid-cols-3"
      : cols === 2
      ? "sm:grid-cols-2"
      : "sm:grid-cols-1"

  return <div className={`grid gap-6 ${colClass}`}>{children}</div>
}

const Step = ({
  title,
  children,
  index,
  isLast,
}: {
  title: string
  children: React.ReactNode
  index?: number
  isLast?: boolean
}) => {
  return (
    <li className="relative flex flex-col gap-1 pl-10 pr-px">
      {/* number badge */}
      <span className="absolute left-0 top-0 size-6 shrink-0 rounded-full bg-gray-50 dark:bg-white/10 text-xs text-gray-900 dark:text-gray-50 font-semibold flex items-center justify-center">
        {index}
      </span>

      {/* vertical line */}
      {!isLast && (
        <span className="absolute left-3 top-8 -z-10 h-full w-px bg-white/10" />
      )}

      {/* content */}
      <p className="mt-0 font-semibold prose text-gray-200">{title}</p>
      <div className="prose prose-invert m-0 text-gray-400">{children}</div>
    </li>
  )
}

const Steps = ({ children }: { children: React.ReactNode }) => {
  const items = React.Children.toArray(children)

  return (
    <ol className="flex flex-col gap-6">
      {items.map((child, idx) =>
        React.isValidElement(child)
          ? React.cloneElement(child as any, {
              index: idx + 1,
              isLast: idx === items.length - 1,
            })
          : child,
      )}
    </ol>
  )
}

const GithubInfo = ({ owner, repo }: { owner: string, repo: string }) => {
  return <GithubInfoComponent owner={owner} repo={repo} />
}

const ParamTable = (props: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="fd-param w-full border-collapse" {...props} />
);

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
    // CodeGroup,
    Info,
    Note,
    Tabs,
    Tab,
    Frame,
    Accordion,
    Tip,
    AccordionGroup,
    Step,
    Card,
    CardGroup,
    Steps,
    Check,
    Warning,
    SDKContent,
    GithubInfo,
    ParamTable,
    WhenLoggedIn,
    WhenLoggedOut,
    LoginStatusProvider,
    BasedOnAuth,
    LoggedIn,
    LoggedOut,
  } as MDXComponents
}
