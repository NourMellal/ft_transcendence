import { pushNotification, user } from '~/app-state';
import { fetchWithAuth } from './auth';

export type User = {
  UID: string;
  picture_url: string;
  bio: string;
  username: string;
  totp_enabled: boolean;
};

export const setupUser = async () => {
  const websocket = pushNotification.get();

  try {
    const res = await fetchWithAuth('/api/user/info?uid=me', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch user info');

    user.set(await res.json());

    if (!websocket) {
      const websocketTicket = await (
        await fetchWithAuth('/api/notifications/ticket')
      ).text();
      const socket = new WebSocket('/api/notifications/push_notification', [
        websocketTicket,
      ]);
      socket.onmessage = (e) => {
        console.debug(e.type);
      };
      pushNotification.set(socket);
    }
  } catch {
    user.set(null);

    if (websocket) {
      websocket.close();
      pushNotification.set(null);
    }
  }
};
