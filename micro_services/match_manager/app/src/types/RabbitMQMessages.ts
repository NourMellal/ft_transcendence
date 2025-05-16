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

export type RabbitMQRequest = {
  op: RabbitMQMatchManagerOp;
  message?: string;
  id: string;
  JWT: JWT;
};

export type RabbitMQResponse = {
  op: RabbitMQMatchManagerOp;
  status: number;
  message?: string;
  req_id: string;
  service: RabbitMQMicroServices;
};
