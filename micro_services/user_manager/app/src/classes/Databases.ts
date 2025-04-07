import { DatabaseSync } from 'node:sqlite';
import { UserModel, users_table_name } from '../types/DbTables';
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
            db.persistent.exec(`create table IF NOT EXISTS '${users_table_name}' ('UID' TEXT NOT NULL PRIMARY KEY, 'display_name' TEXT NOT NULL UNIQUE, 'picture_url' TEXT NOT NULL, 'bio' TEXT)`);
        }
        catch (err) {
            console.log("fatal error: " + err);
            process.exit(1);
        }
    }
}

const db = new Databases(new DatabaseSync(process.env.SQLITE_PATH || '/database/db.sqlite'))

export default db;