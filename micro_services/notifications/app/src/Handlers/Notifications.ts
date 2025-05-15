import db from "../classes/Databases";
import { notifications_table_name } from "../types/DbTables";
import {
  NotificationBody,
  RabbitMQMicroServices,
  RabbitMQNotificationsOp,
  RabbitMQRequest,
  RabbitMQResponse,
} from "../types/RabbitMQMessages";

const GetResponseMessage = function (result: any[]): string {
  for (let i = 0; i < result.length; i++) {
    const element = result[i];
    try {
      element.DATA = JSON.parse(element.messageJson);
      element.DATA.notification_uid = element.UID;
      element.DATA.read = element.is_read;
    } catch (error) {
    }
  }
  return JSON.stringify(result, (key, value) => key === "UID" || key === "is_read" || key === "messageJson" ? undefined : value);
}

const ListAllNotifications = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  let RMqResponse: RabbitMQResponse = {
    req_id: RMqRequest.id,
    service: RabbitMQMicroServices.NOTIFICATIONS,
    op: RabbitMQNotificationsOp.LIST_ALL,
    status: 200
  } as RabbitMQResponse;
  const query = db.persistent.prepare(`SELECT UID, messageJson, is_read from ${notifications_table_name} WHERE user_uid = ? ;`);
  const res = query.all(RMqRequest.JWT.sub) as any[];
  if (res.length > 0)
    RMqResponse.message = GetResponseMessage(res);
  else
    RMqResponse.message = '[]';
  return RMqResponse;
}

const ListUnreadNotifications = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  let RMqResponse: RabbitMQResponse = {
    req_id: RMqRequest.id,
    service: RabbitMQMicroServices.NOTIFICATIONS,
    op: RabbitMQNotificationsOp.LIST_UNREAD,
    status: 200
  } as RabbitMQResponse;
  const query = db.persistent.prepare(`SELECT UID, messageJson, is_read from ${notifications_table_name} WHERE user_uid = ? AND is_read = 0 ;`);
  const res = query.all(RMqRequest.JWT.sub);
  if (res.length > 0)
    RMqResponse.message = GetResponseMessage(res);
  else
    RMqResponse.message = '[]';
  return RMqResponse;
}

const DeleteNotification = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  let RMqResponse: RabbitMQResponse = {
    req_id: RMqRequest.id,
    service: RabbitMQMicroServices.NOTIFICATIONS,
    op: RabbitMQNotificationsOp.DELETE
  } as RabbitMQResponse;
  if (!RMqRequest.message) {
    RMqResponse.status = 400;
    RMqResponse.message = 'bad request';
    return RMqResponse;
  }
  const query = db.persistent.prepare(`DELETE from ${notifications_table_name} WHERE user_uid = ? AND UID = ? ;`);
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
  const notificationBody = JSON.parse(RMqRequest.message) as NotificationBody;
  const query = db.persistent.prepare(`INSERT INTO ${notifications_table_name} (UID, user_uid, messageJson,is_read) VALUES ( ? , ? , ? , ? );`);
  const notif = {
    UID: crypto.randomUUID(),
    messageJson: RMqRequest.message,
    is_read: 0
  };
  const res = query.run(notif.UID, notificationBody.to_uid, notif.messageJson, 0);
  if (res.changes !== 1)
    throw 'database error';
  const RMqResponse: RabbitMQResponse = {
    req_id: '',
    service: RabbitMQMicroServices.NOTIFICATIONS,
    op: RabbitMQNotificationsOp.PING_USER,
    status: 200,
    message: GetResponseMessage([notif])
  }
  return RMqResponse;
}

const MarkNotificationAsRead = function (RMqRequest: RabbitMQRequest): RabbitMQResponse {
  let RMqResponse: RabbitMQResponse = {
    req_id: RMqRequest.id,
    service: RabbitMQMicroServices.NOTIFICATIONS,
    op: RabbitMQNotificationsOp.MARK_READ
  } as RabbitMQResponse;
  if (!RMqRequest.message) {
    RMqResponse.status = 400;
    RMqResponse.message = 'bad request';
    return RMqResponse;
  }
  const uids = RMqRequest.message.split(';');
  if (uids.length == 0) {
    RMqResponse.status = 400;
    RMqResponse.message = 'bad request';
    return RMqResponse;
  }
  let queryString = `UPDATE ${notifications_table_name} SET is_read = 1 WHERE user_uid = ? AND ( `;
  for (let i = 0; i < uids.length; i++) {
    queryString += 'UID = ? ';
    if (i < uids.length - 1)
      queryString += '|| ';
  }
  queryString += ' );';
  const query = db.persistent.prepare(queryString);
  const res = query.run(RMqRequest.JWT.sub, ...uids);
  if (res.changes === 0) {
    RMqResponse.status = 400;
    RMqResponse.message = 'bad request';
  }
  else {
    RMqResponse.status = 200;
    RMqResponse.message = 'notifications marked as read';
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
