import { api } from './client';
import type {
  ChatMessage,
  ConversationSummary,
  GroupDetail,
  GroupInvite,
  GroupSummary,
  PublicUser,
  RecentPlayer,
} from './types';

export async function fetchRecentPlayers(): Promise<RecentPlayer[]> {
  const { data } = await api.get<{ players: RecentPlayer[] }>('/users/me/recent-players');
  return data.players;
}

export async function fetchGameProfileUsers(gameId: string): Promise<RecentPlayer[]> {
  const { data } = await api.get<{ users: RecentPlayer[] }>('/users/game-profile-users', {
    params: { gameId },
  });
  return data.users.map((u) => ({
    userId: u.userId,
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

export async function reportUser(
  reportedId: string,
  category: string,
  details?: string,
) {
  await api.post('/moderation/report', { reportedId, category, details });
}
