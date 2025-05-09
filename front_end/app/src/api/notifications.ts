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
  const notificationSound = new Audio('/notification.mp3');
  socket.addEventListener('error', (err) => {
    console.error('WebSocket error:', err);
  });

  socket.addEventListener('message', async (event) => {
    console.log(event);

    try {
      const data = JSON.parse(event.data) as NotificationData;
      if (
        data.type === NotificationType.NewFriendRequest ||
        data.type === NotificationType.Poke
      ) {
        try {
          notificationSound.play();
        } catch {}
      }

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
    } catch {
      console.error('Error parsing notification data');
    }
  });
  pushNotification.set(socket);
};

export const closeNotificationSocket = () => {
  const socket = pushNotification.get();
  if (socket) {
    socket.close();
    pushNotification.set(null);
  }
};
