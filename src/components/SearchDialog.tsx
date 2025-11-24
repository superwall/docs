'use client';

// modified copy of fumadocs search dialog

import {
  FileText,
  Hash,
  Loader2 as LoaderCircle,
  Search as SearchIcon,
  Sparkles,
  CornerDownLeft,
  Text,
  ChevronDown,
} from 'lucide-react';
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { cn } from 'fumadocs-ui/utils/cn';
import { useSidebar } from 'fumadocs-ui/contexts/sidebar';

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from '@radix-ui/react-dialog';
import type { SortedResult } from 'fumadocs-core/server';
import { cva } from 'class-variance-authority';
import { useEffectEvent } from 'fumadocs-core/utils/use-effect-event';
import { createContext } from 'fumadocs-core/framework';
import { useRouter } from 'next/navigation';
import { useDocsSearch } from 'fumadocs-core/search/client';

// Search debounce delay in milliseconds - increase to reduce API calls
const SEARCH_DEBOUNCE_MS = 500;

export type SearchLink = [name: string, href: string];

type ReactSortedResult = Omit<SortedResult, 'content'> & {
  external?: boolean;
  content: ReactNode;
  tag?: string;
};

export interface TagItem {
  name: string;
  value: string;
}

export interface SharedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /**
   * Custom links to be displayed if search is empty
   */
  links?: SearchLink[];
}

interface SearchDialogProps extends SharedProps {
  search: string;
  onSearchChange: (v: string) => void;
  isLoading?: boolean;
  isDebouncing?: boolean;
  hideResults?: boolean;
  results: ReactSortedResult[] | 'empty';

  footer?: ReactNode;
}

const SDK_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'expo', label: 'Expo' },
  { value: 'flutter', label: 'Flutter' },
  { value: 'react-native', label: 'React Native (Deprecated)' },
] as const;

export function SearchDialogWrapper(props: SharedProps) {
  // Use same localStorage key as AskAI
  const [selectedSdk, setSelectedSdk] = useLocalStorage<string>('superwall-ai-selected-sdk', '');
  const [isDebouncing, setIsDebouncing] = useState(false);

  const { search, setSearch, query } = useDocsSearch({
    type: 'fetch',
    api: '/docs/api/search'
  }, undefined, selectedSdk || undefined, SEARCH_DEBOUNCE_MS);

  // Track debouncing state in development
  useEffect(() => {
    if (search.length > 0) {
      setIsDebouncing(true);
      const timer = setTimeout(() => {
        setIsDebouncing(false);
      }, SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(timer);
    } else {
      setIsDebouncing(false);
    }
  }, [search]);

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && query.data && query.data !== 'empty') {
      console.log(`[SearchDialog] Received ${Array.isArray(query.data) ? query.data.length : 0} results for query: "${search}"`);
    }
  }, [query.data, search]);

  return (
    <SearchDialogWrapperInner
      {...props}
      search={search}
      onSearchChange={setSearch}
      results={query.data ?? 'empty'}
      isLoading={query.isLoading}
      isDebouncing={isDebouncing}
      selectedSdk={selectedSdk}
      onSdkChange={setSelectedSdk}
    />
  );
}

interface SearchDialogWrapperInnerProps extends SharedProps {
  search: string;
  onSearchChange: (v: string) => void;
  results: ReactSortedResult[] | 'empty';
  isLoading: boolean;
  isDebouncing: boolean;
  selectedSdk: string;
  onSdkChange: (sdk: string) => void;
}

