export type Chat = {
  UID: string;
  name: string;
  uid_1: string;
  uid_2: string;
  started: number;
};

export type ChatMessage = {
  message_uid: string;
  user_uid: string;
  message_text: string;
  time: number;
};

type ResponseFormat<T> = Promise<
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    }
>;

/**
 * Fetches the list of chats for the current user.
 * @returns - An array of chat objects or null if the request failed
 */
export const fetchUserChats = async (): ResponseFormat<Chat[]> => {
  const response = await fetch('/api/chat/list');

  if (response.ok) {
    return {
      success: true,
      data: (await response.json()) as Chat[],
    };
  }

  return {
    success: false,
    message: await response.text(),
  };
};

/**
 * Fetches chat messages for a given user ID and page number.
 * @param uid - The unique identifier of the user
 * @param page - The page number to fetch (default is 0)
 * @returns - An array of chat messages or null if the request failed
 */
export const fetchChatMessages = async (uid: string, page = 0): ResponseFormat<ChatMessage[]> => {
  const response = await fetch(`/api/chat/read?uid=${uid}&page=${page}`);

  if (response.ok) {
    return {
      success: true,
      data: (await response.json()) as ChatMessage[],
    };
  }

  return {
    success: false,
    message: await response.text(),
  };
};

/**
 * Sends a chat message to the server.
 * @param chat_uid - The unique identifier of the chat
 * @param formData - FormData containing the message data
 * @param formData.message - The message text to be sent
 * @returns - A boolean indicating whether the message was sent successfully
 */
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

/**
 * Creates a new chat with the given form data.
 * @param formData - FormData containing the chat data
 * @param formData.name - The name of the chat
 * @param formData.to_uid - The unique identifier of the user to chat with
 * @param formData.message - The initial message text
 * @returns - An object containing the success status and chat data or error message
 */
export const createNewChat = async (formData: FormData): ResponseFormat<string> => {
  const response = await fetch('/api/chat/new', {
    method: 'POST',
    body: formData,
  });

  if (response.ok) {
    return {
      success: true,
      data: await response.text(),
    };
  }

  return {
    success: false,
    message: await response.text(),
  };
};

/**
 * Rename an existing chat.
 * @param chat_uid - The unique identifier of the chat to be renamed
 * @param formData - FormData containing the deletion data
 * @param formData.name - The name of the chat
 * @returns - An object containing the success status and message
 */
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

/**
 * Block User by uid.
 * @param uid - The unique identifier of the user to be blocked
 * @returns - An object containing the success status and message
 */
export const blockUser = async (uid: string) => {
  const response = await fetch(`/api/chat/block?uid=${uid}`, {
    method: 'POST',
  });

  return {
    success: response.ok,
    message: await response.text(),
  };
};

export const unblockUser = async (uid: string) => {
  const response = await fetch(`/api/chat/unblock?uid=${uid}`, {
    method: 'POST',
  });

  return {
    success: response.ok,
    message: await response.text(),
  };
};
