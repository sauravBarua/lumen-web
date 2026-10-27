'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';
import { Avatar } from '@/components/common/avatar';
import { Attachments } from '@/components/chat/attachments';
import { EmojiMenu } from '@/components/chat/emoji-menu';
import { MessageText } from '@/components/chat/message-text';
import { AddReactionButton, ReactionBar } from '@/components/chat/reaction-bar';
import { formatTime } from '@/lib/format';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface MessageActions {
  onEdit: (message: Message) => void;
  onDelete: (message: Message) => void;
  onReact: (message: Message, emoji: string) => void;
  onRetry: (message: Message) => void;
  onDiscard: (message: Message) => void;
  onOpenImage: (attachmentId: string) => void;
}

interface Props {
  message: Message;
  grouped: boolean;
  meId: string;
  meUsername: string;
  canModerate: boolean;
  actions: MessageActions;
}

const ROW =
  'group relative flex gap-3 px-4 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';

export const MessageItem = memo(function MessageItem({
  message,
  grouped,
  meId,
  meUsername,
  canModerate,
  actions,
}: Props) {
  const [emojiAt, setEmojiAt] = useState<null | 'toolbar' | 'bar'>(null);
  const own = message.sender.id === meId;
  const deleted = !!message.deletedAt;
  const settled = !message.pending && !message.error;

  // Mine on the left, everyone else on the right.
  const right = !own;
  const rowDir = right ? 'flex-row-reverse' : '';
  const column = cn(
    'flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%]',
    right ? 'items-end' : 'items-start',
  );

  const header = !grouped && (
    <div className={cn('mb-0.5 flex items-baseline gap-2', right && 'flex-row-reverse')}>
      <span className="text-sm font-semibold">{own ? 'You' : message.sender.username}</span>
      <time dateTime={message.createdAt} className="text-xs text-muted-foreground">
        {formatTime(message.createdAt)}
      </time>
    </div>
  );

  if (deleted) {
    return (
      <article
        data-message-id={message.id}
        data-own={own}
        data-deleted="true"
        className={cn('flex gap-3 px-4', rowDir, grouped ? 'py-0.5' : 'mt-1 py-1.5')}
      >
        {grouped ? (
          <span className="w-9 shrink-0" />
        ) : (
          <Avatar name={message.sender.username} size="lg" own={own} />
        )}
        <div className={column}>
          {header}
          <p className="inline-flex items-center gap-1.5 rounded-2xl border border-dashed border-border px-3 py-1.5 text-sm italic text-muted-foreground">
            <Trash2 className="size-3.5" aria-hidden="true" />
            This message was deleted
          </p>
        </div>
      </article>
    );
  }

  const pick = (emoji: string) => {
    setEmojiAt(null);
    actions.onReact(message, emoji);
  };

  return (
    <article
      tabIndex={0}
      data-message-id={message.id}
      data-sender={message.sender.username}
      data-own={own}
      className={cn(
        ROW,
        rowDir,
        grouped ? 'py-0.5' : 'mt-1 py-1.5',
        message.pending && 'opacity-60',
      )}
    >
      {grouped ? (
        <time
          dateTime={message.createdAt}
          className="w-9 shrink-0 pt-2 text-center text-[10px] text-muted-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
        >
          {formatTime(message.createdAt).replace(/\s?[AP]M$/i, '')}
        </time>
      ) : (
        <div className="mt-0.5">
          <Avatar name={message.sender.username} size="lg" own={own} />
        </div>
      )}

      <div className={column}>
        {header}

        {message.content && (
          <div
            data-message-content
            className={cn(
              'rounded-2xl px-3 py-2',
              own ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
              right ? 'rounded-tr-sm' : 'rounded-tl-sm',
            )}
          >
            <MessageText
              content={message.content}
              meUsername={meUsername}
              variant={own ? 'outgoing' : 'incoming'}
            />
            {message.editedAt && (
              <span
                className={cn(
                  'text-xs',
                  own ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}
                title={`Edited at ${formatTime(message.editedAt)}`}
              >
                (edited)
              </span>
            )}
          </div>
        )}

        <Attachments attachments={message.attachments} onOpenImage={actions.onOpenImage} />

        {message.error && (
          <p
            role="alert"
            className={cn(
              'mt-1 flex flex-wrap items-center gap-x-2 text-xs text-destructive',
              right && 'justify-end',
            )}
          >
            <span>Not sent: {message.error}</span>
            <button
              type="button"
              onClick={() => actions.onRetry(message)}
              className="font-medium underline-offset-2 hover:underline"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => actions.onDiscard(message)}
              className="font-medium underline-offset-2 hover:underline"
            >
              Discard
            </button>
          </p>
        )}

        {settled && message.reactions.length > 0 && (
          <ReactionBar
            align={right ? 'end' : 'start'}
            reactions={message.reactions}
            onToggle={(emoji) => actions.onReact(message, emoji)}
            addButton={
              <span className="relative">
                <AddReactionButton
                  variant="chip"
                  expanded={emojiAt === 'bar'}
                  onClick={() => setEmojiAt(emojiAt === 'bar' ? null : 'bar')}
                />
                {emojiAt === 'bar' && (
                  <EmojiMenu
                    label="Pick a reaction"
                    onPick={pick}
                    className={cn('top-full mt-1', right ? 'right-0' : 'left-0')}
                  />
                )}
              </span>
            }
          />
        )}
      </div>

      {settled && (
        <div
          role="toolbar"
          aria-label="Message actions"
          className={cn(
            'absolute -top-4 items-center rounded-md border border-border bg-popover p-0.5 shadow-sm group-focus-within:flex group-hover:flex',
            right ? 'left-4' : 'right-4',
            emojiAt === 'toolbar' ? 'flex' : 'hidden',
          )}
        >
          <span className="relative">
            <AddReactionButton
              variant="toolbar"
              expanded={emojiAt === 'toolbar'}
              onClick={() => setEmojiAt(emojiAt === 'toolbar' ? null : 'toolbar')}
            />
            {emojiAt === 'toolbar' && (
              <EmojiMenu
                label="Pick a reaction"
                onPick={pick}
                className={cn('top-full mt-1', right ? 'left-0' : 'right-0')}
              />
            )}
          </span>
          {own && (
            <button
              type="button"
              onClick={() => actions.onEdit(message)}
              aria-label="Edit message"
              className="inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
          )}
          {(own || canModerate) && (
            <button
              type="button"
              onClick={() => actions.onDelete(message)}
              aria-label="Delete message"
              className="inline-flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </article>
  );
});
