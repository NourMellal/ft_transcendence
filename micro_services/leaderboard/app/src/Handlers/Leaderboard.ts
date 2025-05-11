import db from "../classes/Databases";
import { leaderboard_table_name } from "../types/DbTables";
import {
  RabbitMQMicroServices,
  RabbitMQLeaderboardOp,
  RabbitMQRequest,
  RabbitMQResponse,
} from "../types/RabbitMQMessages";


const AddWin = function (RMqRequest: RabbitMQRequest): null {
  const query = db.persistent.prepare(`UPDATE ${leaderboard_table_name} SET wins = wins + 1 WHERE UID = ? ;`);
  const res = query.run(RMqRequest.JWT.sub);
  if (res.changes !== 1) {
    const query = db.persistent.prepare(`INSERT INTO ${leaderboard_table_name} ( UID, wins, losses) VALUES ( ? , 1 , 0 );`);
    const res = query.run(RMqRequest.JWT.sub);
    if (res.changes !== 1)
      throw 'database error';
  }
  return null;
}

const AddLoss = function (RMqRequest: RabbitMQRequest): null {
  const query = db.persistent.prepare(`UPDATE ${leaderboard_table_name} SET losses = losses + 1 WHERE UID = ? ;`);
  const res = query.run(RMqRequest.JWT.sub);
  if (res.changes !== 1) {
    const query = db.persistent.prepare(`INSERT INTO ${leaderboard_table_name} ( UID, wins, losses) VALUES ( ? , 0 , 1 );`);
    const res = query.run(RMqRequest.JWT.sub);
    if (res.changes !== 1)
      throw 'database error';
  }
  return null;
}

const ListAllRank = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  const query = db.persistent.prepare(`SELECT * FROM ${leaderboard_table_name} ORDER BY losses ASC, wins DESC;`);
  const res = query.all();
  for (let i = 0; i < res.length; i++) {
    res[i].rank = i + 1;
  }
  const response: RabbitMQResponse = {
    service: RabbitMQMicroServices.Leaderboard,
    op: RabbitMQLeaderboardOp.LIST_ALL_RANK,
    req_id: RMqRequest.id,
    status: 200,
    message: JSON.stringify(res)
  };
  return response;
}

const ListUserRank = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  const query = db.persistent.prepare(`SELECT * FROM ${leaderboard_table_name} ORDER BY losses ASC, wins DESC;`);
  const res = query.all();
  let result = null;
  for (let i = 0; i < res.length; i++) {
    if (res[i].UID === RMqRequest.JWT.sub) {
      result = res[i];
      result.rank = i + 1;
      break;
    }
  }
  const response: RabbitMQResponse = {
    service: RabbitMQMicroServices.Leaderboard,
    op: RabbitMQLeaderboardOp.LIST_USER_RANK,
    req_id: RMqRequest.id,
    status: 200,
    message: JSON.stringify(result)
  };
  return response;
}

export function HandleMessage(RMqRequest: RabbitMQRequest): RabbitMQResponse | null {
  switch (RMqRequest.op) {
    case RabbitMQLeaderboardOp.ADD_WIN: {
      return AddWin(RMqRequest);
    }
    case RabbitMQLeaderboardOp.ADD_LOSS: {
      return AddLoss(RMqRequest);
    }
    case RabbitMQLeaderboardOp.LIST_ALL_RANK: {
      return ListAllRank(RMqRequest);
    }
    case RabbitMQLeaderboardOp.LIST_USER_RANK: {
      return ListUserRank(RMqRequest);
    }
    default: {
      console.log(
        "WARNING: rabbitmq HandleMessage(): operation not permitted."
      );
      throw "operation not permitted";
    }
  }
}

export default HandleMessage;
