import { api } from './client';
import type { PlayStyle, SessionMode, SessionSkillTier } from './types';

export type AutoGroupStatus = 'searching' | 'ready' | 'fulfilled' | 'expired' | 'canceled';

export interface AutoGroupRequestSummary {
  id: string;
  status: AutoGroupStatus;
  groupId: string;
  groupName: string;
  confirmedCount: number;
  playersNeeded: number;
  gameId: string;
  expiresAt: string;
  createdAt: string;
}

export interface AutoGroupRequestDetail {
  id: string;
  status: AutoGroupStatus;
  groupId: string;
  gameId: string;
  gameMode: SessionMode;
  playStyle: PlayStyle;
  skillTier: SessionSkillTier;
  playersNeeded: number;
  expiresAt: string;
  createdAt: string;
  confirmedCount: number;
  pendingInvites: Array<{
    id: string;
    expiresAt: string;
    invitee: { id: string; name: string; photoUrl: string | null };
  }>;
  members: Array<{ id: string; name: string; photoUrl: string | null; role: string }>;
}

export interface CreateAutoGroupInput {
  name: string;
  gameId: string;
  gameMode: SessionMode;
  playStyle: PlayStyle;
  skillTier: SessionSkillTier;
  playersNeeded: number;
  minAge?: number;
  maxAge?: number;
}

export async function fetchAutoGroupRequests(): Promise<AutoGroupRequestSummary[]> {
  const { data } = await api.get<{ requests: AutoGroupRequestSummary[] }>('/auto-groups');
  return data.requests;
}

export async function fetchAutoGroupRequest(id: string): Promise<AutoGroupRequestDetail> {
  const { data } = await api.get<{ request: AutoGroupRequestDetail }>(`/auto-groups/${id}`);
  return data.request;
}

export async function createAutoGroup(
  input: CreateAutoGroupInput,
): Promise<AutoGroupRequestDetail> {
  const { data } = await api.post<{ request: AutoGroupRequestDetail }>('/auto-groups', input);
  return data.request;
}

export async function cancelAutoGroup(id: string): Promise<void> {
  await api.post(`/auto-groups/${id}/cancel`);
}
