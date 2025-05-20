import db from "./classes/Databases";
import rabbitmq from "./classes/RabbitMQ";
import { matchs_table_name } from "./types/DbTables";

db.init();
rabbitmq.init();