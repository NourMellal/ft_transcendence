import amqp from "amqplib";
import { Options } from "amqplib";
import {
  RabbitMQMicroServices,
  RabbitMQRequest,
  RabbitMQResponse,
  RabbitMQUserManagerOp,
} from "../types/RabbitMQMessages";
import HandleMessage from "../Handlers/UserManager";

class RabbitMQ {
  isReady = false;
  connection_option: Options.Connect = {
    hostname: process.env.RABBITMQ_HOST,
    port: (process.env.RABBITMQ_PORT || 5577) as number,
    username: process.env.RABBITMQ_USER_MANAGER_USER || "",
    password: process.env.RABBITMQ_USER_MANAGER_PASSWORD || "",
  };
  connection: amqp.ChannelModel;
  channel: amqp.Channel;
  api_gateway_queue = process.env.RABBITMQ_API_GATEWAY_QUEUE_NAME as string;
  user_manager_queue = process.env.RABBITMQ_USER_MANAGER_QUEUE_NAME as string;
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
      await this.channel.assertQueue(this.user_manager_queue, {
        durable: false,
      });
      await this.channel.consume(
        this.user_manager_queue,
        this.consumeUserManagerQueue,
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
  async consumeUserManagerQueue(msg: amqp.ConsumeMessage | null) {
    if (!msg) return;
    var RMqRequest: RabbitMQRequest;
    try {
      RMqRequest = JSON.parse(msg.content.toString());
      if (!RMqRequest.id || RMqRequest.id === "")
        throw "received request with no id";
    } catch (error) {
      console.log(
        `Error: rabbitmq consumeUserManagerQueue(): parse error ${error}`
      );
      return;
    }
    try {
      const RMqResponse = await HandleMessage(RMqRequest);
      rabbitmq.sendToAPIGatewayQueue(RMqResponse);
    } catch (error) {
      console.log(
        `Error: rabbitmq consumeUserManagerQueue(): ${error} | request id: ${RMqRequest.id}`
      );
      const RMqResponse: RabbitMQResponse = {
        service: RabbitMQMicroServices.USER_MANAGER,
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
}

const rabbitmq = new RabbitMQ();

export default rabbitmq;
