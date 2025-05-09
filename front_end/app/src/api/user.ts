import { friendRequests, pushNotification, user } from '~/app-state';
import { fetchWithAuth } from './auth';
import { fetchFriendRequests } from './friends';

enum NotificationType {
  NewFriendRequest = 1,
  FriendRequestAccepted = 2,
  FriendRequestDenied = 3,
  Poke = 4,
}

export type NotificationData = {
  type: NotificationType;
  from_uid: string;
  to_uid: string;
};

export type User = {
  UID: string;
  picture_url: string;
  bio: string;
  username: string;
  totp_enabled: boolean;
};

export const setupUser = async () => {
  const websocket = pushNotification.get();

  try {
    // user info
    const res = await fetchWithAuth('/api/user/info?uid=me');
    if (!res.ok) throw new Error('User not signed in');

    const userDetails = await res.json();
    user.set(userDetails);

    // push notifications
    if (!websocket) {
      const websocketTicket = await (
        await fetchWithAuth('/api/notifications/ticket')
      ).text();
      const socket = new WebSocket('/api/notifications/push_notification', [
        websocketTicket,
      ]);
      socket.onmessage = async (e) => {
        const data = JSON.parse(e.data) as NotificationData;

        switch (data.type) {
          case NotificationType.NewFriendRequest:
          case NotificationType.FriendRequestDenied:
            friendRequests.set(await fetchFriendRequests());
            break;
        }
      };
      pushNotification.set(socket);
    }

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
