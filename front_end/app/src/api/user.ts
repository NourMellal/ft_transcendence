import { friendRequestsState, notificationsState, userState } from '~/app-state';
import { fetchFriendRequests } from './friends';
import { fetchUndreadNotifications, setupNotificationsSocket } from './notifications';

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
    userState.set(await fetchUserInfo());
    if (!userState.get()) throw Error('User Not Logged-in');

    const [friendRequests, notifications] = await Promise.all([
      await fetchFriendRequests(),
      await fetchUndreadNotifications(),
    ]);

    // friend requests
    friendRequestsState.set(friendRequests);

    // notifications
    await setupNotificationsSocket();
    notificationsState.set(notifications);
  } catch {
    userState.set(null);
  }
};
