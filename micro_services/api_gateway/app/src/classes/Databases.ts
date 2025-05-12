import { DatabaseSync } from "node:sqlite";
import { OAuthResponse } from "../types/OAuth";
import {
  refresh_token_table_name,
  UserModel,
  UserProviders,
  UserRoles,
  users_table_name,
} from "../types/DbTables";

class Databases {
  persistent: DatabaseSync;

  constructor(p: DatabaseSync) {
    this.persistent = p;
  }
  public init(): void {
    try {
      this.persistent.exec(
        `create table IF NOT EXISTS '${users_table_name}' ('UID' TEXT NOT NULL PRIMARY KEY, 'username' TEXT NOT NULL UNIQUE, 'password_hash' TEXT , 'totp_key' TEXT , 'totp_enabled' INT NOT NULL , 'provider' TEXT NOT NULL, 'role' INT NOT NULL, 'google_access_token' TEXT, 'google_refresh_token' TEXT, 'ate' INT)`
      );
      this.persistent.exec(
        `create table IF NOT EXISTS '${refresh_token_table_name}' ('token_id' TEXT NOT NULL PRIMARY KEY, 'UID' TEXT NOT NULL, 'token' TEXT NOT NULL UNIQUE, 'ip' TEXT NOT NULL, 'created' INT NOT NULL)`
      );
    } catch (err) {
      console.log("fatal error: " + err);
      process.exit(1);
    }
  }
  public CreateNewGoogleUser(response: OAuthResponse): UserModel {
    const User: UserModel = {
      UID: response.jwt.sub,
      username: crypto.randomUUID(),
      totp_enabled: 0,
      provider: UserProviders.Google,
      role: UserRoles.User,
      google_access_token: response.response.access_token,
      google_refresh_token: response.response.refresh_token,
      ate: response.response.expires_in + Date.now() / 1000,
    };
    const query = this.persistent.prepare(
      `INSERT INTO '${users_table_name}' ( UID , username, totp_enabled , provider , role , google_access_token , google_refresh_token , ate ) VALUES( ? , ? , ? , ? , ? , ? , ? , ? );`
    );
    const res = query.run(
      User.UID,
      User.username,
      User.totp_enabled,
      User.provider,
      User.role,
      User.google_access_token as string,
      User.google_refresh_token || null,
      User.ate as number
    );
    if (res.changes !== 1) throw `Did not add user ${response.jwt.sub} to db`;
    return User;
  }
  public CreateNewStandardUser(
    username: string,
    password_hash: string
  ): UserModel {
    const User: UserModel = {
      UID: crypto.randomUUID(),
      username: username,
      password_hash: password_hash,
      totp_enabled: 0,
      provider: UserProviders.PASSWD,
      role: UserRoles.User,
    };
    const query = this.persistent.prepare(
      `INSERT INTO '${users_table_name}' ( UID , username , password_hash , totp_enabled , provider , role  ) VALUES( ? , ? , ? , ? , ? , ? );`
    );
    const res = query.run(
      User.UID,
      User.username,
      User.password_hash as string,
      User.totp_enabled,
      User.provider,
      User.role
    );
    if (res.changes !== 1)
      throw `Did not add user with username=${User.username} to db`;
    return User;
  }
}

const db = new Databases(
  new DatabaseSync(process.env.SQLITE_PATH || "/database/db.sqlite")
);

export default db;
