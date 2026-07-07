import { api, getToken } from './client';
import { getApiOrigin } from '../config/env';
import type {
  ChatMessage,
  ConversationSummary,
  GroupDetail,
  GroupInvite,
  GroupSummary,
  PublicUser,
  RecentPlayer,
  SquadFillInvite,
} from './types';

export type GameProfileUser = {
  userId: string;
  name: string;
  nickname: string;
  gameId: string;
  gameName: string;
  photoUrl: string | null;
  isOnline: boolean;
};

export async function fetchRecentPlayers(): Promise<RecentPlayer[]> {
  const { data } = await api.get<{ players: RecentPlayer[] }>('/users/me/recent-players');
  return data.players;
}

export async function fetchGameProfileUsers(gameId: string): Promise<GameProfileUser[]> {
  const { data } = await api.get<{
    users: Array<{
      userId: string;
      name: string;
      nickname: string;
      photoUrl: string | null;
      isOnline: boolean;
    }>;
  }>('/users/game-profile-users', {
    params: { gameId },
  });
  return data.users.map((u) => ({
    userId: u.userId,
    name: u.name,
    nickname: u.nickname || u.name,
    gameId,
    gameName: '',
    photoUrl: u.photoUrl,
    isOnline: u.isOnline,
  }));
}

export async function fetchPublicUser(userId: string): Promise<PublicUser> {
  const { data } = await api.get<{ user: PublicUser }>(`/users/${userId}/public`);
  return data.user;
}

export async function fetchGroups(): Promise<GroupSummary[]> {
  const { data } = await api.get<{ groups: GroupSummary[] }>('/groups');
  return data.groups;
}

export async function fetchGroup(groupId: string): Promise<GroupDetail> {
  const { data } = await api.get<{ group: GroupDetail }>(`/groups/${groupId}`);
  return data.group;
}

export async function createGroup(name: string, memberIds?: string[]): Promise<GroupDetail> {
  const { data } = await api.post<{ group: GroupDetail }>('/groups', { name, memberIds });
  return data.group;
}

export async function inviteToGroup(groupId: string, inviteeId: string) {
  const { data } = await api.post(`/groups/${groupId}/invites`, { inviteeId });
  return data;
}

export async function respondGroupInvite(inviteId: string, accept: boolean) {
  const { data } = await api.post(`/groups/invites/${inviteId}/respond`, { accept });
  return data;
}

export async function fetchPendingGroupInvites(): Promise<GroupInvite[]> {
  const { data } = await api.get<{ invites: GroupInvite[] }>('/groups/invites/pending');
  return data.invites;
}

export async function createGroupSchedule(
  groupId: string,
  input: {
    dayOfWeek: number;
    timeLocal: string;
    frequency?: 'weekly' | 'biweekly';
    startsAt?: string;
  },
) {
  const { data } = await api.post(`/groups/${groupId}/schedules`, input);
  return data;
}

export async function setSessionRsvp(sessionId: string, status: 'confirmed' | 'declined') {
  await api.post(`/groups/sessions/${sessionId}/rsvp`, { status });
}

export async function fetchSquadFillSuggestions(groupId: string) {
  const { data } = await api.get<{
    slotsNeeded: number;
    suggestions: Array<{
      userId: string;
      name: string;
      photoUrl: string | null;
      gameMode: string;
      playStyle: string;
      priority: number;
    }>;
  }>(`/groups/${groupId}/squad-fill/suggestions`);
  return data;
}

export async function inviteSquadFill(groupId: string, inviteeId: string, sessionId?: string) {
  const { data } = await api.post(`/groups/${groupId}/squad-fill/invites`, { inviteeId, sessionId });
  return data;
}

/**
 * Lists pending squad-fill invites for the current user — surfaced through
 * GlobalInviteOverlay so they appear as Accept/Decline modal cards (same
 * pattern as group / session-squad invites). Includes auto-form squad invites.
 */
export async function fetchPendingSquadFillInvites(): Promise<SquadFillInvite[]> {
  const { data } = await api.get<{ invites: SquadFillInvite[] }>('/groups/squad-fill/pending');
  return data.invites;
}

export async function respondSquadFillInvite(inviteId: string, accept: boolean) {
  const { data } = await api.post<{ ok: true; groupId?: string }>(
    `/groups/squad-fill/${inviteId}/respond`,
    { accept },
  );
  return data;
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get<{ conversations: ConversationSummary[] }>('/chats');
  return data.conversations;
}

export async function openDirectChat(userId: string): Promise<ConversationSummary> {
  const { data } = await api.post<{ conversation: ConversationSummary }>('/chats/direct', { userId });
  return data.conversation;
}

export async function fetchMessages(conversationId: string, cursor?: string) {
  const { data } = await api.get<{
    messages: ChatMessage[];
    pinned: Array<{ messageId: string; body: string; pinnedAt: string }>;
  }>(`/chats/${conversationId}/messages`, { params: cursor ? { cursor } : {} });
  return data;
}

export async function sendChatMessage(conversationId: string, body: string, replyToId?: string) {
  const { data } = await api.post<{ message: ChatMessage }>(`/chats/${conversationId}/messages`, {
    body,
    replyToId,
  });
  return data.message;
}

export async function markChatRead(conversationId: string) {
  await api.post(`/chats/${conversationId}/read`);
}

export async function blockUser(userId: string) {
  await api.post('/moderation/block', { userId });
}

export const REPORT_CATEGORIES = [
  'spam',
  'harassment',
  'offensive_language',
  'inappropriate_content',
  'other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export const MAX_REPORT_ATTACHMENTS = 4;

export type ReportAttachmentMeta = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function normalizeImageMime(mime?: string | null): string {
  if (!mime || mime === 'application/octet-stream') return 'image/jpeg';
  if (/^image\/(png|jpe?g|webp)$/i.test(mime)) return mime.toLowerCase();
  return 'image/jpeg';
}

export async function reportUser(
  reportedId: string,
  category: ReportCategory,
  details?: string,
  attachments?: ReportAttachmentMeta[],
): Promise<void> {
  if (!attachments?.length) {
    await api.post('/moderation/report', { reportedId, category, details });
    return;
  }

  const origin = getApiOrigin().replace(/\/$/, '');
  const url = `${origin}/api/v1/moderation/report`;

  const buildForm = () => {
    const form = new FormData();
    form.append('reportedId', reportedId);
    form.append('category', category);
    if (details?.trim()) form.append('details', details.trim());

    attachments.forEach((attachment, index) => {
      const type = normalizeImageMime(attachment.mimeType);
      const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
      const name = attachment.fileName?.trim() || `report-${Date.now()}-${index}.${ext}`;
      form.append('attachments', {
        uri: attachment.uri,
        name,
        type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    return form;
  };

  const token = await getToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: buildForm(),
  });

  const text = await res.text();
  let body: { error?: { message?: string } } = {};
  try {
    body = text ? (JSON.parse(text) as typeof body) : {};
  } catch {
    body = {};
  }

  if (!res.ok) {
    const msg = body.error?.message || text || `Report failed (${res.status})`;
    throw new Error(msg);
  }
}
