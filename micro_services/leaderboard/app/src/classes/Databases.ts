import { DatabaseSync } from "node:sqlite";
import { leaderboard_table_name } from "../types/DbTables";

class Databases {
  persistent: DatabaseSync;

  constructor(p: DatabaseSync) {
    this.persistent = p;
  }
  public init(): void {
    try {
      db.persistent.exec(
        `create table IF NOT EXISTS '${leaderboard_table_name}' ('UID' TEXT NOT NULL PRIMARY KEY, 'wins' INT NOT NULL, 'losses' INT NOT NULL)`
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
