'use client';

import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { SmartRootToggle } from '@/components/SmartRootToggle';
import { SearchToggle } from 'fumadocs-ui/components/layout/search-toggle';
import { LargeSearchToggle } from 'fumadocs-ui/components/layout/search-toggle';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CustomSidebarFooter } from '@/components/CustomSidebarFooter';
import { useMemo } from 'react';
interface DocsLayoutWithDiscordProps {
  children: ReactNode;
  pageTree: any;
  tabs: any[];
}

export function DocsLayoutWithDiscord({ children, pageTree, tabs }: DocsLayoutWithDiscordProps) {
  return (
    <DocsLayout 
      tree={pageTree} 
      {...baseOptions}
      nav={{
        ...baseOptions.nav,
        children: (
          <>
            <div className="flex-1" />
            {/* Mobile Ask AI button */}
            <Link 
              href="/docs/ai" 
              className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-fd-accent hover:text-fd-accent-foreground md:hidden"
              aria-label="Ask AI"
            >
              <Sparkles className="size-5" />
            </Link>
            {/* Mobile search button in nav bar */}
            <SearchToggle className="md:hidden" />
            {/* Add more mobile nav buttons here if needed */}
          </>
        )
      }}
      sidebar={{
        tabs: false, // Disable default RootToggle
        banner: (
          <>
            {tabs.length > 0 && <SmartRootToggle options={tabs} />}
            {/* Desktop search in sidebar */}
            <LargeSearchToggle hideIfDisabled className="rounded-lg max-md:hidden" />
          </>
        ),
        footer: (
          <CustomSidebarFooter 
            i18n={baseOptions.i18n}
            themeSwitch={baseOptions.themeSwitch}
            githubUrl={baseOptions.githubUrl}
          />
        )
      }}
      searchToggle={{ enabled: false }} // Disable search in the default location
    >
      {children}
    </DocsLayout>
  );
}
