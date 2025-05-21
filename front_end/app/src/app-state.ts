import { BlockedUser } from './api/chat';
import { FriendRequest } from './api/friends';
import { NotificationData } from './api/notifications';
import { User } from './api/user';
import { createStateStore } from './lib/state';

const userStore = createStateStore<User | null>(null);
const pushNotificationStore = createStateStore<WebSocket | null>(null);
const friendRequestsStore = createStateStore<(FriendRequest & User)[] | null>(null);
const notificationsStore = createStateStore<NotificationData[] | null>(null);
const blockedUsersStore = createStateStore<BlockedUser[]>([]);

export {
  userStore,
  pushNotificationStore,
  friendRequestsStore,
  notificationsStore,
  blockedUsersStore,
};
