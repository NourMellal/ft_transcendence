import db from "../classes/Databases";
import { UserModel, users_table_name } from "../types/DbTables";
import {
  RabbitMQMicroServices,
  RabbitMQRequest,
  RabbitMQResponse,
  RabbitMQUserManagerOp,
  UpdateUser,
} from "../types/RabbitMQMessages";
import fs from "fs";
import { DownloadGoogleImage } from "./helper";

async function CreateNewGoogleUser(request: RabbitMQRequest): Promise<RabbitMQResponse> {
  let response: RabbitMQResponse = {
    req_id: request.id,
    service: RabbitMQMicroServices.USER_MANAGER,
    op: RabbitMQUserManagerOp.CREATE_GOOGLE,
  } as RabbitMQResponse;
  try {
    db.persistent.exec("BEGIN TRANSACTION;")
    var picture_route = process.env.DEFAULT_PROFILE_PATH as string;
    if (request.JWT.picture)
      picture_route = await DownloadGoogleImage(request.JWT.picture, request.JWT.sub);
    const user: UserModel = {
      UID: request.JWT.sub,
      picture_url: picture_route,
      bio: process.env.DEFAULT_NEW_USER_BIO as string,
    };
    const insertQuery = db.persistent.prepare(
      `INSERT INTO '${users_table_name}' ( UID , picture_url , bio ) VALUES( ? , ? , ? );`,
    );
    var res = insertQuery.run(user.UID, user.picture_url, user.bio);
    if (res.changes !== 1) {
      if (
        picture_route !== (process.env.DEFAULT_PROFILE_PATH as string) &&
        fs.existsSync(picture_route)
      )
        fs.unlinkSync(picture_route);
      throw `Can not add Google user uid=${request.JWT.sub} to db`;
    }
    db.persistent.exec("COMMIT;")
    response.status = 200;
    response.message = JSON.stringify(user);
  } catch (error) {
    db.persistent.exec("ROLLBACK;")
    console.log(`[ERROR] CreateNewGoogleUser(): ${error}`);
    response.status = 400;
    response.message = 'bad request';
  }
  return response;
}

function CreateNewStandardUser(request: RabbitMQRequest): RabbitMQResponse {
  let response: RabbitMQResponse = {
    req_id: request.id,
    service: RabbitMQMicroServices.USER_MANAGER,
    op: RabbitMQUserManagerOp.CREATE_STANDARD,
  } as RabbitMQResponse;
  try {
    if (!request.JWT.name || !request.JWT.picture)
      throw `Invalid jwt for standard user creation ${request.JWT.sub}`;
    const user: UserModel = {
      UID: request.JWT.sub,
      picture_url: request.JWT.picture,
      bio: process.env.DEFAULT_NEW_USER_BIO as string,
    };
    const insertQuery = db.persistent.prepare(
      `INSERT INTO '${users_table_name}' ( UID , picture_url , bio ) VALUES( ? , ? , ? );`,
    );
    var res = insertQuery.run(user.UID, user.picture_url, user.bio);
    if (res.changes !== 1)
      throw `Can not add standard user uid=${request.JWT.sub} to db`;
    response.status = 200;
    response.message = JSON.stringify(user);
  } catch (error) {
    console.log(`[ERROR] CreateNewStandardUser(): ${error}`)
    response.status = 400;
    response.message = "bad request";
  }
  return response;
}

function FetchUser(request: RabbitMQRequest): RabbitMQResponse {
  let response: RabbitMQResponse = {
    req_id: request.id,
    service: RabbitMQMicroServices.USER_MANAGER,
    op: RabbitMQUserManagerOp.FETCH,
  } as RabbitMQResponse;
  try {
    if (!request.message)
      throw "No uid to fetch";
    const getQuery = db.persistent.prepare(
      `SELECT * FROM '${users_table_name}' WHERE UID = ?;`,
    );
    const res = getQuery.get(request.message);
    if (res === undefined) {
      response.status = 404;
      response.message = 'User not found';
    } else {
      response.status = 200;
      response.message = JSON.stringify(res);
    }
  } catch (error) {
    console.log(`[ERROR] FetchUser(): ${error}`)
    response.status = 400;
    response.message = 'bad request';
  }
  return response;
}


function FetchMultipleUsersList(request: RabbitMQRequest): RabbitMQResponse {
  let response: RabbitMQResponse = {
    req_id: request.id,
    service: RabbitMQMicroServices.USER_MANAGER,
    op: RabbitMQUserManagerOp.FETCH_MULTIPLE_INTERNAL,
  } as RabbitMQResponse;
  try {
    if (!request.message)
      throw "request.message is mandatory for operation [RabbitMQUserManagerOp.FETCH_MULTIPLE_INTERNAL]";
    let querystring = `SELECT * FROM '${users_table_name}' WHERE `;
    const uids = request.message.split(';');
    for (let i = 0; i < uids.length; i++) {
      const element = uids[i];
      querystring += 'UID = ? ';
      if (i < uids.length - 1)
        querystring += 'OR ';
    }
    response.status = 200;
    if (uids.length > 0) {
      querystring += ';';
      const getQuery = db.persistent.prepare(querystring);
      const res = getQuery.all(...uids);
      response.message = JSON.stringify(res);
    } else {
      response.message = '[]';
    }
  } catch (error) {
    console.log(`[ERROR] CreateNewStandardUser(): ${error}`)
    response.status = 400;
    response.message = "bad request";
  }
  return response;
}


function UpdateUserInfo(request: RabbitMQRequest): RabbitMQResponse {
  let response: RabbitMQResponse = {
    req_id: request.id,
    service: RabbitMQMicroServices.USER_MANAGER,
    op: RabbitMQUserManagerOp.UPDATE,
  } as RabbitMQResponse;
  try {
    if (!request.message)
      throw "request.message is mandatory for operation [RabbitMQUserManagerOp.UPDATE]";
    const updatedFields = JSON.parse(request.message) as UpdateUser;
    if (!updatedFields.bio && !updatedFields.picture_url)
      throw "bad UpdateUser request: no field is supplied";
    const query = db.persistent.prepare(
      `UPDATE '${users_table_name}' SET picture_url = IFNULL(?, picture_url), bio = IFNULL(?, bio) WHERE UID = ?;`
    );
    const query_result = query.run(updatedFields.picture_url, updatedFields.bio, request.JWT.sub);
    if (query_result.changes !== 1)
      throw `user ${request.JWT.sub} not updated`;
    response.status = 200;
    response.message = 'user information updated.';
  } catch (error) {
    console.log(`[ERROR] UpdateUserInfo(): ${error}`)
    response.status = 400;
    response.message = 'bad request.';
  }
  return response;
}

export async function HandleMessage(RMqRequest: RabbitMQRequest): Promise<RabbitMQResponse> {
  switch (RMqRequest.op) {
    case RabbitMQUserManagerOp.CREATE_GOOGLE: {
      return await CreateNewGoogleUser(RMqRequest);
    }
    case RabbitMQUserManagerOp.CREATE_STANDARD: {
      return CreateNewStandardUser(RMqRequest);
    }
    case RabbitMQUserManagerOp.FETCH: {
      return FetchUser(RMqRequest);
    }
    case RabbitMQUserManagerOp.FETCH_MULTIPLE_INTERNAL: {
      return FetchMultipleUsersList(RMqRequest);
    }
    case RabbitMQUserManagerOp.UPDATE: {
      return UpdateUserInfo(RMqRequest);
    }
    default:{
      console.log(
        "WARNING: rabbitmq HandleMessage(): operation not implemented.",
      );
      throw "operation not implemented";
    }
  }
}

export default HandleMessage;
