import { DatabaseSync } from 'node:sqlite';
import fs from 'fs'
import https from 'https'
import { Transform } from 'stream';
import { UserModel } from '../types/DbTables';
import { JWT } from '../types/RabbitMQMessages';

class Databases {
    transient: DatabaseSync;
    persistent: DatabaseSync;

    constructor(p: DatabaseSync) {
        this.transient = new DatabaseSync(':memory:');
        this.persistent = p;
    }
    public init(): void {
        try {
            db.persistent.exec("create table IF NOT EXISTS 'users' ('UID' TEXT NOT NULL PRIMARY KEY, 'display_name' TEXT NOT NULL UNIQUE, 'picture_url' TEXT NOT NULL, 'bio' TEXT)");
        }
        catch (err) {
            console.log("fatal error: " + err);
            process.exit(1);
        }
    }
    public CreateNewUser(jwt: JWT): UserModel {
        var picture_route = '/static/profile/default.png'
        if (jwt.picture) {
            // spliting google photo url by = and adding =s500 to get 500x500 image
            picture_route = `/static/profile/${jwt.sub}.jpg`;
            var uri = jwt.picture.split('=');
            var req = https.request(uri[0] + '=s500');
            https.request(uri[0] + '=s500', function (response) {
                var data = new Transform();
                response.on('data', function (chunk) {
                    data.push(chunk);
                });
                response.on('end', function () {
                    fs.writeFileSync(`/static/profile/${jwt.sub}.jpg`, data.read());
                });
            }).end();
        }
        const user: UserModel = {
            UID: jwt.sub,
            display_name: jwt.name || crypto.randomUUID(),
            picture_url: picture_route,
            bio: process.env.DEFAULT_NEW_USER_BIO || 'Hello everyone, new PING-PONG player here.'
        }
        const insertQuery = this.persistent.prepare('INSERT INTO users ( UID , display_name , picture_url , bio ) VALUES( ? , ? , ? , ? );');
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
    public FetchUser(UID: string): UserModel {
        const getQuery = db.persistent.prepare('SELECT * FROM users WHERE UID = ?;');
        const res = getQuery.get(UID);
        if (res === undefined)
            throw `No record for user uid ${UID} in db`;
        return res as UserModel;
    }
}

const db = new Databases(new DatabaseSync(process.env.SQLITE_PATH || '/database/db.sqlite'))

export default db;