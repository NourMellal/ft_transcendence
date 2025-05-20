import { friendRequestsStore, notificationsStore, pushNotificationStore } from '~/app-state';
import { fetchWithAuth } from './auth';
import { fetchFriendRequests } from './friends';
import { fetchUserInfo } from './user';

export enum NotificationType {
  Ping = 'pong',
  NewFriendRequest = 1,
  FriendRemove = 2,
  FriendRequestAccepted = 3,
  FriendRequestDenied = 4,
  GameInvite = 5,
  Poke = 6,
  NewMessage = 7,
  ConversationNameChanged,
  UserBlocked,
  UserUnBlocked,
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

export const getNotificationTitle = (type: NotificationType) => {
  switch (type) {
    case NotificationType.NewFriendRequest:
      return 'You have a new friend request';
    case NotificationType.FriendRequestAccepted:
      return 'Your friend request has been accepted';
    case NotificationType.FriendRequestDenied:
      return 'Your friend request has been denied';
    case NotificationType.GameInvite:
      return 'You have a new game invite';
    case NotificationType.Poke:
      return 'You have been poked';
    case NotificationType.NewMessage:
      return 'You have a new message';
    case NotificationType.FriendRemove:
      return 'You have been removed from a friend';
    default:
      return 'You have a new notification';
  }
};

export const getNotificationMessage = async (data: Notification) => {
  const fromUsername = (await fetchUserInfo(data.from_uid))?.username || 'an unknown user';
  switch (data.type) {
    case NotificationType.NewFriendRequest:
      return `${fromUsername} sent you a friend request`;
    case NotificationType.FriendRequestAccepted:
      return `${fromUsername} accepted your friend request`;
    case NotificationType.FriendRequestDenied:
      return `${fromUsername} denied your friend request`;
    case NotificationType.GameInvite:
      return `${fromUsername} invited you to play a game`;
    case NotificationType.Poke:
      return `${fromUsername} poked you`;
    case NotificationType.NewMessage:
      return `${fromUsername} sent you a message`;
    case NotificationType.FriendRemove:
      return `${fromUsername} removed you from their friends`;
    default:
      return 'You have a new notification';
  }
};
