import type { UIMessage } from 'ai';

const CHAT_KEY = 'chat:sidebar';
const MAX_SIZE_KB = 200; // Cap at ~200KB

/**
 * Load chat messages from localStorage
 */
export function loadMessages(): UIMessage[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(CHAT_KEY);
    if (!stored) {
      return [];
    }

    const messages = JSON.parse(stored) as UIMessage[];
    return messages;
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error);
    return [];
  }
}

/**
 * Save chat messages to localStorage with size pruning
 */
export function saveMessages(messages: UIMessage[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serialized = JSON.stringify(messages);
    const sizeKB = new Blob([serialized]).size / 1024;

    // If size exceeds limit, prune oldest messages
    if (sizeKB > MAX_SIZE_KB) {
      const pruned = pruneMessages(messages);
      localStorage.setItem(CHAT_KEY, JSON.stringify(pruned));
    } else {
      localStorage.setItem(CHAT_KEY, serialized);
    }
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error);
  }
}

/**
 * Prune oldest messages to fit within size limit
 * Keeps system messages and recent messages
 */
function pruneMessages(messages: UIMessage[]): UIMessage[] {
  // Keep system messages
  const systemMessages = messages.filter(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  // Start with most recent messages and work backwards
  let pruned = [...systemMessages];
  let size = new Blob([JSON.stringify(pruned)]).size / 1024;

  for (let i = nonSystemMessages.length - 1; i >= 0; i--) {
    const testMessages = [...pruned, nonSystemMessages[i]];
    const testSize = new Blob([JSON.stringify(testMessages)]).size / 1024;

    if (testSize > MAX_SIZE_KB) {
      break;
    }

    pruned.push(nonSystemMessages[i]);
    size = testSize;
  }

  // Sort back to chronological order
  return pruned.sort((a, b) => {
    const aIndex = messages.indexOf(a);
    const bIndex = messages.indexOf(b);
    return aIndex - bIndex;
  });
}

/**
 * Clear all stored messages
 */
export function clearMessages(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(CHAT_KEY);
  } catch (error) {
    console.error('Failed to clear messages from localStorage:', error);
  }
}
