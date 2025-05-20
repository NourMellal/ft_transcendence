import db from "./classes/Databases";
import rabbitmq from "./classes/RabbitMQ";
import { matchs_table_name } from "./types/DbTables";

db.init();
rabbitmq.init();
process.on("SIGINT", () => db.persistent.exec(`UPDATE ${matchs_table_name} SET state = -1 WHERE state = 0;`));