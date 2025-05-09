import { fetchWithAuth } from './auth';
import { User } from './user';

export type FriendRequest = {
  REQ_ID: string;
  from_uid: string;
  to_uid: string;
};

export const fetchFriendRequests = async () => {
  const response = await fetchWithAuth('/api/friends/requests');
  if (!response.ok) {
    throw new Error(`Failed to fetch friend requests: ${response.status}`);
  }
  const requests = (await response.json()) as FriendRequest[] | null;

  if (!requests) return null;

  return (
    await Promise.all(
      requests.map(async (request) => {
        const fromUserResponse = await fetchWithAuth(
          `/api/user/info?uid=${request.from_uid}`
        );
        if (fromUserResponse.ok) {
          const from_user = (await fromUserResponse.json()) as User;
          return {
            ...request,
            ...from_user,
          };
        }
      })
    )
  ).filter((item): item is NonNullable<typeof item> => item != null);
};
