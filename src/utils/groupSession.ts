import type { GroupDetail } from '../api/types';

export type RsvpStatus = 'pending' | 'confirmed' | 'declined';

export function getMyRsvpStatus(
  group: GroupDetail | undefined,
  userId: string | undefined,
): RsvpStatus | null {
  if (!group?.nextSession || !userId) return null;
  return (group.nextSession.rsvps.find((r) => r.userId === userId)?.status as RsvpStatus) ?? null;
}

export function shouldShowRsvpActions(status: RsvpStatus | null): boolean {
  return status === null || status === 'pending';
}

export function getSessionRsvpResponses(group: GroupDetail) {
  if (!group.nextSession) return [];
  const nameById = Object.fromEntries(group.members.map((m) => [m.id, m.name]));
  return group.nextSession.rsvps
    .filter((r) => r.status === 'confirmed' || r.status === 'declined')
    .map((r) => ({
      userId: r.userId,
      name: nameById[r.userId] ?? '—',
      status: r.status as 'confirmed' | 'declined',
    }));
}
