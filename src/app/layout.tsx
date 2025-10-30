import './global.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { SearchDialogWrapper as SearchDialog } from '../components/SearchDialog';
import { GlobalScripts } from '../components/GlobalScripts';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.className} dark`} suppressHydrationWarning>
      <head>
        <GlobalScripts location="head" />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          search={{
            SearchDialog,
          }}
          theme={{
            enabled: false
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
