import { DatabaseSync } from 'node:sqlite';
import { OAuthResponse } from '../types/OAuth';

class Databases {
    transient: DatabaseSync;
    persistent: DatabaseSync;

    constructor(p: DatabaseSync) {
        this.transient = new DatabaseSync(':memory:');
        this.persistent = p;
    }
    public init(): void {
        try {
            db.transient.exec(`create table IF NOT EXISTS 'signin_states' ('state' TEXT NOT NULL PRIMARY KEY, 'created' INT NOT NULL)`);
            db.persistent.exec(`create table IF NOT EXISTS 'users' ('UID' TEXT NOT NULL PRIMARY KEY, 'role' INT NOT NULL, 'access_token' TEXT, 'refresh_token' TEXT, 'ate' INT)`);
            // db.persistent.exec(`create table IF NOT EXISTS 'users'
            //                         ( 'UID' TEXT NOT NULL PRIMARY KEY, 'display_name' TEXT NOT NULL UNIQUE,
            //                           'picture_url' TEXT NOT NULL, 'access_token' TEXT, 'refresh_token' TEXT,
            //                           'ate' INT, 'rte' INT)`);
        }
        catch (err) {
            console.log("fatal error: " + err);
            process.exit(1);
        }
    }
    public CreateNewUser(response: OAuthResponse) {
        const query = this.persistent.prepare('INSERT INTO users ( UID , role , access_token , refresh_token , ate ) VALUES( ? , ? , ? , ? , ? );');
        const res = query.run(response.jwt.sub, 'user', response.response.access_token, response.response.refresh_token || '', (response.response.expires_in + Date.now() / 1000));
        if (res.changes !== 1)
            throw `Did not add user ${response.jwt.given_name} to db`;
    }
}

const db = new Databases(new DatabaseSync(process.env.SQLITE_PATH || '/database/db.sqlite'))

export default db;