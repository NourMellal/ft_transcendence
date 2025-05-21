import { blockedUsersStore } from '~/app-state';
import { fetchWithAuth } from './auth';
import { fetchUserInfo } from './user';
import { markChatNotificationsAsRead } from './notifications';

export type Chat = {
  UID: string;
  name: string;
  uid_1: string;
  uid_2: string;
  started: number;
};

export type ChatMessage = {
  message_uid?: string;
  user_uid: string;
  message_text: string;
  time: number;
  username?: string;
};

export const fetchUserChats = async () => {
  const response = await fetch('/api/chat/list');

  if (response.ok) {
    return {
      success: true as const,
      data: (await response.json()).conversations_data as Chat[],
    };
  }

  return {
    success: false as const,
    message: await response.text(),
  };
};

export const fetchChatMessages = async (uid: string, page = 0) => {
  const response = await fetchWithAuth(`/api/chat/read?uid=${uid}&page=${page}`);

  if (response.ok) {
    await markChatNotificationsAsRead(uid);
    const messages = (await response.json()) as ChatMessage[];
    return {
      success: true as const,
      data: await Promise.all(
        messages.map(async (msg) => ({
          ...msg,
          username: (await fetchUserInfo(msg.user_uid))?.username || 'Unknown',
        }))
      ),
    };
  }

  return {
    success: false as const,
    message: await response.text(),
  };
};

export const sendChatMessage = async (chat_uid: string, formData: FormData) => {
  const response = await fetch(`/api/chat/send?uid=${chat_uid}`, {
    method: 'POST',
    body: formData,
  });

  return {
    success: response.ok,
    message: await response.text(),
  };
};

export const createNewChat = async (formData: FormData) => {
  const response = await fetch('/api/chat/new', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    return {
      success: true as const,
      data: await response.text(),
    };
  }

  return {
    success: false as const,
    message: await response.text(),
  };
};

export const renameChat = async (chat_uid: string, formData: FormData) => {
  const response = await fetch(`/api/chat/rename?uid=${chat_uid}`, {
    method: 'POST',
    body: formData,
  });

  return {
    success: response.ok,
    message: await response.text(),
  };
};

export type BlockedUser = {
  blocked_uid: string;
  username: string;
};

export const fetchBlockedUsers = async () => {
  const res = await fetchWithAuth('/api/chat/blocked');
  if (res.ok) {
    return {
      success: true as const,
      data: (await res.json()) as BlockedUser[],
    };
  }
  return {
    success: false as const,
    message: await res.text(),
  };
};

export const unblockUser = async (uid: string) => {
  const response = await fetch(`/api/chat/unblock?uid=${uid}`, {
    method: 'POST',
  });

  if (response.ok) {
    const newBlockedUsers = await fetchBlockedUsers();
    if (newBlockedUsers.success) {
      blockedUsersStore.set(newBlockedUsers.data);
    }
  }

  return {
    success: response.ok,
    message: await response.text(),
  };
};

export const blockUser = async (uid: string) => {
  const response = await fetch(`/api/chat/block?uid=${uid}`, {
    method: 'POST',
  });

  if (response.ok) {
    const newBlockedUsers = await fetchBlockedUsers();
    if (newBlockedUsers.success) {
      blockedUsersStore.set(newBlockedUsers.data);
    }
  }

  return {
    success: response.ok,
    message: await response.text(),
  };
};

export const listBlockedUsers = async () => {
  const response = await fetch('/api/chat/blocked');
  if (response.ok) {
    return {
      success: true as const,
      data: (await response.json()).blocked_users as string[],
    };
  }

  return {
    success: false as const,
    message: await response.text(),
  };
};

export const checkIfBlockedByUser = async (uid: string) => {
  try {
    const response = await fetch(`/api/chat/check_blocked?uid=${uid}`);
    if (response.ok) {
      return {
        success: true as const,
        data: (await response.json()) as { is_blocked: boolean },
      };
    }

    return {
      success: false as const,
      message: await response.text(),
    };
  } catch (error) {
    return {
      success: false as const,
      message: 'Error checking if blocked by user',
    };
  }
};
