import db from "../classes/Databases";
import { notifications_table_name } from "../types/DbTables";
import {
  RabbitMQMicroServices,
  RabbitMQNotificationsOp,
  RabbitMQRequest,
  RabbitMQResponse,
} from "../types/RabbitMQMessages";

const ListAllNotifications = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  let RMqResponse!: RabbitMQResponse;
  RMqResponse.req_id = RMqRequest.id;
  RMqResponse.service = RabbitMQMicroServices.NOTIFICATIONS;
  RMqResponse.op = RabbitMQNotificationsOp.LIST_ALL;
  RMqResponse.status = 200;
  const query = db.persistent.prepare(`SELECT * from ${notifications_table_name} WHERE user_id = ? ;`);
  const res = query.all(RMqRequest.JWT.sub);
  if (res.length > 0)
    RMqResponse.message = JSON.stringify(res);
  else
    RMqResponse.message = '[]';
  return RMqResponse;
}

const ListUnreadNotifications = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  let RMqResponse!: RabbitMQResponse;
  RMqResponse.req_id = RMqRequest.id;
  RMqResponse.service = RabbitMQMicroServices.NOTIFICATIONS;
  RMqResponse.op = RabbitMQNotificationsOp.LIST_UNREAD;
  RMqResponse.status = 200;
  const query = db.persistent.prepare(`SELECT * from ${notifications_table_name} WHERE user_id = ? AND is_read = 0 ;`);
  const res = query.all(RMqRequest.JWT.sub);
  if (res.length > 0)
    RMqResponse.message = JSON.stringify(res);
  else
    RMqResponse.message = '[]';
  return RMqResponse;
}

const DeleteNotification = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'DeleteNotification(): Error no notification uid';
  let RMqResponse!: RabbitMQResponse;
  RMqResponse.req_id = RMqRequest.id;
  RMqResponse.service = RabbitMQMicroServices.NOTIFICATIONS;
  RMqResponse.op = RabbitMQNotificationsOp.DELETE;
  const query = db.persistent.prepare(`DELETE from ${notifications_table_name} WHERE user_id = ? AND UID = ? ;`);
  const res = query.run(RMqRequest.JWT.sub, RMqRequest.message);
  if (res.changes !== 1) {
    RMqResponse.status = 400;
    RMqResponse.message = 'bad request';
  }
  else {
    RMqResponse.status = 200;
    RMqResponse.message = 'notification deleted';
  }
  return RMqResponse;
}

const SaveNotification = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'DeleteNotification(): Error no notification message';
  const query = db.persistent.prepare(`INSERT INTO ${notifications_table_name} (UID, user_uid, messageJson,is_read) VALUES ( ? , ? , ? , ? );`);
  const res = query.run(crypto.randomUUID(), RMqRequest.JWT.sub, RMqRequest.message, 0);
  if (res.changes !== 1)
    throw 'database error';
  const RMqResponse: RabbitMQResponse = {
    req_id: '',
    service: RabbitMQMicroServices.NOTIFICATIONS,
    op: RabbitMQNotificationsOp.PING_USER,
    status: 200,
    message: RMqRequest.JWT.sub
  }
  return RMqResponse;
}

const MarkNotificationAsRead = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  if (!RMqRequest.message)
    throw 'DeleteNotification(): Error no notification uid';
  let RMqResponse!: RabbitMQResponse;
  RMqResponse.req_id = RMqRequest.id;
  RMqResponse.service = RabbitMQMicroServices.NOTIFICATIONS;
  RMqResponse.op = RabbitMQNotificationsOp.MARK_READ;
  const query = db.persistent.prepare(`UPDATE ${notifications_table_name} SET is_read = 1 WHERE UID = ? AND user_uid = ? ;`)
  const res = query.run(RMqRequest.message, RMqRequest.JWT.sub);
  if (res.changes !== 1)
  {
    RMqResponse.status = 400;
    RMqResponse.message = 'bad request';
  }
  else
  {
    RMqResponse.status = 200;
    RMqResponse.message = 'notification marked as read';
  }
  return RMqResponse;
} 

export function HandleMessage(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  switch (RMqRequest.op) {
    case RabbitMQNotificationsOp.SAVE_NOTIFICATION: {
      return SaveNotification(RMqRequest);
    }
    case RabbitMQNotificationsOp.MARK_READ: {
      return MarkNotificationAsRead(RMqRequest);
    }
    case RabbitMQNotificationsOp.LIST_UNREAD: {
      return ListUnreadNotifications(RMqRequest);
    }
    case RabbitMQNotificationsOp.LIST_ALL: {
      return ListAllNotifications(RMqRequest);
    }
    case RabbitMQNotificationsOp.DELETE: {
      return DeleteNotification(RMqRequest);
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
