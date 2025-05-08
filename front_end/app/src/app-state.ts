import { User } from './api/user';
import { createStateStore } from './lib/state';

const user = createStateStore<User | null>(null);
const pushNotification = createStateStore<WebSocket | null>(null);

export { user, pushNotification };
