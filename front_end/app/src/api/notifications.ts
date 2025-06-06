import {
  friendRequestsStore,
  notificationsStore,
  pushNotificationStore,
} from '~/app-state';
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
  ConversationNameChanged = 8,
  UserBlocked = 9,
  UserUnBlocked = 10,
}

export type ChatUpdateNotification = {
  type: NotificationType.NewMessage | NotificationType.ConversationNameChanged;
  conversation_name: string;
  conversation_uid: string;
  from_uid: string;
  to_uid: string;
  notification_uid: string;
  from_username: string;
  is_read: boolean;
};

type ExcludeNewMessage = Exclude<
  NotificationType,
  NotificationType.NewMessage | NotificationType.ConversationNameChanged
>;

type GenericNotification<T extends ExcludeNewMessage = ExcludeNewMessage> = {
  type: T;
  notification_uid: string;
  from_uid: string;
  to_uid: string;
  is_read: boolean;
};

export type NotificationData = ChatUpdateNotification | GenericNotification;

export const setupNotificationsSocket = async () => {
  if (pushNotificationStore.get()) return;

  const notificationSound = new Audio('/notification.mp3');
  let pingInterval: NodeJS.Timeout;

  const ticket = await (
    await fetchWithAuth('/api/notifications/ticket')
  ).text();

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
        case NotificationType.Ping:
          return;
        case NotificationType.NewFriendRequest:
        case NotificationType.FriendRequestDenied:
        case NotificationType.FriendRequestAccepted:
          friendRequestsStore.set(await fetchFriendRequests());
          break;
        default:
          notificationsStore.set(
            (await fetchUndreadNotifications()).data || null,
          );
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

export const fetchUndreadNotifications = async () => {
  try {
    const response = await fetch(`/api/notifications/list_unread`);
    if (response.ok) {
      const data = (await response.json()) as NotificationData[];
      return {
        success: true as const,
        data: data.reverse(),
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
      const data = (await response.json()) as NotificationData[];
      return {
        success: true as const,
        data: data.reverse(),
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
    case NotificationType.ConversationNameChanged:
      return 'The conversation name has been changed';
    case NotificationType.UserBlocked:
      return 'You have been blocked';
    case NotificationType.UserUnBlocked:
      return 'You have been unblocked';
    default:
      return 'You have a new notification';
  }
};

export const getNotificationMessage = async (data: NotificationData) => {
  const fromUsername =
    (await fetchUserInfo(data.from_uid))?.username || 'an unknown user';
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
    case NotificationType.ConversationNameChanged:
      return `${fromUsername} changed the conversation name`;
    case NotificationType.UserBlocked:
      return `${fromUsername} blocked you`;
    case NotificationType.UserUnBlocked:
      return `${fromUsername} unblocked you`;
    default:
      return 'You have a new notification';
  }
};

export const markChatNotificationsAsRead = async (uid: string) => {
  const allNotifications = await fetchAllNotifications();
  if (allNotifications.success) {
    const chatNotifications = allNotifications.data.filter(
      (notification) =>
        notification.type === NotificationType.NewMessage &&
        notification.conversation_uid === uid,
    );

    await Promise.all(
      chatNotifications.map(
        async (notification) =>
          await markNotificationAsRead(notification.notification_uid),
      ),
    );
    notificationsStore.set(
      allNotifications.data.filter(
        (notification) =>
          notification.type !== NotificationType.NewMessage ||
          notification.conversation_uid !== uid,
      ),
    );
    return {
      success: true,
      message: 'Chat notifications marked as read',
    };
  }
  console.error('Error fetching notifications:', allNotifications.message);
  return {
    success: false,
    message: 'Error fetching notifications',
  };
};
