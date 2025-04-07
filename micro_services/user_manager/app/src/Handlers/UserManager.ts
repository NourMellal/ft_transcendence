import db from "../classes/Databases";
import { UserModel, users_table_name } from "../types/DbTables";
import { JWT, RabbitMQRequest, RabbitMQResponse, RabbitMQUserManagerOp, UpdateUser } from "../types/RabbitMQMessages";
import https from 'https'
import fs from 'fs'
import { Transform } from 'stream';

function DownloadGoogleImage(picture_url: string, UID: string): string {
    // spliting google photo url by = and adding =s500 to get 500x500 image
    var picture_route = `/static/profile/${UID}.jpg`;
    var uri = picture_url.split('=');
    https.request(uri[0] + '=s500', function (response) {
        var data = new Transform();
        response.on('data', function (chunk) {
            data.push(chunk);
        });
        response.on('end', function () {
            fs.writeFileSync(picture_route, data.read());
        });
    }).end();
    return picture_route;
}

function CreateNewUser(jwt: JWT): UserModel {
    var picture_route = '/static/profile/default.png'
    if (jwt.picture)
        picture_route = DownloadGoogleImage(jwt.picture, jwt.sub);
    const user: UserModel = {
        UID: jwt.sub,
        display_name: jwt.name || crypto.randomUUID(),
        picture_url: picture_route,
        bio: process.env.DEFAULT_NEW_USER_BIO || 'Hello everyone, new PING-PONG player here.'
    }
    const insertQuery = db.persistent.prepare(`INSERT INTO '${users_table_name}' ( UID , display_name , picture_url , bio ) VALUES( ? , ? , ? , ? );`);
    var res = insertQuery.run(user.UID, user.display_name, user.picture_url, user.bio);
    if (res.changes !== 1 && user.display_name !== jwt.name)
        throw `Can not add user uid=${jwt.sub} with display_name=${user.display_name} to db`;
    if (res.changes !== 1) {
        user.display_name = crypto.randomUUID();
        res = insertQuery.run(user.UID, user.display_name, user.picture_url, user.bio);
    }
    if (res.changes !== 1)
        throw `Can not add user uid=${jwt.sub} with display_name=${user.display_name} to db`;
    return user;
}

function FetchUser(UID: string): UserModel {
    const getQuery = db.persistent.prepare(`SELECT * FROM '${users_table_name}' WHERE UID = ?;`);
    const res = getQuery.get(UID);
    if (res === undefined)
        throw `No record for user uid ${UID} in db`;
    return res as UserModel;
}

function UpdateUserInfo(jwt: JWT, updatedFields: UpdateUser): string {
    if (!updatedFields.display_name && !updatedFields.bio && !updatedFields.picture_url)
        throw 'bad UpdateUser request: no field is supplied';
    var query_sql = `UPDATE '${users_table_name}' SET display_name = ISNULL(?, display_name), picture_url = ISNULL(?, picture_url), bio = ISNULL(?, bio) WHERE UID = ?;`;
    const query = db.persistent.prepare(query_sql);
    const query_result = query.run(updatedFields.display_name, updatedFields.picture_url, updatedFields.bio, jwt.sub);
    if (query_result.changes !== 1)
        throw `UpdateUser request: user ${jwt.sub} not updated`;
    return 'user information updated.'
}

export function HandleMessage(RMqRequest: RabbitMQRequest): RabbitMQResponse {
    const RMqResponse: RabbitMQResponse = {} as RabbitMQResponse;
    RMqResponse.req_id = RMqRequest.id;
    switch (RMqRequest.op) {
        case RabbitMQUserManagerOp.CREATE:
            RMqResponse.message = JSON.stringify(CreateNewUser(RMqRequest.JWT));
            break;
        case RabbitMQUserManagerOp.FETCH:
            if (!RMqRequest.message)
                throw 'RMqRequest.message is mandatory';
            RMqResponse.message = JSON.stringify(FetchUser(RMqRequest.message as string));
            break;
        case RabbitMQUserManagerOp.UPDATE:
            if (!RMqRequest.message)
                throw 'RMqRequest.message is mandatory';
            const info = JSON.parse(RMqRequest.message) as UpdateUser;
            RMqResponse.message = UpdateUserInfo(RMqRequest.JWT, info);
            break;
        default:
            console.log("WARNING: rabbitmq HandleMessage(): operation not implemented.");
            throw 'operation not implemented';
    }
    RMqResponse.status = 200;
    return RMqResponse;
}

export default HandleMessage;