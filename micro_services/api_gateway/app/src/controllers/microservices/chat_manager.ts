import { FastifyReply, FastifyRequest } from "fastify";
import {
  ChatMessage,
  ConversationReadRequest,
  RabbitMQChatManagerOp,
  RabbitMQRequest,
} from "../../types/RabbitMQMessages";
import rabbitmq from "../../classes/RabbitMQ";
import { multipart_fields } from "../../types/multipart";
import db from "../../classes/Databases";
import { users_table_name } from "../../types/DbTables";
import { GetUsernamesByUIDs } from "../Common";

export const ListConversations = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  reply.hijack();
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.LIST_CONVERSATIONS,
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    if (response.status !== 200) {
      return reply.raw.end();
    }
    reply.raw.setHeader("Content-Type", "application/json");
    ListUnreadConversations(request, reply, response.message);
  });
};

export const ListUnreadConversations = async (
  request: FastifyRequest,
  reply: FastifyReply,
  DATA?: string
) => {
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.LIST_UNREAD_CONVERSATIONS,
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    if (response.status !== 200) {
      return reply.raw.end();
    }
    reply.raw.end(
      JSON.stringify({
        unread_uids: JSON.parse(response.message || "[]"),
        conversations_data: JSON.parse(DATA || "[]"),
      })
    );
  });
};

export const ReadConversation = async (
  request: FastifyRequest<{ Querystring: { uid: string; page: number } }>,
  reply: FastifyReply
) => {
  if (!request.query.uid || request.query.uid.length === 0)
    return reply.code(400).send("bad request");
  reply.hijack();
  const ReadRequest: ConversationReadRequest = {
    uid: request.query.uid,
    page: request.query.page,
  };
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.READ_CONVERSATION,
    message: JSON.stringify(ReadRequest),
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.setHeader("Content-Type", "application/json");
    reply.raw.end(response.message);
  });
};

export const ListBlocked = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  reply.hijack();
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.BLOCK_LIST,
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    try {
      reply.raw.statusCode = response.status;
      reply.raw.setHeader("Content-Type", "application/json");
      if (!response.message) throw "ListBlocked(): Invalid response";
      let payload = JSON.parse(response.message) as {
        blocked_uid: string;
        username?: string;
      }[];
      if (payload.length > 0) {
        const usernames = GetUsernamesByUIDs(payload.map((e) => e.blocked_uid));
        payload.forEach(
          (element) => (element.username = usernames.get(element.blocked_uid))
        );
      }
      reply.raw.end(JSON.stringify(payload));
    } catch (error) {
      console.log(`ListBlocked(): ${error}`);
      reply.raw.end("[]");
    }
  });
};

export const CreateConversation = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.is_valid_multipart) return reply.code(400).send("bad request");
  const name: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "name"
  );
  if (!name || !name.field_value) return reply.code(400).send("bad request");
  const to_uid: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "to_uid"
  );
  if (!to_uid || !to_uid.field_value || to_uid.field_value === request.jwt.sub)
    return reply.code(400).send("bad request");
  const message: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "message"
  );
  if (!message || !message.field_value)
    return reply.code(400).send("bad request");
  const query = db.persistent.prepare(
    `SELECT UID FROM ${users_table_name} WHERE UID = ? ;`
  );
  const res = query.all(to_uid.field_value);
  if (res.length === 0) return reply.code(400).send("bad request");
  reply.hijack();
  const conversation: ChatMessage = {
    uid: to_uid.field_value,
    name: name.field_value,
    message: message.field_value,
  };
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.CREATE_CONVERSATION,
    message: JSON.stringify(conversation),
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const RenameConversation = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (!request.query.uid || !request.is_valid_multipart)
    return reply.code(400).send("bad request");
  const name: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "name"
  );
  if (!name || !name.field_value) return reply.code(400).send("bad request");
  reply.hijack();
  const update_conversation: ChatMessage = {
    uid: request.query.uid,
    name: name.field_value,
    message: "",
  };
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.RENAME_CONVERSATION,
    message: JSON.stringify(update_conversation),
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const SendMessageToConversation = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (!request.query.uid || !request.is_valid_multipart)
    return reply.code(400).send("bad request");
  const message: multipart_fields | undefined = request.fields.find(
    (field: multipart_fields, i) => field.field_name === "message"
  );
  if (!message || !message.field_value)
    return reply.code(400).send("bad request");
  reply.hijack();
  const send_message: ChatMessage = {
    uid: request.query.uid,
    message: message.field_value,
  };
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.SEND_MESSAGE,
    message: JSON.stringify(send_message),
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const BlockUser = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (!request.query.uid) return reply.code(400).send("bad request");
  const query = db.persistent.prepare(
    `SELECT UID FROM ${users_table_name} WHERE UID = ? ;`
  );
  const res = query.all(request.query.uid);
  if (res.length === 0) return reply.code(400).send("bad request");
  reply.hijack();
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.BLOCK,
    message: request.query.uid,
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const UnBlockUser = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (!request.query.uid) return reply.code(400).send("bad request");
  reply.hijack();
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.UNBLOCK,
    message: request.query.uid,
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};

export const MarkConversationAsRead = async (
  request: FastifyRequest<{ Querystring: { uid: string } }>,
  reply: FastifyReply
) => {
  if (!request.query.uid) return reply.code(400).send("bad request");
  reply.hijack();
  const RMQrequest: RabbitMQRequest = {
    JWT: request.jwt,
    op: RabbitMQChatManagerOp.MARK_CONVERSATIONS_READ,
    message: request.query.uid,
  } as RabbitMQRequest;
  rabbitmq.sendToChatManagerQueue(RMQrequest, (response) => {
    reply.raw.statusCode = response.status;
    reply.raw.end(response.message);
  });
};
