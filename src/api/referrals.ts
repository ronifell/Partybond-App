import { api } from './client';

export interface ReferralStats {
  totalInvites: number;
  rewardedInvites: number;
  daysEarned: number;
  rewardDaysPerInvite: number;
}

export interface InviteLink {
  code: string;
  url: string;
  playStoreUrl: string;
  stats: ReferralStats;
}

export interface ReferralRow {
  id: string;
  code: string;
  status: 'pending' | 'registered' | 'rewarded' | 'expired';
  rewardDays: number;
  rewardGrantedAt: string | null;
  createdAt: string;
  invitee: {
    id: string;
    name: string;
    photoUrl: string | null;
    joinedAt: string;
  } | null;
}

export async function fetchMyInviteLink(): Promise<InviteLink> {
  const { data } = await api.get<InviteLink>('/referrals/me');
  return data;
}

export async function fetchReferralHistory(): Promise<ReferralRow[]> {
  const { data } = await api.get<{ referrals: ReferralRow[] }>('/referrals/history');
  return data.referrals;
}

export async function redeemInviteCode(code: string): Promise<void> {
  await api.post('/referrals/redeem', { code });
}

export interface ReferralLookup {
  code: string;
  inviter: { id: string; name: string; photoUrl: string | null };
}

export async function lookupInviteCode(code: string): Promise<ReferralLookup | null> {
  try {
    const { data } = await api.get<ReferralLookup>(`/referrals/lookup/${encodeURIComponent(code)}`);
    return data;
  } catch {
    return null;
  }
}
