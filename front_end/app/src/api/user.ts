import { friendRequestsStore, notificationsStore, userStore } from '~/app-state';
import { fetchFriendRequests } from './friends';
import { fetchUndreadNotifications, setupNotificationsSocket } from './notifications';
import { showToast } from '~/components/toast';
import { fetchWithAuth } from './auth';

export type User = {
  UID: string;
  picture_url: string;
  bio: string;
  username: string;
  totp_enabled: boolean;
};

export const fetchUserInfo = async (uid?: string) => {
  const res = await fetch(`/api/user/info?uid=${uid ?? 'me'}`, {
    cache: 'no-store',
  });
  if (res.ok) {
    const data = (await res.json()) as User;
    data.picture_url += `?t=${Date.now()}`; // to avoid the broser from caching the image
    return data;
  }
  return null;
};

export const setupUser = async () => {
  try {
    // user info
    userStore.set(await fetchUserInfo());
    if (!userStore.get()) throw Error('User Not Logged-in');

    const [friendRequests, notifications] = await Promise.all([
      await fetchFriendRequests(),
      await fetchUndreadNotifications(),
    ]);

    // friend requests
    friendRequestsStore.set(friendRequests);

    // notifications
    await setupNotificationsSocket();
    if (notifications.success) {
      notificationsStore.set(notifications.data);
    } else {
      showToast({
        type: 'error',
        message: notifications.message,
      });
    }
  } catch {
    userStore.set(null);
  }
};

export enum MatchStatus {
  LOSS = -1,
  PENDING = 0,
  WIN = 1,
}

export enum MatchType {
  Single1V1 = 1,
  Single2V2 = 2,
  Tournament = 3,
  AI = 4,
}

export type MatchHistoryEntry = {
  match_UID: string;
  UID: string; // user uid
  match_type: MatchType;
  started: number;
  state: MatchStatus;
};

export const fetchMatchHistory = async (uid: string) => {
  const response = await fetchWithAuth(`/api/match/history?uid=${uid}`);

  if (response.ok) {
    return {
      success: true as const,
      data: (await response.json()) as MatchHistoryEntry[],
    };
  }

  return {
    success: false as const,
    message: await response.text(),
  };
};
