import { DatabaseSync } from 'node:sqlite';
import { RabbitMQReq } from '../types/RabbitMQMessages';
import fs from 'fs'
import https from 'https'
import { Transform } from 'stream';

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
    public CreateNewUser(msg: RabbitMQReq) {
        const jwt: { sub: string, display_name?: string, picture?: string } = JSON.parse(msg.message);
        const query = this.persistent.prepare('INSERT INTO users ( UID , display_name , picture_url , bio ) VALUES( ? , ? , ? , ? );');
        var picture_route = '/static/profile/default.png'
        if (jwt.picture) {
            // split google photo url by = and adding =s500 to get 500x500 image
            var uri = jwt.picture.split('=');
            var req = https.request(uri[0] + '=s500');
            https.request(uri[0] + '=s500', function (response) {
                var data = new Transform();
                response.on('data', function (chunk) {
                    data.push(chunk);
                });
                response.on('end', function () {
                    picture_route = `/static/profile/${jwt.sub}.jpg`;
                    fs.writeFileSync(`/static/profile/${jwt.sub}.jpg`, data.read());
                });
            }).end();
        }
        const res = query.run(jwt.sub, jwt.display_name || jwt.sub, picture_route, 'Hello everyone, new PING-PONG player here.');
        if (res.changes !== 1)
            throw `Did not add user ${jwt.sub} to db`;
    }
}

const db = new Databases(new DatabaseSync(process.env.SQLITE_PATH || '/database/db.sqlite'))

export default db;