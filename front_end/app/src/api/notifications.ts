import { friendRequestsStore, notificationsStore, pushNotificationStore } from '~/app-state';
import { fetchWithAuth } from './auth';
import { fetchFriendRequests } from './friends';

export enum NotificationType {
  Ping = 'pong',
  NewFriendRequest = 1,
  FriendRemove,
  FriendRequestAccepted,
  FriendRequestDenied,
  GameInvite,
  Poke,
  NewMessage,
}

export type WebsocketNewMessageNotification = {
  type: NotificationType.NewMessage;
  conversation_name: string;
  conversation_uid: string;
  from_uid: string;
  to_uid: string;
  notification_uid: string;
  from_username: string;
};

type ExcludeNewMessage = Exclude<NotificationType, NotificationType.NewMessage>;

type GenericWebsocketNotification<T extends ExcludeNewMessage = ExcludeNewMessage> = {
  type: T;
  from_uid: string;
  to_uid: string;
  is_read: boolean;
};

export type WebsocketNotificationData =
  | WebsocketNewMessageNotification
  | GenericWebsocketNotification;

export const setupNotificationsSocket = async () => {
  if (pushNotificationStore.get()) return;

  const notificationSound = new Audio('/notification.mp3');
  let pingInterval: NodeJS.Timeout;

  const ticket = await (await fetchWithAuth('/api/notifications/ticket')).text();

  const ws = new WebSocket('/api/notifications/push_notification', [ticket]);
  pushNotificationStore.set(ws);

  ws.addEventListener('error', () => {
    pushNotificationStore.get()?.close();
    pushNotificationStore.set(null);
  });

  ws.addEventListener('open', () => {
    pingInterval = setInterval(() => {
      ws.send(JSON.stringify({ type: 'ping' }));
    }, 30_000);
  });

  ws.addEventListener('message', async (event) => {
    try {
      console.log('Notification:', event.data);

      const data = JSON.parse(event.data) as WebsocketNotificationData;
      if (data.type === NotificationType.NewFriendRequest || data.type === NotificationType.Poke) {
        try {
          notificationSound.play();
        } catch {}
      }

      switch (data.type) {
        case NotificationType.Ping:
          return;
        case NotificationType.NewFriendRequest:
        case NotificationType.FriendRequestDenied:
        case NotificationType.FriendRequestAccepted:
        case NotificationType.FriendRemove:
          friendRequestsStore.set(await fetchFriendRequests());
          break;
        default:
          notificationsStore.set((await fetchUndreadNotifications()).data || null);
          break;
      }
    } catch {
      console.error('Error parsing notification data');
    }
  });

  ws.addEventListener('close', () => {
    clearInterval(pingInterval);
  });
};

export const closeNotificationSocket = () => {
  const socket = pushNotificationStore.get();
  if (socket) {
    socket.close();
    pushNotificationStore.set(null);
  }
};

export type Notification = {
  type: NotificationType;
  from_uid: string;
  to_uid: string;
  notification_uid: string;
  is_read: boolean;
  from_username: string;
};

export const fetchUndreadNotifications = async () => {
  try {
    const response = await fetch(`/api/notifications/list_unread`);
    if (response.ok) {
      return {
        success: true as const,
        data: (await response.json()) as Notification[],
      };
    }

    return {
      success: false as const,
      message: await response.text(),
    };
  } catch {
    return {
      success: false as const,
      message: 'Error fetching notifications',
    };
  }
};

export const fetchAllNotifications = async () => {
  try {
    const response = await fetch(`/api/notifications/list_all`);

    if (response.ok) {
      return {
        success: true as const,
        data: (await response.json()) as Notification[],
      };
    }

    return {
      success: false as const,
      message: await response.text(),
    };
  } catch {
    return {
      success: false as const,
      message: 'Error fetching notifications',
    };
  }
};

export const markNotificationAsRead = async (uid: string) => {
  try {
    const response = await fetch(`/api/notifications/mark_as_read?uid=${uid}`, {
      method: 'POST',
    });
    return {
      success: response.ok,
      message: await response.text(),
    };
  } catch {
    return {
      success: false,
      message: 'Error marking notification as read',
    };
  }
};

export const deleteNotification = async (uid: string) => {
  try {
    const response = await fetch(`/api/notifications/delete?uid=${uid}`, {
      method: 'POST',
    });
    return {
      success: response.ok,
      message: await response.text(),
    };
  } catch {
    return {
      success: false,
      message: 'Error deleting notification',
    };
  }
};

export const pokeFriend = async (uid: string) => {
  try {
    const response = await fetch(`/api/poke?uid=${uid}`, {
      method: 'POST',
    });

    return {
      success: response.ok,
      message: await response.text(),
    };
  } catch {
    return {
      success: false,
      message: 'Error poking friend',
    };
  }
};
