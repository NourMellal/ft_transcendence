export type User = {
  UID: string;
  picture_url: string;
  bio: string;
  friends_uids: string[] | null;
  username: string;
  totp_enabled: boolean;
};

export const getUser = async (): Promise<User | null> => {
  try {
    const res = await fetch("/api/user/info?uid=me", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
};
