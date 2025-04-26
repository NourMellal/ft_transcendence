import db from "../classes/Databases";
import { UserModel, users_table_name } from "../types/DbTables";
import {
  RabbitMQMicroServices,
  RabbitMQRequest,
  RabbitMQResponse,
  RabbitMQUserManagerOp,
  UpdateUser,
} from "../types/RabbitMQMessages";
import https from "https";
import fs from "fs";
import { Transform } from "stream";
import { JWT } from "../types/common";

function DownloadGoogleImage(picture_url: string, UID: string): string {
  // spliting google photo url by = and adding =s500 to get 500x500 image
  var picture_route = `/static/profile/${UID}.jpg`;
  var uri = picture_url.split("=");
  https
    .request(uri[0] + "=s500", function (response) {
      var data = new Transform();
      response.on("data", function (chunk) {
        data.push(chunk);
      });
      response.on("end", function () {
        fs.writeFileSync(picture_route, data.read());
      });
    })
    .end();
  return picture_route;
}

function CreateNewGoogleUser(jwt: JWT): UserModel {
  var picture_route = process.env.DEFAULT_PROFILE_PATH as string;
  if (jwt.picture) picture_route = DownloadGoogleImage(jwt.picture, jwt.sub);
  const user: UserModel = {
    UID: jwt.sub,
    picture_url: picture_route,
    bio:
      process.env.DEFAULT_NEW_USER_BIO ||
      "Hello everyone, new PING-PONG player here.",
  };
  const insertQuery = db.persistent.prepare(
    `INSERT INTO '${users_table_name}' ( UID , picture_url , bio ) VALUES( ? , ? , ? );`
  );
  var res = insertQuery.run(user.UID, user.picture_url, user.bio);
  if (res.changes !== 1) {
    if (
      picture_route !== (process.env.DEFAULT_PROFILE_PATH as string) &&
      fs.existsSync(picture_route)
    )
      fs.unlinkSync(picture_route);
    throw `Can not add Google user uid=${jwt.sub} to db`;
  }
  return user;
}

function CreateNewStandardUser(jwt: JWT): UserModel {
  if (!jwt.name || !jwt.picture)
    throw `Invalid jwt for standard user creation ${jwt.name}`;
  const user: UserModel = {
    UID: jwt.sub,
    picture_url: jwt.picture,
    bio:
      process.env.DEFAULT_NEW_USER_BIO ||
      "Hello everyone, new PING-PONG player here.",
  };
  const insertQuery = db.persistent.prepare(
    `INSERT INTO '${users_table_name}' ( UID , picture_url , bio ) VALUES( ? , ? , ? );`
  );
  var res = insertQuery.run(user.UID, user.picture_url, user.bio);
  if (res.changes !== 1) throw `Can not add standard user uid=${jwt.sub} to db`;
  return user;
}

function FetchUser(UID: string): UserModel | string {
  const getQuery = db.persistent.prepare(
    `SELECT * FROM '${users_table_name}' WHERE UID = ?;`
  );
  const res = getQuery.get(UID);
  if (res === undefined) return `No record for user uid ${UID} in db`;
  return res as UserModel;
}

function UpdateUserInfo(jwt: JWT, updatedFields: UpdateUser): string {
  if (!updatedFields.bio && !updatedFields.picture_url)
    throw "bad UpdateUser request: no field is supplied";
  const query = db.persistent.prepare(
    `UPDATE '${users_table_name}' SET picture_url = IFNULL(?, picture_url), bio = IFNULL(?, bio) WHERE UID = ?;`
  );
  const query_result = query.run(
    updatedFields.picture_url,
    updatedFields.bio,
    jwt.sub
  );
  if (query_result.changes !== 1)
    throw `UpdateUser request: user ${jwt.sub} not updated`;
  return "user information updated.";
}

export function HandleMessage(RMqRequest: RabbitMQRequest): RabbitMQResponse {
  const RMqResponse: RabbitMQResponse = {
    service: RabbitMQMicroServices.USER_MANAGER,
    req_id: RMqRequest.id,
  } as RabbitMQResponse;
  switch (RMqRequest.op) {
    case RabbitMQUserManagerOp.CREATE_GOOGLE:
      RMqResponse.message = JSON.stringify(CreateNewGoogleUser(RMqRequest.JWT));
      RMqResponse.status = 200;
      break;
    case RabbitMQUserManagerOp.CREATE_STANDARD:
      RMqResponse.message = JSON.stringify(
        CreateNewStandardUser(RMqRequest.JWT)
      );
      RMqResponse.status = 200;
      break;
    case RabbitMQUserManagerOp.FETCH:
      if (!RMqRequest.message)
        throw "RMqRequest.message is mandatory for operation [RabbitMQUserManagerOp.FETCH]";
      const record = FetchUser(RMqRequest.message as string);
      if (typeof record === "string") {
        RMqResponse.status = 404;
        RMqResponse.message = record;
      } else {
        RMqResponse.status = 200;
        RMqResponse.message = JSON.stringify(record);
      }
      break;
    case RabbitMQUserManagerOp.UPDATE:
      if (!RMqRequest.message)
        throw "RMqRequest.message is mandatory for operation [RabbitMQUserManagerOp.UPDATE]";
      const info = JSON.parse(RMqRequest.message) as UpdateUser;
      RMqResponse.message = UpdateUserInfo(RMqRequest.JWT, info);
      RMqResponse.status = 200;
      break;
    default:
      console.log(
        "WARNING: rabbitmq HandleMessage(): operation not implemented."
      );
      throw "operation not implemented";
  }
  return RMqResponse;
}

export default HandleMessage;
