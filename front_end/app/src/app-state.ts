import { FriendRequest } from './api/friends';
import { Notification } from './api/notifications';
import { User } from './api/user';
import { createStateStore } from './lib/state';

const userState = createStateStore<User | null>(null);
const pushNotificationState = createStateStore<WebSocket | null>(null);
const friendRequestsState = createStateStore<(FriendRequest & User)[] | null>(null);
const notificationsState = createStateStore<Notification[] | null>(null);

export { userState, pushNotificationState, friendRequestsState, notificationsState };
