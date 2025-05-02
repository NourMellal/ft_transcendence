import { JWT } from "./common";

export enum RabbitMQMicroServices {
  API_GATEWAY = 1,
  USER_MANAGER,
  FRIENDS_MANAGER,
  NOTIFICATIONS,
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
  FriendRequestAccepted,
  GameInvite,
  Poke,
}

export type NotificationBody = {
  type: NotificationType,
  from_uid: string
}

export type RabbitMQRequest = {
  op: RabbitMQNotificationsOp;
  message?: string;
  id: string;
  JWT: JWT;
};

export type RabbitMQResponse = {
  op: RabbitMQNotificationsOp;
  status: number;
  message?: string;
  req_id: string;
  service: RabbitMQMicroServices;
};
