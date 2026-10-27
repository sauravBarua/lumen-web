import { apiClient, getAccessToken } from '@/lib/api/browser';
import { env } from '@/env';
import type {
  Member,
  Message,
  MessagesPage,
  NotificationsPage,
  Preference,
  PresenceItem,
  PublicRoomsPage,
  Room,
  RoomRole,
} from '@/lib/types';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

function fail(response: Response, error: unknown): never {
  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : `Request failed (${response.status})`;
  throw new ApiError(response.status, message, error);
}

type Result = { data?: unknown; error?: unknown; response: Response };

function unwrap<T>(r: Result): T {
  if (!r.response.ok || r.data === undefined) fail(r.response, r.error);
  return r.data as T;
}

function ensureOk(r: Result): void {
  if (!r.response.ok) fail(r.response, r.error);
}

// ---- rooms ----
export const listRooms = async () => unwrap<Room[]>(await apiClient.GET('/api/v1/rooms'));

export async function createRoom(body: {
  name: string;
  description?: string;
  type: 'PUBLIC' | 'PRIVATE';
}) {
  return unwrap<Room>(await apiClient.POST('/api/v1/rooms', { body }));
}

export async function listPublicRooms(query: { q?: string; cursor?: string }) {
  return unwrap<PublicRoomsPage>(
    await apiClient.GET('/api/v1/rooms/public', { params: { query: { ...query, limit: 20 } } }),
  );
}

export async function joinRoom(roomId: string) {
  return unwrap<Room>(
    await apiClient.POST('/api/v1/rooms/{roomId}/join', { params: { path: { roomId } } }),
  );
}

export async function openDm(userId: string) {
  return unwrap<Room>(await apiClient.POST('/api/v1/dms', { body: { userId } }));
}

export async function markRoomRead(roomId: string, messageId: string) {
  return unwrap<{ unreadCount: number }>(
    await apiClient.POST('/api/v1/rooms/{roomId}/read', {
      params: { path: { roomId } },
      body: { messageId },
    }),
  );
}

// ---- members & presence ----
export async function listMembers(roomId: string) {
  return unwrap<Member[]>(
    await apiClient.GET('/api/v1/rooms/{roomId}/members', { params: { path: { roomId } } }),
  );
}

export async function addMember(roomId: string, userId: string) {
  return unwrap<Member>(
    await apiClient.POST('/api/v1/rooms/{roomId}/members', {
      params: { path: { roomId } },
      body: { userId },
    }),
  );
}

export async function setMemberRole(roomId: string, userId: string, role: RoomRole) {
  return unwrap<Member>(
    await apiClient.PATCH('/api/v1/rooms/{roomId}/members/{userId}', {
      params: { path: { roomId, userId } },
      body: { role },
    }),
  );
}

export async function removeMember(roomId: string, userId: string) {
  ensureOk(
    await apiClient.DELETE('/api/v1/rooms/{roomId}/members/{userId}', {
      params: { path: { roomId, userId } },
    }),
  );
}

export async function roomPresence(roomId: string) {
  const body = unwrap<{ items: PresenceItem[] }>(
    await apiClient.GET('/api/v1/rooms/{roomId}/presence', { params: { path: { roomId } } }),
  );
  return body.items;
}

export async function lookupPresence(userIds: string[]) {
  if (!userIds.length) return [];
  const body = unwrap<{ items: PresenceItem[] }>(
    await apiClient.POST('/api/v1/presence/lookup', { body: { userIds: userIds.slice(0, 100) } }),
  );
  return body.items;
}

// ---- messages ----
export async function listMessages(roomId: string, before?: string) {
  return unwrap<MessagesPage>(
    await apiClient.GET('/api/v1/rooms/{roomId}/messages', {
      params: { path: { roomId }, query: { before, limit: 30 } },
    }),
  );
}

/** Uploads one file (creating its message). XHR, because fetch cannot report upload progress. */
export async function uploadAttachment(
  roomId: string,
  file: File,
  caption: string,
  onProgress: (percent: number) => void,
): Promise<Message> {
  const token = await getAccessToken();
  return new Promise<Message>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${env.NEXT_PUBLIC_API_URL}/api/v1/rooms/${roomId}/attachments`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body as Message);
      const message = (body as { message?: unknown } | undefined)?.message;
      reject(
        new ApiError(xhr.status, typeof message === 'string' ? message : 'Upload failed', body),
      );
    };
    xhr.onerror = () => reject(new ApiError(0, 'Network error'));
    const form = new FormData();
    form.append('file', file);
    if (caption) form.append('content', caption);
    xhr.send(form);
  });
}

// ---- notifications ----
export async function listNotifications(tab: 'all' | 'unread', cursor?: string) {
  return unwrap<NotificationsPage>(
    await apiClient.GET('/api/v1/notifications', {
      params: { query: { limit: 20, cursor, unread: tab === 'unread' ? true : undefined } },
    }),
  );
}

export async function notificationCount() {
  const body = unwrap<{ unreadCount: number }>(
    await apiClient.GET('/api/v1/notifications/unread-count'),
  );
  return body.unreadCount;
}

export async function markNotificationRead(id: string) {
  ensureOk(await apiClient.POST('/api/v1/notifications/{id}/read', { params: { path: { id } } }));
}

export async function markAllNotificationsRead() {
  ensureOk(await apiClient.POST('/api/v1/notifications/read-all'));
}

export async function getPreferences() {
  const body = unwrap<{ items: Preference[] }>(
    await apiClient.GET('/api/v1/notifications/preferences'),
  );
  return body.items;
}

export async function updatePreference(
  type: Preference['type'],
  patch: { inApp?: boolean; email?: boolean },
) {
  return unwrap<Preference>(
    await apiClient.PATCH('/api/v1/notifications/preferences/{type}', {
      params: { path: { type } },
      body: patch,
    }),
  );
}
