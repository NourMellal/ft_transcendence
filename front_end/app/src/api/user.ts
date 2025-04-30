import { fetchWithAuth } from "./auth";

export type User = {
  UID: string;
  picture_url: string;
  bio: string;
  username: string;
  totp_enabled: boolean;
};

export const getUser = async (): Promise<User | null> => {
  try {
    const res = await fetchWithAuth("/api/user/info?uid=me", {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
};
