import db from "../classes/Databases";
import { block_table_name, conversations_table_name, ConversationsUIDsModel } from "../types/DbTables";
import {
  RabbitMQMicroServices,
  RabbitMQChatManagerOp,
  RabbitMQRequest,
  RabbitMQResponse,
  ChatMessage,
  ConversationReadRequest,
} from "../types/RabbitMQMessages";


// HINT: assumes RMqRequest.message is a valid user's uid
function BlockUser(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response = {
    req_id: RMqRequest.id,
    op: RabbitMQChatManagerOp.BLOCK,
    service: RabbitMQMicroServices.chat_manager,
  } as RabbitMQResponse;
  if (RMqRequest.message === RMqRequest.JWT.sub) {
    response.status = 400;
    response.message = 'invalid request';
    return response;
  }
  try {
    const query = db.persistent.prepare(`INSERT INTO '${block_table_name}' ( UID , user_uid , blocked_uid ) VALUES ( ? , ? , ? );`);
    const res = query.run(`${RMqRequest.JWT.sub};${RMqRequest.message}`, RMqRequest.JWT.sub, RMqRequest.message);
    if (res.changes !== 1)
      throw 'db error';
    response.status = 200;
    response.message = `user ${RMqRequest.message} blocked`;
    return response;
  } catch (error) {
    response.status = 400;
    response.message = 'user already blocked';
    return response;
  }
}

function ListBlockedUsers(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  let response = {
    req_id: RMqRequest.id,
    op: RabbitMQChatManagerOp.BLOCK_LIST,
    service: RabbitMQMicroServices.chat_manager,
  } as RabbitMQResponse;
  const query = db.persistent.prepare(`SELECT blocked_uid FROM ${block_table_name} WHERE user_uid = ? ;`);
  const res = query.all(RMqRequest.JWT.sub);
  response.status = 200;
  response.message = JSON.stringify(res);
  return response;
}

function UnblockUser(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response = {
    req_id: RMqRequest.id,
    op: RabbitMQChatManagerOp.UNBLOCK,
    service: RabbitMQMicroServices.chat_manager,
  } as RabbitMQResponse;
  const query = db.persistent.prepare(`DELETE FROM ${block_table_name} WHERE user_uid = ? AND blocked_uid = ?;`);
  const res = query.run(RMqRequest.JWT.sub, RMqRequest.message);
  if (res.changes !== 1) {
    response.status = 400;
    response.message = 'bad request';
    return response;
  }
  response.status = 200;
  response.message = 'user unblocked';
  return response;
}

function SendMessageToConversation(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response = {
    req_id: RMqRequest.id,
    op: RabbitMQChatManagerOp.SEND_MESSAGE,
    service: RabbitMQMicroServices.chat_manager,
  } as RabbitMQResponse;
  let request: ChatMessage;
  try {
    request = JSON.parse(RMqRequest.message) as ChatMessage;
  } catch (error) {
    response.status = 400;
    response.message = 'bad request';
    return response;
  }
  {
    // Check permissions:
    const query = db.persistent.prepare(`SELECT uid_1,uid_2 FROM ${conversations_table_name} WHERE UID = ?;`);
    const res = query.get(request.uid) as ConversationsUIDsModel;
    if (!res || (res.uid_1 !== RMqRequest.JWT.sub && res.uid_2 !== RMqRequest.JWT.sub)) {
      response.status = 400;
      response.message = 'bad request';
      return response;
    }
    {
      let other_uid = res.uid_1;
      if (other_uid === RMqRequest.JWT.sub)
        other_uid = res.uid_2;
      // Check block:
      const block_query = db.persistent.prepare(`SELECT UID FROM ${block_table_name} WHERE UID = ? OR UID = ?;`);
      const block_res = block_query.all(`${RMqRequest.JWT.sub};${other_uid}`, `${other_uid};${RMqRequest.JWT.sub}`);
      if (block_res.length !== 0) {
        response.status = 400;
        response.message = 'bad request';
        return response;
      }
    }
  }
  const query = db.persistent.prepare(`INSERT INTO '${request.uid}' (message_uid , user_uid, message_text, time) VALUES (?,?,?,?);`);
  const res = query.run(crypto.randomUUID(), RMqRequest.JWT.sub, request.message, Date.now() / 1000);
  if (res.changes !== 1) {
    response.status = 400;
    response.message = 'bad request';
    return response;
  }
  {
    // Send a notification
  }
  response.status = 200;
  response.message = 'MessageSent';
  return response;
}

