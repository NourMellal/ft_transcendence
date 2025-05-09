import { fetchFriendRequests } from './api/friends';
import { User } from './api/user';
import { createStateStore } from './lib/state';

const user = createStateStore<User | null>(null);
const pushNotification = createStateStore<WebSocket | null>(null);
const friendRequests = createStateStore<Awaited<
  ReturnType<typeof fetchFriendRequests>
> | null>(null);

export { user, pushNotification, friendRequests };
