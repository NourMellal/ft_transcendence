import { JWT } from "./common";

export enum RabbitMQMicroServices {
  API_GATEWAY = 1,
  USER_MANAGER,
  FRIENDS_MANAGER,
  NOTIFICATIONS,
  Leaderboard,
  match_manager,
  chat_manager,
}

export enum RabbitMQChatManagerOp {
  SEND_MESSAGE = 1,
  CREATE_CONVERSATION,
  READ_CONVERSATION,
  RENAME_CONVERSATION,
  LIST_CONVERSATIONS,
  BLOCK_LIST,
  BLOCK,
  UNBLOCK,
  LIST_UNREAD_CONVERSATIONS,
  MARK_CONVERSATIONS_READ,
}

export type ChatMessage = {
  uid : string;
  name? : string;
  message : string;
}

export type ConversationReadRequest = {
  uid : string;
  page : number;
}

export type RabbitMQRequest = {
  op: RabbitMQChatManagerOp;
  message?: string;
  id: string;
  JWT: JWT;
};

export type RabbitMQResponse = {
  op: RabbitMQChatManagerOp;
  status: number;
  message?: string;
  req_id: string;
  service: RabbitMQMicroServices;
};


// Notification types:
export enum RabbitMQNotificationsOp {
  SAVE_NOTIFICATION = 1,
  MARK_READ,
  LIST_UNREAD,
  LIST_ALL,
  DELETE,
  PING_USER,
}

export enum NotificationType {
  NewFriendRequest = 1,
  FriendRemove,
  FriendRequestAccepted,
  FriendRequestDenied,
  GameInvite,
  Poke,
  NewMessage,
}

export type NotificationBody = {
  type: NotificationType,
  from_uid: string,
  to_uid: string
}