import { FriendRequest } from './api/friends';
import { Notification } from './api/notifications';
import { User } from './api/user';
import { createStateStore } from './lib/state';

const userStore = createStateStore<User | null>(null);
const pushNotificationStore = createStateStore<WebSocket | null>(null);
const friendRequestsStore = createStateStore<(FriendRequest & User)[] | null>(null);
const notificationsStore = createStateStore<Notification[] | null>(null);

export { userStore, pushNotificationStore, friendRequestsStore, notificationsStore };
