import db from './classes/Databases';
import rabbitmq from './classes/RabbitMQ'

db.init();
rabbitmq.init();
