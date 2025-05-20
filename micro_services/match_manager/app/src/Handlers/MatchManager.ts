import db from "../classes/Databases";
import rabbitmq from "../classes/RabbitMQ";
import { matchs_table_name, matchType } from "../types/DbTables";
import {
  RabbitMQRequest,
  RabbitMQResponse,
  RabbitMQMatchManagerOp,
  RabbitMQMicroServices,
  RabbitMQLeaderboardOp,
} from "../types/RabbitMQMessages";

const match_max_timeout_ms = parseInt(process.env.MATCH_MAX_TIMEOUT_MIN || '15') * 60 * 1000;

const CreateMatch = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response: RabbitMQResponse = {
    service: RabbitMQMicroServices.match_manager,
    op: RabbitMQMatchManagerOp.CREATE_MATCH,
    req_id: RMqRequest.id
  } as RabbitMQResponse;
  const match_type = Number.parseInt(RMqRequest.message);
  if (!(match_type in matchType)) {
    response.status = 400;
    response.message = 'Invalid match type';
    return response;
  }
  {
    const query = db.persistent.prepare(`SELECT state FROM ${matchs_table_name} WHERE UID = ? AND state = 0;`)
    const res = query.all(RMqRequest.JWT.sub);
    if (res.length !== 0) {
      response.status = 400;
      response.message = 'Finish the current match before starting a new one';
      return response;
    }
  }
  const match_uid = crypto.randomUUID();
  const query = db.persistent.prepare(`INSERT INTO ${matchs_table_name} ( match_UID, UID, match_type, started, state ) VALUES ( ? , ? , ? , ? , 0 );`)
  const res = query.run(match_uid, RMqRequest.JWT.sub, match_type, Date.now() / 1000);
  if (res.changes !== 1) {
    response.status = 500;
    response.message = 'Database error, try again';
    return response;
  }
  setTimeout(() => {
    const query = db.persistent.prepare(`UPDATE ${matchs_table_name} SET state = -1 WHERE match_UID = ? AND state = 0;`);
    const res = query.run(match_uid);
    if (res.changes === 1) {
      // Send to leaderboard
      const lose_request: RabbitMQRequest = {
        id: '',
        op: RabbitMQLeaderboardOp.ADD_LOSS as number,
        JWT: RMqRequest.JWT
      };
      rabbitmq.sendToLeaderboardQueue(lose_request);
    }
  }, match_max_timeout_ms);
  response.status = 200;
  response.message = match_uid;
  return response;
}

const ListMatchs = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'invalid request';
  const requestParams = JSON.parse(RMqRequest.message) as { UID: string, page: number };
  const query = db.persistent.prepare(`SELECT * FROM ${matchs_table_name} WHERE UID = ? LIMIT 10 OFFSET (10 * ?);`)
  const res = query.all(requestParams.UID, requestParams.page);
  let response: RabbitMQResponse = {
    service: RabbitMQMicroServices.match_manager,
    op: RabbitMQMatchManagerOp.LIST_MATCHS,
    req_id: RMqRequest.id,
    status: 200,
    message: JSON.stringify(res)
  };
  return response;
}

const WinMatch = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response: RabbitMQResponse = {
    service: RabbitMQMicroServices.match_manager,
    op: RabbitMQMatchManagerOp.WIN_MATCH,
    req_id: RMqRequest.id
  } as RabbitMQResponse;
  const query = db.persistent.prepare(`UPDATE ${matchs_table_name} SET state = 1 WHERE match_UID = ? AND UID = ? AND state = 0;`);
  const res = query.run(RMqRequest.message, RMqRequest.JWT.sub);
  if (res.changes !== 1) {
    response.status = 400;
    response.message = 'invalid request';
    return response;
  }
  // Send to leaderboard
  {
    const win_request: RabbitMQRequest = {
      id: '',
      op: RabbitMQLeaderboardOp.ADD_WIN as number,
      JWT: RMqRequest.JWT
    };
    rabbitmq.sendToLeaderboardQueue(win_request);
  }
  response.status = 200;
  response.message = 'You won';
  return response;
}

const LoseMatch = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response: RabbitMQResponse = {
    service: RabbitMQMicroServices.match_manager,
    op: RabbitMQMatchManagerOp.LOSE_MATCH,
    req_id: RMqRequest.id
  } as RabbitMQResponse;
  const query = db.persistent.prepare(`UPDATE ${matchs_table_name} SET state = -1 WHERE match_UID = ? AND UID = ? AND state = 0;`);
  const res = query.run(RMqRequest.message, RMqRequest.JWT.sub);
  if (res.changes !== 1) {
    response.status = 400;
    response.message = 'invalid request';
    return response;
  }
  // Send to leaderboard
  {
    const lose_request: RabbitMQRequest = {
      id: '',
      op: RabbitMQLeaderboardOp.ADD_LOSS as number,
      JWT: RMqRequest.JWT
    };
    rabbitmq.sendToLeaderboardQueue(lose_request);
  }
  response.status = 200;
  response.message = 'You lose';
  return response;
}

export function HandleMessage(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  switch (RMqRequest.op) {
    case RabbitMQMatchManagerOp.CREATE_MATCH: {
      return CreateMatch(RMqRequest);
    }
    case RabbitMQMatchManagerOp.LIST_MATCHS: {
      return ListMatchs(RMqRequest);
    }
    case RabbitMQMatchManagerOp.WIN_MATCH: {
      return WinMatch(RMqRequest);
    }
    case RabbitMQMatchManagerOp.LOSE_MATCH: {
      return LoseMatch(RMqRequest);
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
