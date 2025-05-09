import { friendRequests, pushNotification, user } from '~/app-state';
import { fetchWithAuth } from './auth';
import { fetchFriendRequests } from './friends';

export type User = {
  UID: string;
  picture_url: string;
  bio: string;
  username: string;
  totp_enabled: boolean;
};

export const fetchUserInfo = async () => {
  const res = await fetch('/api/user/info?uid=me');
  if (res.ok) {
    return await res.json();
  }
  return null;
};

export const setupUser = async () => {
  const websocket = pushNotification.get();

  try {
    // user info
    const res = await fetchWithAuth('/api/user/info?uid=me');
    if (!res.ok) throw new Error('User not signed in');

    const userDetails = await res.json();
    user.set(userDetails);

    // friend requests
    friendRequests.set(await fetchFriendRequests());
  } catch {
    user.set(null);

    if (websocket) {
      websocket.close();
      pushNotification.set(null);
    }
  }
};
