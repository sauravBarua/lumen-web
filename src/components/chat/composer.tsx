'use client';

import { Clock, Paperclip, Pencil, Send, Smile } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EmojiMenu } from '@/components/chat/emoji-menu';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { UploadChip, type UploadItem } from '@/components/chat/upload-chip';
import { useSocket } from '@/components/realtime-provider';
import { Button } from '@/components/ui/button';
import { usePopover } from '@/hooks/use-popover';
import type { ChatActions } from '@/hooks/use-chat-actions';
import { FILE_ACCEPT, validateFile } from '@/lib/files';
import { uid } from '@/lib/ids';
import { ApiError, uploadAttachment } from '@/lib/rest';
import type { Message } from '@/lib/types';
import { useTypingStore } from '@/stores/typing-store';
import { useUiStore } from '@/stores/ui-store';

interface Props {
  roomId: string;
  roomLabel: string;
  actions: ChatActions;
  editing: Message | null;
  onCancelEdit: () => void;
  meId: string;
}

const EMPTY: Record<string, string> = {};

/** Remount it with a new `key` to start a fresh draft (another room, or another message being edited). */
export function Composer({ roomId, roomLabel, actions, editing, onCancelEdit, meId }: Props) {
  const socket = useSocket();
  const rateLimited = useUiStore((s) => s.rateLimited);
  const typingMap = useTypingStore((s) => s.byRoom[roomId]) ?? EMPTY;
  const typingNames = Object.entries(typingMap)
    .filter(([id]) => id !== meId)
    .map(([, name]) => name);

  const [text, setText] = useState(editing?.content ?? '');
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typing = useRef<{ lastStart: number; stopTimer?: ReturnType<typeof setTimeout> }>({
    lastStart: 0,
  });
  const { attach, ...emoji } = usePopover();

  useEffect(() => {
    const el = textareaRef.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
    const state = typing.current;
    return () => clearTimeout(state.stopTimer);
  }, []);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const readyUploads = uploads.filter((u) => u.status === 'ready');
  const content = text.trim();
  const canSend =
    !sending &&
    !rateLimited &&
    (editing
      ? content.length > 0 && content !== editing.content
      : content.length > 0 || readyUploads.length > 0);

  function announceTyping(value: string) {
    if (!socket?.connected || editing) return;
    const state = typing.current;
    clearTimeout(state.stopTimer);
    if (!value.trim()) {
      if (state.lastStart) socket.emit('typing:stop', { roomId });
      state.lastStart = 0;
      return;
    }
    if (Date.now() - state.lastStart > 3000) {
      socket.emit('typing:start', { roomId });
      state.lastStart = Date.now();
    }
    state.stopTimer = setTimeout(() => {
      socket.emit('typing:stop', { roomId });
      state.lastStart = 0;
    }, 2500);
  }

  function patchUpload(id: string, patch: Partial<UploadItem>) {
    setUploads((cur) => cur.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const items: UploadItem[] = Array.from(files).map((file) => {
      const error = validateFile(file);
      return {
        id: uid(),
        file,
        status: error ? 'error' : 'ready',
        progress: 0,
        error: error ?? undefined,
      };
    });
    setUploads((cur) => [...cur, ...items]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function sendUploads(caption: string) {
    await Promise.all(
      readyUploads.map(async (item, index) => {
        patchUpload(item.id, { status: 'uploading', progress: 0 });
        try {
          const message = await uploadAttachment(
            roomId,
            item.file,
            index === 0 ? caption : '',
            (progress) => patchUpload(item.id, { progress }),
          );
          actions.receive(message);
          setUploads((cur) => cur.filter((u) => u.id !== item.id));
        } catch (e) {
          if (index === 0 && caption) setText(caption);
          patchUpload(item.id, {
            status: 'error',
            error: e instanceof ApiError ? e.message : 'Upload failed',
          });
        }
      }),
    );
  }

  async function submit() {
    if (!canSend) return;
    setSending(true);
    try {
      if (editing) {
        if (await actions.edit(editing.id, content)) onCancelEdit();
        return;
      }
      setText('');
      announceTyping('');
      if (readyUploads.length > 0) await sendUploads(content);
      else void actions.send(content);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void submit();
    } else if (e.key === 'Escape' && editing) {
      e.preventDefault();
      onCancelEdit();
    }
  }

  return (
    <footer className="shrink-0 border-t border-border bg-background px-3 pb-3 pt-2 sm:px-4">
      <TypingIndicator names={typingNames} />

      {rateLimited && (
        <div
          role="alert"
          className="mb-2 flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/15 px-3 py-2.5 text-sm"
        >
          <Clock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <p>You&apos;re sending messages too fast, slow down.</p>
        </div>
      )}

      <div className="rounded-lg border border-input bg-card focus-within:ring-2 focus-within:ring-ring">
        {editing && (
          <div className="flex items-center justify-between gap-2 rounded-t-lg border-b border-border bg-accent px-3 py-1.5 text-xs text-accent-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit message
            </span>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded px-1.5 py-0.5 font-medium underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel (Esc)
            </button>
          </div>
        )}

        {uploads.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3" aria-label="Attachments">
            {uploads.map((u) => (
              <UploadChip
                key={u.id}
                item={u}
                onRemove={() => setUploads((cur) => cur.filter((x) => x.id !== u.id))}
              />
            ))}
          </div>
        )}

        <label htmlFor="composer" className="sr-only">
          Message {roomLabel}
        </label>
        <textarea
          id="composer"
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            announceTyping(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder={editing ? 'Edit your message' : `Message ${roomLabel}`}
          className="block max-h-40 w-full resize-none bg-transparent px-3 py-3 text-sm placeholder:text-muted-foreground focus:outline-none"
        />

        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            {!editing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={FILE_ACCEPT}
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="Choose files to attach"
                  data-testid="file-input"
                  onChange={(e) => addFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Attach file"
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Paperclip className="size-5" aria-hidden="true" />
                </button>
              </>
            )}
            <div ref={attach} className="relative">
              <button
                type="button"
                onClick={emoji.toggle}
                aria-haspopup="menu"
                aria-expanded={emoji.open}
                aria-label="Insert emoji"
                className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Smile className="size-5" aria-hidden="true" />
              </button>
              {emoji.open && (
                <EmojiMenu
                  label="Insert emoji"
                  className="bottom-full left-0 mb-2"
                  onPick={(e) => {
                    emoji.close();
                    setText((t) => t + e);
                    textareaRef.current?.focus();
                  }}
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              <kbd className="rounded border border-border px-1 font-sans">Enter</kbd> to send
            </span>
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 px-3.5"
              disabled={!canSend}
              onClick={() => void submit()}
              aria-label={editing ? 'Save message' : 'Send message'}
            >
              <Send className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{editing ? 'Save' : 'Send'}</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
