'use client';
import { cn } from '@/lib/utils';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { type SyntheticEvent, useEffect, useState, useTransition } from 'react';
import {
  Collapsible,
  CollapsibleContent,
} from 'fumadocs-ui/components/ui/collapsible';
import { cva } from 'class-variance-authority';
import { usePathname } from 'next/navigation';

const rateButtonVariants = cva(
  'inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium border text-sm [&_svg]:size-4 disabled:cursor-not-allowed',
  {
    variants: {
      active: {
        true: 'bg-fd-accent text-fd-accent-foreground [&_svg]:fill-current',
        false: 'text-fd-muted-foreground',
      },
    },
  },
);

export interface Feedback {
  opinion: 'good' | 'bad';
  url?: string;
  message: string;
}

export interface ActionResponse {
  success: boolean;
  error?: string;
}

interface Result extends Feedback {
  response?: ActionResponse;
}

interface RateProps {
  githubPath?: string;
}

export function Rate({ githubPath }: RateProps = {}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Effect to fetch user session
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn && data.userInfo?.email) {
          setUserEmail(data.userInfo.email);
        }
      })
      .catch(err => console.error('Failed to fetch session:', err));
  }, []);

  async function defaultRateAction(
    url: string,
    feedback: Feedback,
  ): Promise<ActionResponse> {
    try {
      const res = await fetch('/docs/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, ...feedback, email: userEmail || undefined }),
      });

      let data: ActionResponse | undefined;
      if (res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      }

      // non‑200
      if (!res.ok) {
        return {
          success: false,
          error: data?.error ?? 'Something went wrong. Please try again.',
        };
      }

      return data ?? { success: true };
    } catch (e) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  const url = usePathname();
  const [previous, setPrevious] = useState<Result | null>(null);
  const [opinion, setOpinion] = useState<'good' | 'bad' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const item = localStorage.getItem(`docs-feedback-${url}`);

    if (item === null) return;
    setPrevious(JSON.parse(item) as Result);
  }, [url]);

  useEffect(() => {
    const key = `docs-feedback-${url}`;

    if (previous) localStorage.setItem(key, JSON.stringify(previous));
    else localStorage.removeItem(key);
  }, [previous, url]);

  function submit(e?: SyntheticEvent) {
    if (opinion == null) return;

    startTransition(async () => {
      const feedback: Feedback = {
        opinion,
        message,
      };

      void defaultRateAction(url, feedback).then((response) => {
        if (!response.success) {
          setError(response.error ?? 'Something went wrong');
          return;
        }

        setPrevious({
          response,
          ...feedback,
        });
        setMessage('');
        setOpinion(null);
        setError(null);
      });
    });

    e?.preventDefault();
  }

  const activeOpinion = previous?.opinion ?? opinion;

  return (
    <Collapsible
      open={opinion !== null || previous !== null}
      onOpenChange={(v) => {
        if (!v) setOpinion(null);
      }}
      className="border-y py-3"
    >
      <div className="flex flex-row items-center gap-2">
        <p className="text-sm font-medium pe-2">How is this guide?</p>
        <button
          disabled={previous !== null}
          className={cn(
            rateButtonVariants({
              active: activeOpinion === 'good',
            }),
          )}
          onClick={() => {
            setOpinion('good');
          }}
        >
          <ThumbsUp />
          Good
        </button>
        <button
          disabled={previous !== null}
          className={cn(
            rateButtonVariants({
              active: activeOpinion === 'bad',
            }),
          )}
          onClick={() => {
            setOpinion('bad');
          }}
        >
          <ThumbsDown />
          Bad
        </button>
        {githubPath && (
          <a
            href={`https://github.com/superwall/docs/blob/main/content/docs/${githubPath}`}
            rel="noreferrer noopener"
            target="_blank"
            className={cn(
              rateButtonVariants({
                active: false,
              }),
            )}
          >
            Edit on GitHub
          </a>
        )}
      </div>
      <CollapsibleContent className="mt-3">
        {previous ? (
          <div className="px-3 py-6 flex flex-col items-center gap-3 bg-fd-card text-fd-muted-foreground text-sm text-center rounded-xl">
            <p>Thank you for your feedback!</p>
            <div className="flex flex-row items-center gap-2">

              <button
                className={cn(
                  buttonVariants({
                    color: 'secondary',
                  }),
                  'text-xs',
                )}
                onClick={() => {
                  setOpinion(previous.opinion);
                  setPrevious(null);
                }}
              >
                Submit Again
              </button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={submit}>
            {error && (
              <p className="text-sm text-red-500">
                {error}
              </p>
            )}
            <textarea
              autoFocus
              required
              value={message}
              onChange={(e) => {
                setError(null);
                setMessage(e.target.value);
              }}
              className="border rounded-lg bg-fd-secondary text-fd-secondary-foreground p-3 resize-none focus-visible:outline-none placeholder:text-fd-muted-foreground"
              placeholder="Leave your feedback..."
              onKeyDown={(e) => {
                if (!e.shiftKey && e.key === 'Enter') {
                  submit(e);
                }
              }}
            />
            <button
              type="submit"
              className={cn(buttonVariants({ color: 'outline' }), 'w-fit px-3')}
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}