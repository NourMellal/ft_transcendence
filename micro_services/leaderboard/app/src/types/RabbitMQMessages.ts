import { JWT } from "./common";

export enum RabbitMQMicroServices {
  API_GATEWAY = 1,
  USER_MANAGER,
  FRIENDS_MANAGER,
  NOTIFICATIONS,
  Leaderboard,
  history
}

export enum RabbitMQLeaderboardOp {
  ADD_WIN = 1,
  ADD_LOSS,
  LIST_ALL_RANK,
  LIST_USER_RANK,
}

export type RabbitMQRequest = {
  op: RabbitMQLeaderboardOp;
  message?: string;
  id: string;
  JWT: JWT;
};

export type RabbitMQResponse = {
  op: RabbitMQLeaderboardOp;
  status: number;
  message?: string;
  req_id: string;
  service: RabbitMQMicroServices;
};
