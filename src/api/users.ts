import { api, getToken } from './client';
import { API_URL } from '../config/env';
import type { User } from './types';

export async function updateProfile(input: Partial<Pick<User, 'name' | 'age' | 'locale' | 'selectedGame'>>): Promise<User> {
  const { data } = await api.patch<{ user: User }>('/users/me', input);
  return data.user;
}

/** Multer only accepts these; RN often sends octet-stream or omits type. */
function normalizeImageMime(mime?: string): string {
  if (!mime || mime === 'application/octet-stream') return 'image/jpeg';
  if (/^image\/(png|jpe?g|webp)$/i.test(mime)) return mime.toLowerCase();
  return 'image/jpeg';
}

export type ProfilePhotoUploadMeta = {
  /** From ImagePicker `asset.mimeType` */
  mimeType?: string | null;
  /** From ImagePicker `asset.fileName` */
  fileName?: string | null;
};

/**
 * Upload profile photo using `fetch` + multipart FormData.
 * Axios + FormData is unreliable on React Native (wrong boundary / body); `fetch` matches native behavior.
 */
export async function uploadProfilePhoto(uri: string, meta?: ProfilePhotoUploadMeta): Promise<User> {
  const type = normalizeImageMime(meta?.mimeType ?? undefined);
  const ext =
    type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  const name = meta?.fileName?.trim() || `photo-${Date.now()}.${ext}`;

  const base = API_URL.replace(/\/$/, '');
  const url = `${base}/api/v1/users/me/photo`;

  const buildForm = () => {
    const form = new FormData();
    form.append('photo', {
      uri,
      name,
      type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    return form;
  };

  const doFetch = async () => {
    const token = await getToken();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: buildForm(),
    });
    const text = await res.text();
    let body: { user?: User; error?: { message?: string } } = {};
    try {
      body = text ? (JSON.parse(text) as typeof body) : {};
    } catch {
      body = {};
    }
    if (!res.ok) {
      const msg = body.error?.message || text || `Upload failed (${res.status})`;
      throw new Error(msg);
    }
    if (!body.user) throw new Error('Invalid response from server');
    return body.user;
  };

  return doFetch();
}

export async function setGameProfile(input: {
  gameId: string;
  nickname: string;
  playerId: string;
}): Promise<User> {
  const { data } = await api.put<{ user: User }>('/users/me/game-profile', input);
  return data.user;
}

export async function setFcmToken(token: string | null): Promise<void> {
  await api.put('/users/me/fcm-token', { token });
}
