import { fetchWithAuth } from './auth';
import { User } from './user';

export type FriendRequest = {
  REQ_ID: string;
  from_uid: string;
  to_uid: string;
  UID: string;
  username: string;
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
        const fromUserResponse = await fetchWithAuth(`/api/user/info?uid=${request.from_uid}`);
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

export const fetchFriends = async () => {
  try {
    const response = await fetchWithAuth('/api/friends');
    if (!response.ok) {
      return {
        success: false,
        message: await response.text(),
      } as const;
    }

    return {
      success: true,
      data: (await response.json()) as User[],
    } as const;
  } catch (error) {
    console.error('Error fetching friends:', error);
    return {
      success: false,
      message: 'Failed to fetch friends',
    } as const;
  }
};

export const fetchSentFriendRequests = async () => {
  try {
    const response = await fetchWithAuth('/api/friends/sent_requests');

    if (!response.ok) {
      return {
        success: false,
        message: await response.text(),
      } as const;
    }

    return {
      success: true,
      data: (await response.json()) as FriendRequest[],
    } as const;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fetch sent friend requests',
    } as const;
  }
};

export const sendFriendRequest = async (uid: string) => {
  try {
    const response = await fetchWithAuth(`/api/friends/request?uid=${uid}`, {
      method: 'POST',
    });

    return {
      success: response.ok,
      message: await response.text(),
    } as const;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to send friend request',
    } as const;
  }
};

export const acceptFriendRequest = async (uid: string) => {
  try {
    const response = await fetchWithAuth(`/api/friends/accept?uid=${uid}`, {
      method: 'POST',
    });

    return {
      success: response.ok,
      message: await response.text(),
    } as const;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to accept friend request',
    } as const;
  }
};

export const denyFriendRequest = async (uid: string) => {
  try {
    const response = await fetchWithAuth(`/api/friends/deny?uid=${uid}`, {
      method: 'POST',
    });
    return {
      success: response.ok,
      message: await response.text(),
    } as const;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to deny friend request',
    } as const;
  }
};

export const removeFriend = async (uid: string) => {
  try {
    const response = await fetchWithAuth(`/api/friends/remove?uid=${uid}`, {
      method: 'POST',
    });
    return {
      success: response.ok,
      message: await response.text(),
    } as const;
  } catch (error) {
    return {
      success: false,
      message: 'Failed to remove friend',
    } as const;
  }
};
