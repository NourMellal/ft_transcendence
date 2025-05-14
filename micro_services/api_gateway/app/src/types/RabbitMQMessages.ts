import { JWT } from "./AuthProvider";

export enum RabbitMQMicroServices {
  API_GATEWAY = 1,
  USER_MANAGER,
  FRIENDS_MANAGER,
  NOTIFICATIONS,
  Leaderboard,
  match_manager,
  chat_manager
}

export enum RabbitMQUserManagerOp {
  CREATE_GOOGLE = 1,
  CREATE_STANDARD,
  UPDATE,
  DELETE,
  FETCH,
}

export enum RabbitMQFriendsManagerOp {
  ADD_FRIEND = 1,
  ACCEPT_REQUEST,
  DENY_REQUEST,
  REMOVE_FRIEND,
  LIST_FRIENDS,
  LIST_REQUESTS,
  LIST_SENT_REQUESTS,
  POKE_FRIEND
}

export enum RabbitMQLeaderboardOp {
  ADD_WIN = 1,
  ADD_LOSS,
  LIST_ALL_RANK,
  LIST_USER_RANK,
}

export enum RabbitMQMatchManagerOp {
  CREATE_MATCH = 1,
  LIST_MATCHS,
  WIN_MATCH,
  LOSE_MATCH,
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
  NewMessage
}

export type NotificationBody = {
  type: NotificationType,
  from_uid: string,
  to_uid: string
}

export type UpdateUser = {
  picture_url: string | null;
  bio: string | null;
};

export type RabbitMQRequest = {
  op: number;
  message?: string;
  id: string;
  JWT: JWT;
};

export type RabbitMQResponse = {
  op: number;
  status: number;
  message?: string;
  req_id: string;
  service: RabbitMQMicroServices;
};
