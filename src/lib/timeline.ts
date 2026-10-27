import { dayKeyOf, formatDayLabel } from '@/lib/format';
import type { Message } from '@/lib/types';

export type TimelineItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'new'; key: string }
  | { kind: 'message'; key: string; message: Message; grouped: boolean };

const GROUP_WINDOW_MS = 5 * 60_000;

/**
 * Index of the first unread message. Unread = other people's, non-deleted messages after my read marker,
 * which is how the API counts: the Nth such message from the end is the first unread one.
 */
export function firstUnreadIndex(messages: Message[], meId: string, unread: number): number {
  if (unread <= 0) return -1;
  let counted = 0;
  let first = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.sender.id === meId || m.deletedAt || m.pending) continue;
    counted += 1;
    first = i;
    if (counted === unread) break;
  }
  return first;
}

export function buildTimeline(
  messages: Message[],
  opts: { meId: string; unreadAtOpen: number; now: Date },
): TimelineItem[] {
  const unreadIndex = firstUnreadIndex(messages, opts.meId, opts.unreadAtOpen);
  const items: TimelineItem[] = [];
  let previous: Message | null = null;
  let previousDay = '';

  messages.forEach((message, i) => {
    let divider = false;
    const day = dayKeyOf(message.createdAt);
    if (day !== previousDay) {
      items.push({
        kind: 'day',
        key: `day-${day}`,
        label: formatDayLabel(message.createdAt, opts.now),
      });
      previousDay = day;
      divider = true;
    }
    if (i === unreadIndex) {
      items.push({ kind: 'new', key: 'new-messages' });
      divider = true;
    }
    const grouped =
      !divider &&
      previous !== null &&
      previous.sender.id === message.sender.id &&
      Math.abs(new Date(message.createdAt).getTime() - new Date(previous.createdAt).getTime()) <
        GROUP_WINDOW_MS;
    items.push({ kind: 'message', key: message.id, message, grouped });
    previous = message;
  });
  return items;
}
