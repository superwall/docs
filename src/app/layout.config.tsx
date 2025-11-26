import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Activity, Book, BookOpen, Github, Twitter, HelpCircle, Sparkles, PanelsTopLeft, HammerIcon } from 'lucide-react';
import { DiscordIcon } from '@/components/DiscordIcon';

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <img
          width={150}
          src="/docs/resources/logo.svg"
          alt="Superwall"
        />
      </>
    ),
  },
  // githubUrl: 'https://github.com/superwall',
  links: [
    // {
    //   text: 'Documentation',
    //   url: 'https://docs-v2.superwall.com/docs',
    //   active: 'nested-url',
    //   icon: <BookOpen />,
    // },
    {
      text: 'Ask AI',
      url: '/ai',
      active: 'none',
      icon: <Sparkles />,
    },
    {
      text: 'Help Center',
      url: 'https://support.superwall.com',
      active: 'none',
      icon: <BookOpen />,
    },
    {
      text: 'Support',
      url: '/support',
      active: 'none',
      icon: <HelpCircle />,
    },
    // {
    //   text: 'Dashboard Docs',
    //   url: '/dashboard',
    //   active: 'none',
    //   icon: <PanelsTopLeft />,
    // },
    // {
    //   text: 'SDK Docs',
    //   url: '/sdk/home',
    //   active: 'none',
    //   icon: <HammerIcon />,
    // }
    // {
    //   text: 'Status',
    //   url: 'https://status.superwall.com',
    //   active: 'none',
    //   icon: <Activity />,
    // },
    // {
    //   text: 'GitHub',
    //   url: 'https://github.com/superwall',
    //   active: 'none',
    //   icon: <Github />,
    // },
    // {
    //   text: 'Twitter',
    //   url: 'https://twitter.com/superwall',
    //   active: 'none',
    //   icon: <Twitter />,
    // },
    // {
    //   text: 'Blog',
    //   url: 'https://superwall.com/blog',
    //   active: 'none',
    //   icon: <Book />,
    // },
  ],
  themeSwitch: { enabled: false },
};
