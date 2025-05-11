import {
  RabbitMQRequest,
  RabbitMQResponse,
  RabbitMQMatchManagerOp,
} from "../types/RabbitMQMessages";

const CreateMatch = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  throw "operation not permitted";
}

const ListMatchs = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  throw "operation not permitted";
}

const WinMatch = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  throw "operation not permitted";
}

const LoseMatch = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  throw "operation not permitted";
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
