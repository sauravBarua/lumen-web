/**
 * Socket.IO contract shared by lumen-api and lumen-web.
 * lumen-api owns this file (src/modules/realtime/socket-events.ts).
 * lumen-web keeps an identical copy at src/lib/socket-events.ts. Never edit the copy.
 *
 * Connect:   io(API_ORIGIN, { auth: { token: accessToken } })   // API_ORIGIN has no /api/v1 suffix
 * On connect the server subscribes the socket to every room you belong to, and keeps that in
 * sync with `room:added` / `room:removed`. After a reconnect, call `messages:sync` per open room.
 *
 * Token lifetime: the access token is checked at connect and on every acked event. When it has
 * expired the server answers UNAUTHORIZED and disconnects ("io server disconnect"). Fetch a fresh
 * token, set socket.auth = { token }, call socket.connect(), then resync with `messages:sync`.
 * Socket.IO does not reconnect by itself after a server-side disconnect: the same handling is
 * needed during deployments (the server drops its sockets when it shuts down).
 *
 * Limits: events are rate limited per user across all devices (message actions 30 per 10 s,
 * typing 20 per 10 s, heartbeat and sync 10 per 10 s). Excess acked events return RATE_LIMITED;
 * excess typing events are dropped silently. A packet over 64 KB closes the connection: send
 * files over REST (POST /rooms/:roomId/attachments).
 *
 * Presence: a new connection counts as active. Send `presence:heartbeat` about every 25 s,
 * with { active: true } while the user is using the app and { active: false } when idle (-> "away").
 * No heartbeat for 60 s means that connection is gone. A user is online while any connection is
 * active, away while all are idle, offline otherwise. `presence:changed` reaches everyone who
 * shares a room with the user, only on real changes. For the initial state use
 * GET /rooms/:roomId/presence.
 *
 * Typing: send `typing:start` while the user types (repeat about every 3 s) and `typing:stop`
 * when they stop. The server announces `typing` to the whole room (including your own sockets,
 * so ignore your own userId) only when the state changes, and sends isTyping:false itself
 * after 5 s without a refresh or when the user posts a message. No client timers needed.
 *
 * Notifications: `notification:new` and `notification:read` go to every socket of the recipient.
 * `unreadCount` is the authoritative badge value. For the initial list and count use
 * GET /notifications and GET /notifications/unread-count; mark read with
 * POST /notifications/:id/read or /notifications/read-all (the other devices get `notification:read`).
 * Reading a room (POST /rooms/:roomId/read) also marks that room's notifications read.
 */

// ---- Acks ----
export type AckErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export interface AckError {
  code: AckErrorCode;
  message: string;
  details?: unknown;
}

export type Ack<T> = { ok: true; data: T } | { ok: false; error: AckError };

// ---- DTOs (same shapes as the REST API) ----
export interface ReactionSummaryDto {
  emoji: string;
  count: number;
  reactedByMe: boolean;
}

export interface AttachmentDto {
  id: string;
  url: string;
  resourceType: string;
  mime: string;
  size: number;
}

export interface MessageDto {
  id: string;
  roomId: string;
  sender: { id: string; username: string };
  /** null once deleted; may be "" for file-only messages. */
  content: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  reactions: ReactionSummaryDto[];
  attachments: AttachmentDto[];
}

export interface MessagesPageDto {
  items: MessageDto[];
  nextCursor: string | null;
}

export type PresenceStatus = 'online' | 'away' | 'offline';

export type NotificationType = 'MENTION' | 'DM' | 'INVITE';

export interface NotificationDto {
  id: string;
  type: NotificationType;
  /** Who caused it (the mentioner, DM sender or inviter). */
  actor: { id: string; username: string } | null;
  roomId: string | null;
  /** null for DMs. */
  roomName: string | null;
  messageId: string | null;
  /** Short snippet of the message; null for invites and file-only messages. */
  preview: string | null;
  readAt: string | null;
  createdAt: string;
}

// ---- Client -> server payloads ----
export interface SendMessagePayload {
  roomId: string;
  content: string;
}

export interface EditMessagePayload {
  roomId: string;
  messageId: string;
  content: string;
}

export interface DeleteMessagePayload {
  roomId: string;
  messageId: string;
}

export interface ReactPayload {
  roomId: string;
  messageId: string;
  emoji: string;
  action: 'add' | 'remove';
}

export interface TypingPayload {
  roomId: string;
}

export interface SyncPayload {
  roomId: string;
  /** Id of the newest message the client already has. */
  after: string;
  limit?: number;
}

export interface HeartbeatPayload {
  /** true while the user is active (default), false when idle. */
  active?: boolean;
}

export interface HeartbeatAck {
  /** The user's overall status after this heartbeat (across all their connections). */
  status: PresenceStatus;
}

// ---- Server -> client payloads ----
export interface MessageEditedEvent {
  roomId: string;
  messageId: string;
  content: string;
  editedAt: string;
}

export interface MessageDeletedEvent {
  roomId: string;
  messageId: string;
}

export interface MessageReactionEvent {
  roomId: string;
  messageId: string;
  userId: string;
  emoji: string;
  action: 'added' | 'removed';
  /** Users with this emoji on the message after the change. */
  count: number;
}

export interface TypingEvent {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface PresenceChangedEvent {
  userId: string;
  status: PresenceStatus;
  /** Last heartbeat or disconnect; null if never seen. */
  lastSeenAt: string | null;
}

export interface RoomMembershipEvent {
  roomId: string;
}

export interface NotificationNewEvent {
  notification: NotificationDto;
  /** Unread total after this notification. */
  unreadCount: number;
}

export interface NotificationReadEvent {
  /** The notifications that just became read, or 'all'. */
  notificationIds: string[] | 'all';
  /** Unread total after the change. */
  unreadCount: number;
}

// ---- Typed event maps (use with socket.io / socket.io-client generics) ----
export interface ClientToServerEvents {
  'message:send': (payload: SendMessagePayload, ack: (res: Ack<MessageDto>) => void) => void;
  'message:edit': (payload: EditMessagePayload, ack: (res: Ack<MessageDto>) => void) => void;
  'message:delete': (payload: DeleteMessagePayload, ack: (res: Ack<null>) => void) => void;
  'message:react': (payload: ReactPayload, ack: (res: Ack<MessageDto>) => void) => void;
  'messages:sync': (payload: SyncPayload, ack: (res: Ack<MessagesPageDto>) => void) => void;
  'typing:start': (payload: TypingPayload) => void;
  'typing:stop': (payload: TypingPayload) => void;
  'presence:heartbeat': (payload: HeartbeatPayload, ack: (res: Ack<HeartbeatAck>) => void) => void;
}

export interface ServerToClientEvents {
  'message:new': (message: MessageDto) => void;
  'message:edited': (event: MessageEditedEvent) => void;
  'message:deleted': (event: MessageDeletedEvent) => void;
  'message:reaction': (event: MessageReactionEvent) => void;
  typing: (event: TypingEvent) => void;
  'presence:changed': (event: PresenceChangedEvent) => void;
  'notification:new': (event: NotificationNewEvent) => void;
  'notification:read': (event: NotificationReadEvent) => void;
  'room:added': (event: RoomMembershipEvent) => void;
  'room:removed': (event: RoomMembershipEvent) => void;
}
