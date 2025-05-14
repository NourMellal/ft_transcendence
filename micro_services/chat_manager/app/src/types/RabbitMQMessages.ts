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
