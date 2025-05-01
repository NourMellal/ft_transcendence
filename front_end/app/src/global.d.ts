import { User } from "./api/user";

declare global {
  interface Window {
    _currentUser: User | null;
    _pushNotificationSocket: WebSocket | null;
  }
}

export {};
