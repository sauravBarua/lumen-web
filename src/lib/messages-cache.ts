import type { MessageReactionEvent, ReactionSummaryDto } from '@/lib/socket-events';
import type { Message, MessagesData, MessagesPage } from '@/lib/types';

const mapPages = (
  data: MessagesData,
  fn: (page: MessagesPage, index: number) => MessagesPage,
): MessagesData => ({
  ...data,
  pages: data.pages.map(fn),
});

/** Pages are newest-first; messages inside a page are oldest-first. Returns everything oldest -> newest. */
export function flattenMessages(data: MessagesData): Message[] {
  return [...data.pages].reverse().flatMap((p) => p.items);
}

export function newestRealMessageId(data: MessagesData | undefined): string | null {
  const items = data?.pages[0]?.items ?? [];
  for (let i = items.length - 1; i >= 0; i--) if (!items[i].pending) return items[i].id;
  return null;
}

// Message ids are UUIDv7 (time ordered); pending ids start with "pending-" and so sort after every real id.
function insertSorted(items: Message[], message: Message): Message[] {
  const index = items.findIndex((m) => m.id > message.id);
  return index === -1
    ? [...items, message]
    : [...items.slice(0, index), message, ...items.slice(index)];
}

export function patchMessage(
  data: MessagesData,
  id: string,
  fn: (m: Message) => Message,
): MessagesData {
  return mapPages(data, (page) =>
    page.items.some((m) => m.id === id)
      ? { ...page, items: page.items.map((m) => (m.id === id ? fn(m) : m)) }
      : page,
  );
}

/** Replaces the message when it is already known, otherwise inserts it into the newest page. */
export function upsertMessage(data: MessagesData, message: Message): MessagesData {
  if (data.pages.some((p) => p.items.some((m) => m.id === message.id))) {
    return patchMessage(data, message.id, () => message);
  }
  return mapPages(data, (page, i) =>
    i === 0 ? { ...page, items: insertSorted(page.items, message) } : page,
  );
}

export function removeMessage(data: MessagesData, id: string): MessagesData {
  return mapPages(data, (page) => ({ ...page, items: page.items.filter((m) => m.id !== id) }));
}

export function addPending(data: MessagesData, pending: Message): MessagesData {
  return mapPages(data, (page, i) =>
    i === 0 ? { ...page, items: [...page.items, pending] } : page,
  );
}

/** The server answered: drop the placeholder and make sure the real message is there exactly once. */
export function replacePending(data: MessagesData, tempId: string, real: Message): MessagesData {
  return upsertMessage(removeMessage(data, tempId), real);
}

export const failPending = (data: MessagesData, tempId: string, error: string) =>
  patchMessage(data, tempId, (m) => ({ ...m, pending: false, error }));

export const retryPending = (data: MessagesData, tempId: string) =>
  patchMessage(data, tempId, (m) => ({ ...m, pending: true, error: undefined }));

/** The broadcast of my own message can arrive before its ack: drop the matching placeholder. */
export function removePendingMatching(data: MessagesData, content: string): MessagesData {
  const target = flattenMessages(data).find((m) => m.pending && !m.error && m.content === content);
  return target ? removeMessage(data, target.id) : data;
}

export const applyEdit = (data: MessagesData, id: string, content: string, editedAt: string) =>
  patchMessage(data, id, (m) => ({ ...m, content, editedAt }));

export const applyDelete = (data: MessagesData, id: string, deletedAt: string) =>
  patchMessage(data, id, (m) => ({
    ...m,
    content: null,
    deletedAt,
    reactions: [],
    attachments: [],
  }));

/** Idempotent: the event carries the authoritative count, so replaying it changes nothing. */
export function applyReaction(
  data: MessagesData,
  e: MessageReactionEvent,
  meId: string,
): MessagesData {
  return patchMessage(data, e.messageId, (m) => {
    const existing = m.reactions.find((r) => r.emoji === e.emoji);
    const mine = e.userId === meId ? e.action === 'added' : (existing?.reactedByMe ?? false);
    let reactions: ReactionSummaryDto[];
    if (e.count <= 0) reactions = m.reactions.filter((r) => r.emoji !== e.emoji);
    else if (existing)
      reactions = m.reactions.map((r) =>
        r.emoji === e.emoji ? { ...r, count: e.count, reactedByMe: mine } : r,
      );
    else reactions = [...m.reactions, { emoji: e.emoji, count: e.count, reactedByMe: mine }];
    return { ...m, reactions };
  });
}
