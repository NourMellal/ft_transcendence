import db from "../classes/Databases";
import { leaderboard_table_name } from "../types/DbTables";
import {
  RabbitMQMicroServices,
  RabbitMQLeaderboardOp,
  RabbitMQRequest,
  RabbitMQResponse,
} from "../types/RabbitMQMessages";


const AddWin = function (RMqRequest: RabbitMQRequest): null {
  if (!RMqRequest.message || RMqRequest.message.length === 0)
    throw 'AddWin(): Error no notification message';
  const query = db.persistent.prepare(`UPDATE ${leaderboard_table_name} SET wins = wins + 1 WHERE UID = ? ;`);
  const res = query.run(RMqRequest.message);
  if (res.changes !== 1) {
    const query = db.persistent.prepare(`INSERT INTO ${leaderboard_table_name} ( UID, wins, losses) VALUES ( ? , 1 , 0 );`);
    const res = query.run(RMqRequest.message);
    if (res.changes !== 1)
      throw 'database error';
  }
  return null;
}

const AddLoss = function (RMqRequest: RabbitMQRequest): null {
  if (!RMqRequest.message || RMqRequest.message.length === 0)
    throw 'AddWin(): Error no notification message';
  const query = db.persistent.prepare(`UPDATE ${leaderboard_table_name} SET losses = losses + 1 WHERE UID = ? ;`);
  const res = query.run(RMqRequest.message);
  if (res.changes !== 1) {
    const query = db.persistent.prepare(`INSERT INTO ${leaderboard_table_name} ( UID, wins, losses) VALUES ( ? , 0 , 1 );`);
    const res = query.run(RMqRequest.message);
    if (res.changes !== 1)
      throw 'database error';
  }
  return null;
}
/**
 {
  `SELECT * FROM(SELECT * RANK() OVER(ORDER BY wins DESC, losses ASC) rank FROM ${leaderboard_table_name} ) WHERE UID = 2;`
  `SELECT * RANK() OVER(ORDER BY wins DESC, losses ASC) rank FROM ${leaderboard_table_name} WHERE UID = 2;`
}
*/
const ListAllRank = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  const query = db.persistent.prepare(`SELECT * FROM ( SELECT * RANK() OVER(ORDER BY wins DESC, losses ASC) rank FROM ${leaderboard_table_name} );`);
  const res = query.all();
  const response: RabbitMQResponse = {
    service: RabbitMQMicroServices.Leaderboard,
    op: RabbitMQLeaderboardOp.LIST_ALL_RANK,
    req_id: RMqRequest.id,
    status:200,
    message: JSON.stringify(res)
  };
  return response;
}

const ListUserRank = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  const query = db.persistent.prepare(`SELECT * FROM ( SELECT * RANK() OVER(ORDER BY wins DESC, losses ASC) rank FROM ${leaderboard_table_name} ) WHERE UID = ?;`);
  const res = query.all(RMqRequest.JWT.sub);
  const response: RabbitMQResponse = {
    service: RabbitMQMicroServices.Leaderboard,
    op: RabbitMQLeaderboardOp.LIST_USER_RANK,
    req_id: RMqRequest.id,
    status:200,
    message: JSON.stringify(res)
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
