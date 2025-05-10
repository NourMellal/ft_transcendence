export type ActiveSession = {
  token_id: string;
  ip: string;
  created: number;
};

export const fetchActiveSessions = async (): Promise<ActiveSession[] | null> => {
  const res = await fetch('/api/jwt/list', {
    cache: 'no-store',
  });
  if (res.ok) {
    return (await res.json()) || [];
  }

  return null;
};
