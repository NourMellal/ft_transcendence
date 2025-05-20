import amqp from "amqplib";
import { Options } from "amqplib";
import {
  RabbitMQMicroServices,
  RabbitMQRequest,
  RabbitMQResponse,
} from "../types/RabbitMQMessages";
import HandleMessage from "../Handlers/FriendsManager";

class RabbitMQ {
  isReady = false;
  connection_option: Options.Connect = {
    hostname: process.env.RABBITMQ_HOST,
    port: (process.env.RABBITMQ_PORT || 5577) as number,
    username: process.env.RABBITMQ_FRIENDS_MANAGER_USER || "",
    password: process.env.RABBITMQ_FRIENDS_MANAGER_PASSWORD || "",
  };
  connection: amqp.ChannelModel;
  channel: amqp.Channel;
  api_gateway_queue = process.env.RABBITMQ_API_GATEWAY_QUEUE_NAME as string;
  notifications_queue = process.env.RABBITMQ_NOTIFICATIONS_QUEUE_NAME as string;
  friends_manager_queue = process.env
    .RABBITMQ_FRIENDS_MANAGER_QUEUE_NAME as string;
  constructor() {
    this.connection = {} as amqp.ChannelModel;
    this.channel = {} as amqp.Channel;
  }
  public init() {
    this.AttemptConnection();
  }
  async AttemptConnection() {
    try {
      this.isReady = false;
      console.log("RabbitMQ establishing connection.");
      this.connection = await amqp.connect(this.connection_option);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.api_gateway_queue, {
        durable: false,
      });
      await this.channel.assertQueue(this.friends_manager_queue, {
        durable: false,
      });
      await this.channel.consume(
        this.friends_manager_queue,
        this.consumeFriendsManagerQueue,
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
  consumeFriendsManagerQueue(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;
    var RMqRequest: RabbitMQRequest;
    try {
      RMqRequest = JSON.parse(msg.content.toString());
      if (!RMqRequest.id || RMqRequest.id === "")
        throw "received request with no id";
    } catch (error) {
      console.log(
        `Error: rabbitmq consumeFriendsManagerQueue(): parse error ${error}`
      );
      return;
    }
    try {
      const RMqResponse = HandleMessage(RMqRequest);
      rabbitmq.sendToAPIGatewayQueue(RMqResponse);
    } catch (error) {
      console.log(
        `Error: rabbitmq consumeFriendsManagerQueue(): ${error} | request id: ${RMqRequest.id}`
      );
      const RMqResponse: RabbitMQResponse = {
        service: RabbitMQMicroServices.FRIENDS_MANAGER,
        op: RMqRequest.op,
        req_id: RMqRequest.id,
        status: 500,
        message: "internal server error, please try again later.",
      };
      rabbitmq.sendToAPIGatewayQueue(RMqResponse);
    }
  }
  public async sendToAPIGatewayQueue(RMqResponse: RabbitMQResponse) {
    while (!this.isReady) 
      await new Promise((r) => setTimeout(r, 500));
    this.channel.sendToQueue(
      this.api_gateway_queue,
      Buffer.from(JSON.stringify(RMqResponse))
    );
  }
  public async sendToNotificationQueue(req: RabbitMQRequest) {
    while (!this.isReady) 
      await new Promise((r) => setTimeout(r, 500));
    this.channel.sendToQueue(
      this.notifications_queue,
      Buffer.from(JSON.stringify(req))
    );
  }
}

const rabbitmq = new RabbitMQ();

export default rabbitmq;
