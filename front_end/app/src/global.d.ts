import { User } from "./api/user";

declare global {
  interface Window {
    _currentUser: User | null;
  }
}

export {};
