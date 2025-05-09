import { FriendRequest } from './api/friends';
import { NotificationData, User } from './api/user';
import { createStateStore } from './lib/state';

const user = createStateStore<User | null>(null);
const pushNotification = createStateStore<WebSocket | null>(null);
const friendRequests = createStateStore<(FriendRequest & User)[] | null>(null);
const notifications = createStateStore<NotificationData | null>(null);

export { user, pushNotification, friendRequests, notifications };
