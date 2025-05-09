import { friendRequests, pushNotification } from '~/app-state';
import { fetchWithAuth } from './auth';
import { fetchFriendRequests } from './friends';

enum NotificationType {
  NewFriendRequest = 1,
  FriendRequestAccepted,
  FriendRequestDenied,
  GameInvite,
  Poke,
}

export type NotificationData = {
  type: NotificationType;
  from_uid: string;
  to_uid: string;
};

export const setupNotificationsSocket = async () => {
  if (pushNotification.get()) return;

  const websocketTicket = await (
    await fetchWithAuth('/api/notifications/ticket')
  ).text();
  const socket = new WebSocket('/api/notifications/push_notification', [
    websocketTicket,
  ]);
  socket.onmessage = async (event) => {
    console.log(event);

    const data = JSON.parse(event.data) as NotificationData;

    switch (data.type) {
      case NotificationType.NewFriendRequest:
      case NotificationType.FriendRequestDenied:
      case NotificationType.FriendRequestAccepted:
        friendRequests.set(await fetchFriendRequests());
        break;
      case NotificationType.Poke:
        console.log(data);

        break;
    }
  };
  pushNotification.set(socket);
};
