import type { UIMessage } from 'ai';

const CHAT_KEY = 'chat:sidebar';
const ERROR_KEY = 'chat:error';
const CONVERSATION_ID_KEY = 'chat:conversation-id';
const MAX_SIZE_KB = 200; // Cap at ~200KB

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create conversation ID
 */
export function getConversationId(): string {
  if (typeof window === 'undefined') {
    return generateUUID();
  }

  try {
    const stored = localStorage.getItem(CONVERSATION_ID_KEY);
    if (stored) {
      return stored;
    }

    const newId = generateUUID();
    localStorage.setItem(CONVERSATION_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error('Failed to get/create conversation ID:', error);
    return generateUUID();
  }
}

/**
 * Clear conversation ID (creates a new conversation)
 */
export function clearConversationId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(CONVERSATION_ID_KEY);
  } catch (error) {
    console.error('Failed to clear conversation ID:', error);
  }
}

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
 * Clear all stored messages and create new conversation
 */
export function clearMessages(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(CHAT_KEY);
    localStorage.removeItem(ERROR_KEY); // Also clear errors
    clearConversationId(); // Create new conversation
  } catch (error) {
    console.error('Failed to clear messages from localStorage:', error);
  }
}

/**
 * Load error from localStorage
 */
export function loadError(): Error | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const stored = localStorage.getItem(ERROR_KEY);
    if (!stored) {
      return undefined;
    }

    const errorData = JSON.parse(stored);
    const error = new Error(errorData.message);
    if (errorData.stack) {
      error.stack = errorData.stack;
    }
    return error;
  } catch (error) {
    console.error('Failed to load error from localStorage:', error);
    return undefined;
  }
}

/**
 * Save error to localStorage
 */
export function saveError(error: Error | undefined): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (!error) {
      localStorage.removeItem(ERROR_KEY);
      return;
    }

    const errorData = {
      message: error.message,
      stack: error.stack,
    };
    localStorage.setItem(ERROR_KEY, JSON.stringify(errorData));
  } catch (err) {
    console.error('Failed to save error to localStorage:', err);
  }
}
