import { DatabaseSync } from "node:sqlite";
import { matchs_table_name } from "../types/DbTables";

class Databases {
  persistent: DatabaseSync;

  constructor(p: DatabaseSync) {
    this.persistent = p;
  }
  public init(): void {
    try {
      db.persistent.exec(
        `create table IF NOT EXISTS '${matchs_table_name}' ('match_UID' TEXT NOT NULL PRIMARY KEY, 'UID' TEXT NOT NULL, 'match_type' INT NOT NULL, 'started' INT NOT NULL, 'state' INT NOT NULL)`
      );
    } catch (err) {
      console.log("fatal error: " + err);
      process.exit(1);
    }
  }
}

const db = new Databases(
  new DatabaseSync(process.env.SQLITE_PATH || "/database/db.sqlite")
);

export default db;