// HINT: assumes request.uid is a valid user's uid
function CreateConversation(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response = {
    req_id: RMqRequest.id,
    op: RabbitMQChatManagerOp.CREATE_CONVERSATION,
    service: RabbitMQMicroServices.chat_manager,
  } as RabbitMQResponse;
  let request: ChatMessage;
  try {
    request = JSON.parse(RMqRequest.message) as ChatMessage;
    if (request.uid === RMqRequest.JWT.sub || !request.name || request.name.length === 0 || request.name.length > 32)
      throw 'invalid conversation data';
  } catch (error) {
    response.status = 400;
    response.message = 'bad request';
    return response;
  }
  {
    // Check block:
    const query = db.persistent.prepare(`SELECT UID FROM ${block_table_name} WHERE UID = ? OR UID = ?;`);
    const res = query.all(`${RMqRequest.JWT.sub};${request.uid}`, `${request.uid};${RMqRequest.JWT.sub}`);
    if (res.length !== 0) {
      response.status = 400;
      response.message = 'bad request';
      return response;
    }
  }
  const conversation_uid = crypto.randomUUID();
  {
    const query = db.persistent.prepare(`INSERT INTO '${conversations_table_name}' (UID , name, uid_1, uid_2, started) VALUES (?,?,?,?,?);`);
    const res = query.run(conversation_uid, request.name, RMqRequest.JWT.sub, request.uid, Date.now() / 1000);
    if (res.changes !== 1) {
      response.status = 400;
      response.message = 'bad request';
      return response;
    }
  }
  {
    const query = db.persistent.prepare(
      `create table IF NOT EXISTS '${conversation_uid}' ('message_uid' TEXT NOT NULL, 'user_uid' TEXT NOT NULL, 'message_text' TEXT NOT NULL, 'time' INT NOT NULL PRIMARY KEY);`
    );
    const res = query.run();
    if (res.changes !== 1) {
      {
        const query = db.persistent.prepare(`DELETE FROM ${conversations_table_name} WHERE UID = ?;`);
        const res = query.run(conversation_uid);
      }
      response.status = 400;
      response.message = 'bad request';
      return response;
    }
  }
  const query = db.persistent.prepare(`INSERT INTO '${conversation_uid}' (message_uid , user_uid, message_text, time) VALUES (?,?,?,?);`);
  const res = query.run(crypto.randomUUID(), RMqRequest.JWT.sub, request.message, Date.now() / 1000);
  if (res.changes !== 1) {
    response.status = 400;
    response.message = 'bad request';
    return response;
  }
  {
    // Send a notification
  }
  response.status = 200;
  response.message = conversation_uid;
  return response;
}

function ListConversations(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  let response = {
    req_id: RMqRequest.id,
    op: RabbitMQChatManagerOp.LIST_CONVERSATIONS,
    service: RabbitMQMicroServices.chat_manager,
  } as RabbitMQResponse;
  const query = db.persistent.prepare(`SELECT * FROM ${conversations_table_name} WHERE UID_1 = ? OR UID_2 = ? ;`);
  const res = query.all(RMqRequest.JWT.sub, RMqRequest.JWT.sub);
  response.status = 200;
  response.message = JSON.stringify(res);
  return response;
}

function ReadConversation(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response = {
    req_id: RMqRequest.id,
    op: RabbitMQChatManagerOp.LIST_CONVERSATIONS,
    service: RabbitMQMicroServices.chat_manager,
  } as RabbitMQResponse;
  try {
    let request: ConversationReadRequest;
    request = JSON.parse(RMqRequest.message) as ConversationReadRequest;
    {
      // Check read Permissions:
      const query = db.persistent.prepare(`SELECT uid_1, uid_2 FROM ${conversations_table_name} WHERE UID = ?;`);
      const res = query.get(request.uid) as ConversationsUIDsModel;
      if (!res || (res.uid_1 !== RMqRequest.JWT.sub && res.uid_2 !== RMqRequest.JWT.sub))
        throw 'not permission';
    }
    const query = db.persistent.prepare(`SELECT * FROM '${request.uid}' ORDER BY time DESC LIMIT 10 OFFSET (10 * ?);`);
    const res = query.all(request.page);
    response.status = 200;
    response.message = JSON.stringify(res);
    return response;
  } catch (error) {
    console.log(`ReadConversation(): ${error}`)
    response.status = 400;
    response.message = 'bad request';
    return response;
  }
}

function RenameConversation(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'Invalid request';
  let response = {
    req_id: RMqRequest.id,
    op: RabbitMQChatManagerOp.RENAME_CONVERSATION,
    service: RabbitMQMicroServices.chat_manager,
  } as RabbitMQResponse;
  try {
    let request = JSON.parse(RMqRequest.message) as ChatMessage;
    if (!request.name || request.name.length === 0 || request.name.length > 32)
      throw 'invalid new conversation name';
    const query = db.persistent.prepare(`UPDATE ${conversations_table_name} SET name = ? WHERE UID = ? AND ( uid_1 = ? OR uid_2 = ?)`);
    const res = query.run(request.name, request.uid, RMqRequest.JWT.sub, RMqRequest.JWT.sub);
    if (res.changes !== 1)
      throw 'invalid permission or conversation uid';
    response.status = 200;
    response.message = 'conversation renamed';
    return response;
  } catch (error) {
    response.status = 400;
    response.message = 'bad request';
    return response;
  }
}

export function HandleMessage(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  switch (RMqRequest.op) {
    case RabbitMQChatManagerOp.BLOCK: {
      return BlockUser(RMqRequest);
    }
    case RabbitMQChatManagerOp.UNBLOCK: {
      return UnblockUser(RMqRequest);
    }
    case RabbitMQChatManagerOp.BLOCK_LIST: {
      return ListBlockedUsers(RMqRequest);
    }
    case RabbitMQChatManagerOp.SEND_MESSAGE: {
      return SendMessageToConversation(RMqRequest);
    }
    case RabbitMQChatManagerOp.CREATE_CONVERSATION: {
      return CreateConversation(RMqRequest);
    }
    case RabbitMQChatManagerOp.RENAME_CONVERSATION: {
      return RenameConversation(RMqRequest);
    }
    case RabbitMQChatManagerOp.LIST_CONVERSATIONS: {
      return ListConversations(RMqRequest);
    }
    case RabbitMQChatManagerOp.READ_CONVERSATION: {
      return ReadConversation(RMqRequest);
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
