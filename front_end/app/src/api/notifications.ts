import { friendRequestsState, pushNotificationState } from '~/app-state';
import { fetchWithAuth } from './auth';
import { fetchFriendRequests } from './friends';

export enum NotificationType {
  NewFriendRequest = 1,
  FriendRemove,
  FriendRequestAccepted,
  FriendRequestDenied,
  GameInvite,
  Poke,
}

export type NotificationData = {
  type: NotificationType;
  from_uid: string;
  to_uid: string;
  is_read: boolean;
};

export const setupNotificationsSocket = async () => {
  if (pushNotificationState.get()) return;

  const notificationSound = new Audio('/notification.mp3');
  let pingInterval: NodeJS.Timeout;

  const ticket = await (await fetchWithAuth('/api/notifications/ticket')).text();

  const ws = new WebSocket('/api/notifications/push_notification', [ticket]);
  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };

  ws.onopen = () => {
    pingInterval = setInterval(() => {
      ws.send(JSON.stringify({ type: 'ping' }));
    }, 20_000);
  };

  ws.onmessage = async (event) => {
    console.log(event);

    try {
      const data = JSON.parse(event.data) as NotificationData;
      if (data.type === NotificationType.NewFriendRequest || data.type === NotificationType.Poke) {
        try {
          notificationSound.play();
        } catch {}
      }

      switch (data.type) {
        case NotificationType.NewFriendRequest:
        case NotificationType.FriendRequestDenied:
        case NotificationType.FriendRequestAccepted:
        case NotificationType.FriendRemove:
          friendRequestsState.set(await fetchFriendRequests());
          break;
        case NotificationType.Poke:
          console.log(data);

          break;
      }
    } catch {
      console.error('Error parsing notification data');
    }
  };

  ws.onclose = () => {
    clearInterval(pingInterval);
  };
  pushNotificationState.set(ws);
};

export const closeNotificationSocket = () => {
  const socket = pushNotificationState.get();
  if (socket) {
    socket.close();
    pushNotificationState.set(null);
  }
};

export type Notification = {
  UID: string;
  messageJson: string;
  is_read: number;
};

export const fetchUndreadNotifications = async () => {
  const response = await fetch(`/api/notifications/list_unread`);
  const jsonResponse = (await response.json()) as Notification[];
  if (response.ok) {
    return jsonResponse.map((json) => JSON.parse(json.messageJson) as NotificationData);
  }

  return null;
};

export const fetchAllNotifications = async () => {
  const response = await fetch(`/api/notifications/list_all`);
  const jsonResponse = (await response.json()) as Notification[];
  if (response.ok) {
    return jsonResponse.map((json) => JSON.parse(json.messageJson) as NotificationData);
  }

  return null;
};

export const markNotificationAsRead = async () => {
  const response = await fetch(`/api/notifications/mark_as_read`, {
    method: 'POST',
  });
  if (response.ok) {
    return true;
  }

  return false;
};

export const deleteNotification = async () => {
  const response = await fetch(`/api/notifications/delete`, {
    method: 'POST',
  });
  if (response.ok) {
    return true;
  }

  return false;
};

export const pokeFriend = async (uid: string) => {
  const response = await fetch(`/api/poke?uid=${uid}`, {
    method: 'POST',
  });

  if (response.ok) {
    return true;
  }

  return false;
};
