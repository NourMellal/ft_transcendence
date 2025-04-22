export type User = {
  UID: string;
  picture_url: string;
  bio: string;
  friends_uids: string[] | null;
  username: string;
};

export const getUser = async (): Promise<User | null> => {
  const token = localStorage.getItem("uid");

  if (!token) return null;

  try {
    const res = await fetch("/api/user/info?uid=me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
};
