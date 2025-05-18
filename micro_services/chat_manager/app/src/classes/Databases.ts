import { DatabaseSync } from "node:sqlite";
import { conversations_table_name, block_table_name, unread_conversations_table_name } from "../types/DbTables";

class Databases {
  persistent: DatabaseSync;

  constructor(p: DatabaseSync) {
    this.persistent = p;
  }
  public init(): void {
    try {
      db.persistent.exec(
        `create table IF NOT EXISTS '${conversations_table_name}' ('UID' TEXT NOT NULL PRIMARY KEY, 'name' TEXT NOT NULL, 'uid_1' TEXT NOT NULL, 'uid_2' TEXT NOT NULL, 'started' INT NOT NULL)`
      );
      db.persistent.exec(
        `create table IF NOT EXISTS '${block_table_name}' ('UID' TEXT NOT NULL PRIMARY KEY, 'user_uid' TEXT NOT NULL, 'blocked_uid' TEXT NOT NULL)`
      );
      db.persistent.exec(
        `create table IF NOT EXISTS '${unread_conversations_table_name}' ('HASH' TEXT NOT NULL PRIMARY KEY, 'user_uid' TEXT NOT NULL, 'conversation_uid' TEXT NOT NULL)`
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
