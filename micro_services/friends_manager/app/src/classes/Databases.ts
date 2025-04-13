import { DatabaseSync } from 'node:sqlite';
import { friends_table_name, requests_table_name } from '../types/DbTables';

class Databases {
    transient: DatabaseSync;
    persistent: DatabaseSync;

    constructor(p: DatabaseSync) {
        this.transient = new DatabaseSync(':memory:');
        this.persistent = p;
    }
    public init(): void {
        try {
            db.persistent.exec(`create table IF NOT EXISTS '${friends_table_name}' ('UID' TEXT NOT NULL PRIMARY KEY, 'friends' TEXT)`);
            db.persistent.exec(`create table IF NOT EXISTS '${requests_table_name}' ('REQ_ID' TEXT NOT NULL PRIMARY KEY, 'from_uid' TEXT NOT NULL, 'to_uid' TEXT NOT NULL)`);
        }
        catch (err) {
            console.log("fatal error: " + err);
            process.exit(1);
        }
    }
}

const db = new Databases(new DatabaseSync(process.env.SQLITE_PATH || '/database/db.sqlite'))

export default db;