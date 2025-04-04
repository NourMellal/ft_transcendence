import { DatabaseSync } from 'node:sqlite';

class Databases {
    transient: DatabaseSync;
    persistent: DatabaseSync;

    constructor(p: DatabaseSync) {
        this.transient = new DatabaseSync(':memory:');
        this.persistent = p;
    }
    public initDb(): void {
        try {
            db.transient.exec(`create table IF NOT EXISTS 'signin_states' ( 'state' TEXT NOT NULL PRIMARY KEY, 'created' INT NOT NULL)`);
            db.persistent.exec(`create table IF NOT EXISTS 'users' ( 'UID' TEXT NOT NULL PRIMARY KEY, 'role' INT NOT NULL,
                'access_token' TEXT, 'refresh_token' TEXT, 'ate' INT, 'rte' INT)`);
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
}

const db = new Databases(new DatabaseSync(process.env.SQLITE_PATH || '/database/db.sqlite'))

export default db;