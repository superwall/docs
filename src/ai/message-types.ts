import type { UIMessage } from 'ai';

export type DocContext = {
  url: string;
  docId: string;
  title?: string;
  headings?: string[];
};

export type AppMessage = UIMessage<{ doc?: DocContext }>;
