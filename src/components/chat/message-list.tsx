'use client';

import { ArrowDown, LoaderCircle, MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, ErrorState } from '@/components/common/states';
import { MessageItem, type MessageActions } from '@/components/chat/message-item';
import { MessageListSkeleton } from '@/components/ui/skeletons';
import { useNow } from '@/hooks/use-now';
import { buildTimeline } from '@/lib/timeline';
import type { Message } from '@/lib/types';

interface Props {
  roomLabel: string;
  messages: Message[];
  meId: string;
  meUsername: string;
  canModerate: boolean;
  unreadAtOpen: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  hasOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  onAtBottomChange: (atBottom: boolean) => void;
  actions: MessageActions;
}

const NEAR_BOTTOM_PX = 80;

export function MessageList(props: Props) {
  const { messages, meId, hasOlder, loadingOlder, onLoadOlder, onAtBottomChange } = props;
  const ref = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const heightBeforePrepend = useRef<number | null>(null);
  const initialised = useRef(false);
  const [atBottom, setAtBottom] = useState(true);
  // The newest message the user has actually seen (set while scrolled to the bottom).
  const [seenId, setSeenId] = useState<string | undefined>(undefined);
  const [jumpUnread, setJumpUnread] = useState(false);
  const now = useNow();

  const timeline = useMemo(
    () =>
      buildTimeline(messages, { meId, unreadAtOpen: props.unreadAtOpen, now: new Date(now || 0) }),
    [messages, meId, props.unreadAtOpen, now],
  );
  const lastMessage = messages.at(-1);
  const lastId = lastMessage?.id;
  const jumpLatest = !atBottom && !!lastId && lastId !== seenId && lastMessage?.sender.id !== meId;

  const loadOlder = useCallback(() => {
    if (ref.current) heightBeforePrepend.current = ref.current.scrollHeight;
    onLoadOlder();
  }, [onLoadOlder]);

  const evaluate = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    stickToBottom.current = bottom;
    setAtBottom(bottom);
    if (bottom) setSeenId(lastId);
    onAtBottomChange(bottom);
    const divider = dividerRef.current;
    setJumpUnread(!!divider && divider.offsetTop > el.scrollTop + el.clientHeight - 40);
    if (initialised.current && el.scrollTop < 120 && hasOlder && !loadingOlder) loadOlder();
  }, [hasOlder, loadingOlder, loadOlder, onAtBottomChange, lastId]);

  // First paint: jump to the "New messages" divider if there is one, otherwise to the latest message.
  // Later changes: keep the scroll position when older pages are prepended; follow new messages when at the
  // bottom or when the new message is mine.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || messages.length === 0) return;
    if (!initialised.current) {
      const divider = dividerRef.current;
      el.scrollTop = divider ? Math.max(0, divider.offsetTop - 80) : el.scrollHeight;
      initialised.current = true;
      evaluate();
      return;
    }
    if (heightBeforePrepend.current !== null) {
      el.scrollTop += el.scrollHeight - heightBeforePrepend.current;
      heightBeforePrepend.current = null;
      return;
    }
    if (stickToBottom.current || lastMessage?.sender.id === meId) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reacts to new messages only
  }, [lastId, messages.length]);

  // A tall screen may not scroll at all: keep loading older pages until the list fills the viewport.
  useEffect(() => {
    const el = ref.current;
    if (
      el &&
      initialised.current &&
      hasOlder &&
      !loadingOlder &&
      el.scrollHeight <= el.clientHeight + 4
    ) {
      loadOlder();
    }
  }, [messages.length, hasOlder, loadingOlder, loadOlder]);

  if (props.loading)
    return (
      <div className="flex-1 overflow-hidden">
        <MessageListSkeleton />
      </div>
    );
  if (props.error) {
    return (
      <div className="flex-1 overflow-y-auto">
        <ErrorState
          title="Couldn't load messages"
          description="Something went wrong on our side. Check your connection and try again."
          onRetry={props.onRetry}
        />
      </div>
    );
  }
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          icon={MessageSquare}
          title="Be the first to say something"
          description={`This is the very start of ${props.roomLabel}. Say hello, share an idea or drop a file.`}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      {jumpUnread && (
        <div className="absolute inset-x-0 top-2 z-10 flex justify-center">
          <button
            type="button"
            onClick={() =>
              dividerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowDown className="size-3.5" aria-hidden="true" />
            Jump to unread
          </button>
        </div>
      )}
      {jumpLatest && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
          <button
            type="button"
            onClick={() =>
              ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowDown className="size-3.5" aria-hidden="true" />
            New messages
          </button>
        </div>
      )}

      <div
        ref={ref}
        onScroll={evaluate}
        role="log"
        aria-live="polite"
        aria-label={`Messages in ${props.roomLabel}`}
        className="h-full overflow-y-auto py-2"
      >
        {loadingOlder && (
          <div
            className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground"
            role="status"
          >
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Loading older messages…
          </div>
        )}
        {timeline.map((item) => {
          if (item.kind === 'day') {
            return (
              <div key={item.key} className="my-2 flex items-center gap-3 px-4" role="separator">
                <span className="h-px flex-1 bg-border" />
                <span className="rounded-full border border-border bg-background px-3 py-0.5 text-xs font-medium text-muted-foreground">
                  {item.label}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            );
          }
          if (item.kind === 'new') {
            return (
              <div
                key={item.key}
                ref={dividerRef}
                className="my-3 flex items-center gap-3 px-4"
                role="separator"
                aria-label="New messages"
              >
                <span className="h-px flex-1 bg-primary/50" />
                <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  New messages
                </span>
                <span className="h-px flex-1 bg-primary/50" />
              </div>
            );
          }
          return (
            <MessageItem
              key={item.key}
              message={item.message}
              grouped={item.grouped}
              meId={meId}
              meUsername={props.meUsername}
              canModerate={props.canModerate}
              actions={props.actions}
            />
          );
        })}
      </div>
    </div>
  );
}
