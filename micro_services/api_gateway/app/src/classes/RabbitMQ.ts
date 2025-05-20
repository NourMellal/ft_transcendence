import amqp from "amqplib";
import { Options } from "amqplib/properties";
import {
  RabbitMQMicroServices,
  RabbitMQNotificationsOp,
  RabbitMQRequest,
  RabbitMQResponse,
} from "../types/RabbitMQMessages";
import { pingUser } from "../controllers/microservices/notifications";

class RabbitMQ {
  isReady = false;
  connection_option: Options.Connect = {
    hostname: process.env.RABBITMQ_HOST,
    port: (process.env.RABBITMQ_PORT || 5577) as number,
    username: process.env.RABBITMQ_API_GATEWAY_USER || "",
    password: process.env.RABBITMQ_API_GATEWAY_PASSWORD || "",
  };
  connection: amqp.ChannelModel;
  channel: amqp.Channel;
  api_gateway_queue = process.env.RABBITMQ_API_GATEWAY_QUEUE_NAME as string;
  user_manager_queue = process.env.RABBITMQ_USER_MANAGER_QUEUE_NAME as string;
  friends_manager_queue = process.env
    .RABBITMQ_FRIENDS_MANAGER_QUEUE_NAME as string;
  notifications_queue = process.env.RABBITMQ_NOTIFICATIONS_QUEUE_NAME as string;
  leaderboard_queue = process.env.RABBITMQ_LEADERBOARD_QUEUE_NAME as string;
  match_manager_queue = process.env.RABBITMQ_MATCH_MANAGER_QUEUE_NAME as string;
  chat_manager_queue = process.env.RABBITMQ_CHAT_MANAGER_QUEUE_NAME as string;
  reply_map = new Map<string, (response: RabbitMQResponse) => void>();
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
    var replyInstanceCallback = this.reply_map.get(RMqResponse.req_id);
    if (replyInstanceCallback === undefined)
      throw `request id ${RMqResponse.req_id} callback not found`;
    replyInstanceCallback(RMqResponse);
    this.reply_map.delete(RMqResponse.req_id);
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
    var RMqResponse = {} as RabbitMQResponse;
    try {
      const RMqResponse = JSON.parse(
        msg.content.toString()
      ) as RabbitMQResponse;
      this.HandleMessage(RMqResponse);
    } catch (error) {
      console.log(`Error: rabbitmq consumeAPIGatewayQueue(): ${error}`);
      this.reply_map.delete(RMqResponse.req_id);
    }
  }
  public async sendToUserManagerQueue(
    req: RabbitMQRequest,
    callback: (response: RabbitMQResponse) => void
  ) {
    while (!this.isReady) 
      await new Promise((r) => setTimeout(r, 500));
    req.id = crypto.randomUUID();
    if (this.reply_map.has(req.id))
      throw `request id with UID=${req.id} already exist`;
    this.reply_map.set(req.id, callback);
    this.channel.sendToQueue(
      this.user_manager_queue,
      Buffer.from(JSON.stringify(req))
    );
  }
  public async sendToFriendsManagerQueue(
    req: RabbitMQRequest,
    callback: (response: RabbitMQResponse) => void
  ) {
    while (!this.isReady) 
      await new Promise((r) => setTimeout(r, 500));
    req.id = crypto.randomUUID();
    if (this.reply_map.has(req.id))
      throw `request id with UID=${req.id} already exist`;
    this.reply_map.set(req.id, callback);
    this.channel.sendToQueue(
      this.friends_manager_queue,
      Buffer.from(JSON.stringify(req))
    );
  }
  public async sendToNotificationQueue(
    req: RabbitMQRequest,
    callback: (response: RabbitMQResponse) => void
  ) {
    while (!this.isReady) 
      await new Promise((r) => setTimeout(r, 500));
    req.id = crypto.randomUUID();
    if (this.reply_map.has(req.id))
      throw `request id with UID=${req.id} already exist`;
    this.reply_map.set(req.id, callback);
    this.channel.sendToQueue(
      this.notifications_queue,
      Buffer.from(JSON.stringify(req))
    );
  }
  public async sendToLeaderboardQueue(
    req: RabbitMQRequest,
    callback: (response: RabbitMQResponse) => void
  ) {
    while (!this.isReady) 
      await new Promise((r) => setTimeout(r, 500));
    req.id = crypto.randomUUID();
    if (this.reply_map.has(req.id))
      throw `request id with UID=${req.id} already exist`;
    this.reply_map.set(req.id, callback);
    this.channel.sendToQueue(
      this.leaderboard_queue,
      Buffer.from(JSON.stringify(req))
    );
  }
  public async sendToMatchManagerQueue(
    req: RabbitMQRequest,
    callback: (response: RabbitMQResponse) => void
  ) {
    while (!this.isReady) 
      await new Promise((r) => setTimeout(r, 500));
    req.id = crypto.randomUUID();
    if (this.reply_map.has(req.id))
      throw `request id with UID=${req.id} already exist`;
    this.reply_map.set(req.id, callback);
    this.channel.sendToQueue(
      this.match_manager_queue,
      Buffer.from(JSON.stringify(req))
    );
  }
  public async sendToChatManagerQueue(
    req: RabbitMQRequest,
    callback: (response: RabbitMQResponse) => void
  ) {
    while (!this.isReady) 
      await new Promise((r) => setTimeout(r, 500));
    req.id = crypto.randomUUID();
    if (this.reply_map.has(req.id))
      throw `request id with UID=${req.id} already exist`;
    this.reply_map.set(req.id, callback);
    this.channel.sendToQueue(
      this.chat_manager_queue,
      Buffer.from(JSON.stringify(req))
    );
  }
}

const rabbitmq = new RabbitMQ();

export default rabbitmq;
