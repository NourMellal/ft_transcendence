import { DatabaseSync } from 'node:sqlite';

class Databases {
    transient: DatabaseSync;
    persistent: DatabaseSync;

    constructor(p: DatabaseSync) {
        this.transient = new DatabaseSync(':memory:');
        this.persistent = p;
    }
}

const db = new Databases(new DatabaseSync(process.env.SQLITE_PATH || '/database/db.sqlite'))

export default db;