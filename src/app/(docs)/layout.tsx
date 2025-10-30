import type { ReactNode } from 'react';
import { DocsLayoutWithDiscord } from '@/components/DocsLayoutWithDiscord';
import { source } from '@/lib/source';
import { getSidebarTabs } from 'fumadocs-ui/utils/get-sidebar-tabs';
import type { SidebarTab } from 'fumadocs-ui/utils/get-sidebar-tabs';

export default function Layout({ children }: { children: ReactNode }) {
  const tabs = getSidebarTabs(source.pageTree, {
    transform: (option: SidebarTab) => {
      // Ensure icon is properly sized if it exists
      // option.icon might be a string (icon name) that needs to be converted to React element
      const icon = (option as any).icon;
      if (icon && typeof icon === 'string') {
        const iconElement = (source as any).icon(icon, { className: 'size-4 text-current' });
        return {
          ...option,
          icon: iconElement,
        };
      }
      return option;
    },
  }) ?? [];

  return (
    <DocsLayoutWithDiscord pageTree={source.pageTree} tabs={tabs}>
      {children}
    </DocsLayoutWithDiscord>
  );
}