function SearchDialogWrapperInner(props: SearchDialogWrapperInnerProps) {
  const { selectedSdk, onSdkChange, ...dialogProps } = props;
  const [showSdkDropdown, setShowSdkDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectSdk = (sdkValue: string) => {
    onSdkChange(sdkValue);
    setShowSdkDropdown(false);
  };

  const getSelectedSdk = () => {
    const found = SDK_OPTIONS.find(opt => opt.value === selectedSdk);
    return found || SDK_OPTIONS[0]; // Default to "None"
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSdkDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <SearchDialog
      {...dialogProps}
      sdkSelector={
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowSdkDropdown(!showSdkDropdown)}
            disabled={props.isLoading}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 text-xs border rounded bg-fd-background whitespace-nowrap cursor-pointer',
              'hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary',
              props.isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="text-xs text-fd-muted-foreground">SDK:</span>
            <span className="text-xs">{getSelectedSdk()?.label || 'None'}</span>
            <ChevronDown className={cn(
              "size-2.5 transition-transform",
              showSdkDropdown && "transform rotate-180"
            )} />
          </button>

          {showSdkDropdown && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-fd-popover border border-fd-border rounded shadow-lg z-50">
              {SDK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => selectSdk(option.value)}
                  className={cn(
                    "flex items-center w-full px-2 py-1.5 text-left text-xs hover:bg-fd-accent",
                    selectedSdk === option.value && "bg-fd-accent"
                  )}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full border mr-2",
                    selectedSdk === option.value
                      ? "bg-fd-primary border-fd-primary"
                      : "border-fd-border"
                  )} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}

// Add new type for AI prompt
interface AIPrompt {
  type: 'ai-prompt';
  id: 'ai-prompt';
  content: string;
}

export function SearchDialog({
  open,
  onOpenChange,
  footer,
  links = [],
  search: propSearch,
  onSearchChange: propOnSearchChange,
  isLoading: propIsLoading,
  isDebouncing: propIsDebouncing,
  results: propResults,
  sdkSelector,
}: SearchDialogProps & { sdkSelector?: ReactNode }) {
  const { text } = useI18n();
  const [active, setActive] = useState<string>();

  // Add default search functionality
  const { search: defaultSearch, setSearch: defaultSetSearch, query } = useDocsSearch({ type: 'fetch', api: '/docs/api/search' });

  // Use provided values or defaults
  const search = propSearch ?? defaultSearch;
  const onSearchChange = propOnSearchChange ?? defaultSetSearch;
  const isLoading = propIsLoading ?? query.isLoading;
  const isDebouncing = propIsDebouncing ?? false;
  const results = propResults ?? (query.data ?? 'empty');

  // Debounced search loading indicator
  const [showSearchLoading, setShowSearchLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const t = setTimeout(() => setShowSearchLoading(true), 200);
      return () => clearTimeout(t);
    }
    setShowSearchLoading(false);
  }, [isLoading]);

  // Default links if none provided
  const defaultLinks: SearchLink[] = [
    ['Welcome', '/docs'],
    ['SDK Installation', '/docs/sdk-installation/installation-overview'],
    ['Dashboard', '/docs/overview-metrics'],
    ['Web Checkout', '/docs/web-checkout-overview'],
  ];

  const displayLinks = links.length > 0 ? links : defaultLinks;

  // Add AI prompt to the items list
  const allItems = useMemo(() => {
    const items = results === 'empty'
      ? displayLinks.map(([name, link]) => ({
          type: 'page' as const,
          id: name,
          content: name,
          url: link,
        }))
      : results;

    // Show the AI prompt at the top
    const aiPrompt: AIPrompt = {
      type: 'ai-prompt',
      id: 'ai-prompt',
      content: 'Ask AI',
    };
    return [aiPrompt, ...items];
  }, [results, displayLinks]);

  // Handle AI redirect to AI page
  const { push } = useRouter();
  const handleAiSearch = () => {
    if (!search.trim()) return;

    const encodedQuery = encodeURIComponent(search.trim());
    onOpenChange(false); // Close search dialog
    push(`/ai?search=${encodedQuery}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-[state=closed]:animate-fd-fade-out data-[state=open]:animate-fd-fade-in" />
      <DialogContent
        aria-describedby={undefined}
        className="fixed left-1/2 top-[10vh] z-50 w-[98vw] max-w-screen-sm max-h-[80vh] -translate-x-1/2 rounded-lg border bg-fd-popover text-fd-popover-foreground shadow-lg overflow-y-auto data-[state=closed]:animate-fd-dialog-out data-[state=open]:animate-fd-dialog-in"
      >
        <DialogTitle className="hidden">{text.search}</DialogTitle>
        <div className="flex flex-row items-center gap-2 px-3">
          <LoadingIndicator isLoading={showSearchLoading} isDebouncing={isDebouncing && !isLoading} />
          <input
            value={search}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setActive(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (active === 'ai-prompt') {
                  handleAiSearch();
                }
              }
            }}
            placeholder={text.search}
            className="w-0 flex-1 bg-transparent py-3 text-base placeholder:text-fd-muted-foreground focus-visible:outline-none"
          />
          {sdkSelector}
          <button
            type="button"
            aria-label="Close Search"
            onClick={() => onOpenChange(false)}
            className="text-xs p-1.5 border border-fd-border rounded bg-fd-background hover:bg-fd-accent cursor-pointer"
          >
            Esc
          </button>
        </div>

        {allItems.length > 0 ? (
          <SearchResults
            active={active}
            onActiveChange={setActive}
            items={allItems}
            onSelect={() => onOpenChange(false)}
            onAiSearch={handleAiSearch}
          />
        ) : null}
        <div className="mt-auto flex flex-col border-t p-3 empty:hidden">
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const getIcon = (type: 'text' | 'heading' | 'page', isActive: boolean) => {
  const iconClass = type === 'page' && isActive
    ? 'size-4 text-[#74F8F0]'
    : 'size-4 text-fd-muted-foreground';

  switch (type) {
    case 'text':
      return <Text className={iconClass} />;
    case 'heading':
      return <Hash className={iconClass} />;
    case 'page':
      return <FileText className={iconClass} />;
  }
};

function SearchResults({
  items = [],
  active = items[0]?.id,
  onActiveChange,
  onSelect,
  onAiSearch,
  ...props
}: ComponentProps<'div'> & {
  active?: string;
  onActiveChange: (active: string | undefined) => void;
  items: (ReactSortedResult | AIPrompt)[];
  onSelect?: (value: string) => void;
  onAiSearch: () => void;
}) {
  const { text } = useI18n();
  const router = useRouter();
  const sidebar = useSidebar();

  const onOpen = ({ external, url }: ReactSortedResult) => {
    if (external) window.open(url, '_blank')?.focus();
    else router.push(url);
    onSelect?.(url);
    sidebar.setOpen(false);
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key == 'ArrowUp') {
      const idx = items.findIndex((item) => item.id === active);
      if (idx === -1) {
        onActiveChange(items[0]?.id);
      } else {
        onActiveChange(
          items[((e.key === 'ArrowDown' ? idx + 1 : idx - 1) % items.length)]
            ?.id,
        );
      }

      e.preventDefault();
    }

    if (e.key === 'Enter') {
      const selected = items.find((item) => item.id === active);

      if (selected) {
        if (selected.type === 'ai-prompt') {
          onAiSearch();
        } else {
          onOpen(selected as ReactSortedResult);
        }
      }
      e.preventDefault();
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [onKey]);

  return (
    <div
      {...props}
      className={cn(
        'flex flex-1 overflow-y-auto flex-col border-t p-2 min-h-[220px]',
        props.className,
      )}
    >
      {items.length === 0 ? (
        <div className="py-12 text-center text-sm">{text.searchNoResult}</div>
      ) : null}

      {items.map((item) => {
        if (item.type === 'ai-prompt') {
          return (
            <CommandItem
              key={item.id}
              active={active === item.id}
              onPointerMove={() => onActiveChange(item.id)}
              onClick={() => onAiSearch()}
            >
              <Sparkles
                className={
                  active === item.id
                    ? 'size-4 text-[#74F8F0]'
                    : 'size-4 text-fd-muted-foreground'
                }
              />
              <p className="font-medium">Ask AI</p>
              {active === item.id && (
                <CornerDownLeft className="size-3 text-fd-muted-foreground ml-auto" />
              )}
            </CommandItem>
          );
        }

        const resultItem = item as ReactSortedResult;
        const rootFolder = resultItem.tag || '';

        // Format root folder name for display
        const formatRootFolder = (folder: string) => {
          switch (folder) {
            case 'ios': return 'iOS';
            case 'android': return 'Android';
            case 'flutter': return 'Flutter';
            case 'expo': return 'Expo';
            case 'dashboard': return 'Dashboard';
            default: return folder ? folder.charAt(0).toUpperCase() + folder.slice(1) : '';
          }
        };

        return (
          <CommandItem
            key={item.id}
            active={active === item.id}
            onPointerMove={() => onActiveChange(item.id)}
            onClick={() => onOpen(item as ReactSortedResult)}
          >
            {item.type !== 'page' ? (
              <div
                role="none"
                className="ms-2 h-full min-h-10 w-px bg-fd-border"
              />
            ) : null}
            {getIcon(item.type, active === item.id)}
            {/* Show tag badge for SDK results - moved to left */}
            {item.type === 'page' && rootFolder && (
              <div className="flex items-center gap-1 shrink-0">
                <span className={cn(
                  "px-1.5 py-0.5 text-xs font-medium rounded",
                  active === item.id
                    ? "bg-white dark:bg-white/70 text-fd-accent dark:text-fd-accent border border-fd-border"
                    : "bg-fd-accent text-fd-accent-foreground"
                )}>
                  {formatRootFolder(rootFolder)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate">{item.content}</p>
            </div>
            {active === item.id && (
              <CornerDownLeft className="size-3 text-fd-muted-foreground ml-1" />
            )}
          </CommandItem>
        );
      })}
    </div>
  );
}

function LoadingIndicator({ isLoading, isDebouncing }: { isLoading: boolean; isDebouncing?: boolean }) {
  const isDev = process.env.NODE_ENV === 'development';
  const showDebugState = isDev && (isLoading || isDebouncing);

  return (
    <div className="flex items-center gap-2">
      <div className="relative size-4">
        <LoaderCircle
          className={cn(
            'absolute size-full animate-spin text-fd-primary transition-opacity',
            !isLoading && 'opacity-0',
          )}
        />
        <SearchIcon
          className={cn(
            'absolute size-full text-fd-muted-foreground transition-opacity',
            isLoading && 'opacity-0',
          )}
        />
      </div>
      {showDebugState && (
        <span className="text-[10px] text-fd-muted-foreground">
          {isLoading ? 'Searching...' : isDebouncing ? 'Debouncing...' : ''}
        </span>
      )}
    </div>
  );
}

function CommandItem({
  active = false,
  ...props
}: ComponentProps<'button'> & {
  active?: boolean;
}) {
  return (
    <button
      ref={useCallback(
        (element: HTMLButtonElement | null) => {
          if (active && element) {
            element.scrollIntoView({
              block: 'nearest',
            });
          }
        },
        [active],
      )}
      type="button"
      aria-selected={active}
      {...props}
      className={cn(
        'flex min-h-10 select-none cursor-pointer flex-row items-center gap-2.5 rounded-lg px-2 text-start text-sm',
        active && 'bg-fd-accent text-fd-accent-foreground',
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}

export interface TagsListProps extends ComponentProps<'div'> {
  tag?: string;
  onTagChange: (tag: string | undefined) => void;
  allowClear?: boolean;
}

const itemVariants = cva(
  'rounded-md border px-2 py-0.5 text-xs font-medium text-fd-muted-foreground transition-colors',
  {
    variants: {
      active: {
        true: 'bg-fd-accent text-fd-accent-foreground',
      },
    },
  },
);

const TagsListContext = createContext<{
  value?: string;
  onValueChange: (value: string | undefined) => void;
  allowClear: boolean;
}>('TagsList');

export function TagsList({
  tag,
  onTagChange,
  allowClear = false,
  ...props
}: TagsListProps) {
  return (
    <div
      {...props}
      className={cn('flex items-center gap-1 flex-wrap', props.className)}
    >
      <TagsListContext.Provider
        value={useMemo(
          () => ({
            value: tag,
            onValueChange: onTagChange,
            allowClear,
          }),
          [allowClear, onTagChange, tag],
        )}
      >
        {props.children}
      </TagsListContext.Provider>
    </div>
  );
}

export function TagsListItem({
  value,
  className,
  ...props
}: ComponentProps<'button'> & {
  value: string;
}) {
  const ctx = TagsListContext.use();

  return (
    <button
      type="button"
      data-active={value === ctx.value}
      className={cn(itemVariants({ active: value === ctx.value, className }))}
      onClick={() => {
        ctx.onValueChange(
          ctx.value === value && ctx.allowClear ? undefined : value,
        );
      }}
      tabIndex={-1}
      {...props}
    >
      {props.children}
    </button>
  );
}

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      color: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      color: 'default',
    },
  }
);
