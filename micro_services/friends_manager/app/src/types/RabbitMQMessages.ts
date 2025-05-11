import { JWT } from "./common";

export enum RabbitMQMicroServices {
  API_GATEWAY = 1,
  USER_MANAGER,
  FRIENDS_MANAGER,
  NOTIFICATIONS,
  Leaderboard,
  match_manager
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
}

export type NotificationBody = {
  type: NotificationType,
  from_uid: string,
  to_uid: string
}

export type RabbitMQRequest = {
  op: RabbitMQFriendsManagerOp;
  message?: string;
  id: string;
  JWT: JWT;
};

export type RabbitMQResponse = {
  op: RabbitMQFriendsManagerOp;
  status: number;
  message?: string;
  req_id: string;
  service: RabbitMQMicroServices;
};
