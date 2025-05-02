import { fetchWithAuth } from "./auth";

export type User = {
  UID: string;
  picture_url: string;
  bio: string;
  username: string;
  totp_enabled: boolean;
};

export const getUser = async () => {
  try {
    const res = await fetchWithAuth("/api/user/info?uid=me", {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch user info");

    window._currentUser = await res.json();
    const websocketTicket = await (
      await fetchWithAuth("/api/notifications/ticket")
    ).text();
    window._pushNotificationSocket = new WebSocket(
      "/api/notifications/push_notification",
      [websocketTicket]
    );
  } catch {
    window._currentUser = null;
    if (window._pushNotificationSocket) {
      window._pushNotificationSocket.close();
      window._pushNotificationSocket = null;
    }
  }
};
