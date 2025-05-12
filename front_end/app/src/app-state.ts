import { FriendRequest } from './api/friends';
import { NotificationData } from './api/notifications';
import { User } from './api/user';
import { createStateStore } from './lib/state';

const userState = createStateStore<User | null>(null);
const pushNotificationState = createStateStore<WebSocket | null>(null);
const friendRequestsState = createStateStore<(FriendRequest & User)[] | null>(null);
const notificationsState = createStateStore<NotificationData[] | null>(null);

export { userState, pushNotificationState, friendRequestsState, notificationsState };
