import amqp from "amqplib";
import { Options } from "amqplib/properties";
import {
  RabbitMQMicroServices,
  RabbitMQNotificationsOp,
  RabbitMQRequest,
  RabbitMQResponse,
} from "../types/RabbitMQMessages";
import { pingUser } from "../controllers/microservices/notifications";

/**
 * RabbitMQ class acts as an interprocess communication channel.
 * Allows for multiple microservices processes toexchange data.
 * Each message sent from the api_gateway to any other service
 * need to register a callback, this callback is then invoked
 * when a response with the same id as the request_id is received.
 * Except for Ping_user where no request from the api_gateway
 * has initiated the response, rather the Ping_user is sent by
 * different services that tries to notify a user on his websocket
 * about something if the user requested is connected to the site.
 */
export class RabbitMQ {
  isReady = false;

  // RabbitMQ Connection options:
  connection_option: Options.Connect = {
    hostname: process.env.RABBITMQ_HOST,
    port:     parseInt(process.env.RABBITMQ_PORT as string),
    username: process.env.RABBITMQ_API_GATEWAY_USER,
    password: process.env.RABBITMQ_API_GATEWAY_PASSWORD,
  };
  connection: amqp.ChannelModel;
  channel: amqp.Channel;

  // RabbitMQ Queues names:
  api_gateway_queue = process.env.RABBITMQ_API_GATEWAY_QUEUE_NAME as string;
  user_manager_queue = process.env.RABBITMQ_USER_MANAGER_QUEUE_NAME as string;
  friends_manager_queue = process.env.RABBITMQ_FRIENDS_MANAGER_QUEUE_NAME as string;
  notifications_queue = process.env.RABBITMQ_NOTIFICATIONS_QUEUE_NAME as string;
  leaderboard_queue = process.env.RABBITMQ_LEADERBOARD_QUEUE_NAME as string;
  match_manager_queue = process.env.RABBITMQ_MATCH_MANAGER_QUEUE_NAME as string;
  chat_manager_queue = process.env.RABBITMQ_CHAT_MANAGER_QUEUE_NAME as string;

  // Requests callbacks:
  callbacks_map = new Map<string, (response: RabbitMQResponse) => void>();

  constructor() {
    this.connection = {} as amqp.ChannelModel;
    this.channel = {} as amqp.Channel;
  }

  public init() {
    this.AttemptConnection();
  }

  public async AttemptConnection() {
    try {
      this.isReady = false;
      console.log("RabbitMQ establishing connection.");
      this.connection = await amqp.connect(this.connection_option);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.api_gateway_queue, {
        durable: false,
      });
      await this.channel.assertQueue(this.user_manager_queue, {
        durable: false,
      });
      await this.channel.assertQueue(this.friends_manager_queue, {
        durable: false,
      });
      await this.channel.assertQueue(this.notifications_queue, {
        durable: false,
      });
      await this.channel.assertQueue(this.leaderboard_queue, {
        durable: false,
      });
      await this.channel.assertQueue(this.match_manager_queue, {
        durable: false,
      });
      await this.channel.assertQueue(this.chat_manager_queue, {
        durable: false,
      });
      await this.channel.consume(
        this.api_gateway_queue,
        this.consumeAPIGatewayQueue.bind(this),
        { noAck: true }
      );
      this.channel.on("close", async () => {
        await new Promise((r) => setTimeout(r, 1000));
        this.AttemptConnection();
      });
      this.isReady = true;
      console.log("RabbitMQ class connection established.");
    } catch (error) {
      console.log(`Error: rabbitmq AttemptConnection(): ${error}`);
      await new Promise((r) => setTimeout(r, 1000));
      this.AttemptConnection();
    }
  }

  InvokeResponseCallback(RMqResponse: RabbitMQResponse) {
    let replyInstanceCallback = this.callbacks_map.get(RMqResponse.req_id);
    if (replyInstanceCallback === undefined)
      throw `request id ${RMqResponse.req_id} callback not found`;
    replyInstanceCallback(RMqResponse);
    this.callbacks_map.delete(RMqResponse.req_id);
  }

  HandleMessage(RMqResponse: RabbitMQResponse) {
    if (RMqResponse.service === RabbitMQMicroServices.API_GATEWAY)
      throw `request id ${RMqResponse.req_id} received invalid service response`;
    if (
      RMqResponse.service === RabbitMQMicroServices.NOTIFICATIONS &&
      RMqResponse.op === RabbitMQNotificationsOp.PING_USER
    )
      return pingUser(RMqResponse.message as string);
    this.InvokeResponseCallback(RMqResponse);
  }
  
  consumeAPIGatewayQueue(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;
    let RMqResponse = {} as RabbitMQResponse;
    try {
      const RMqResponse = JSON.parse(
        msg.content.toString()
      ) as RabbitMQResponse;
      this.HandleMessage(RMqResponse);
    } catch (error) {
      console.log(`Error: rabbitmq consumeAPIGatewayQueue(): ${error}`);
      let reply_instance = this.callbacks_map.get(RMqResponse.req_id);
      if (reply_instance) {
        this.callbacks_map.delete(RMqResponse.req_id);
        reply_instance({ status: 400, message: 'bad request' } as RabbitMQResponse);
      }
    }
  }
  
  public async sendToQueue(
    QueueName: string,
    req: RabbitMQRequest,
    callback: (response: RabbitMQResponse) => void
  ) {
    try {
      while (!this.isReady)
        await new Promise((r) => setTimeout(r, 500));
      req.id = crypto.randomUUID();
      if (this.callbacks_map.has(req.id))
        throw `request id with UID=${req.id} already exist`;
      this.callbacks_map.set(req.id, callback);
      this.channel.sendToQueue(
        QueueName,
        Buffer.from(JSON.stringify(req))
      );
    } catch (error) {
      console.log(`sendToQueue(): ${error}`);
      callback({ status: 400, message: 'bad request' } as RabbitMQResponse);
    }
  }
}

const rabbitmq = new RabbitMQ();

export default rabbitmq;
