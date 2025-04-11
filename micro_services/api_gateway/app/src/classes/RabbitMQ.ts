import amqp from 'amqplib'
import { Options } from 'amqplib/properties'
import { RabbitMQRequest, RabbitMQResponse } from '../types/RabbitMQMessages';
import { FastifyReply } from 'fastify';
import { JWT } from '../types/AuthProvider';


type ReplyPayload = {
    reply: FastifyReply,
    JWT?: JWT,
    JWT_Token?: string,
}

// TODO:Handle error responses correctly
class RabbitMQ {
    isReady = false;
    connection_option: Options.Connect =
        {
            hostname: process.env.RABBITMQ_HOST,
            port: (process.env.RABBITMQ_PORT || 5577) as number,
            username: process.env.RABBITMQ_USER || '',
            password: process.env.RABBITMQ_PASSWORD || '',
        };
    connection: amqp.ChannelModel;
    channel: amqp.Channel;
    api_gateway_queue = process.env.RABBITMQ_API_GATEWAY_QUEUE_NAME || 'ft_api_gateway';
    user_manager_queue = process.env.RABBITMQ_USER_MANAGER_QUEUE_NAME || 'ft_user_manager';
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
            console.log('RabbitMQ establishing connection.');
            this.connection = await amqp.connect(this.connection_option);
            this.channel = await this.connection.createChannel();
            await this.channel.assertQueue(this.api_gateway_queue, { durable: false });
            await this.channel.assertQueue(this.user_manager_queue, { durable: false });
            await this.channel.consume(this.api_gateway_queue, this.consumeAPIGatewayQueue.bind(this), { noAck: true });
            this.channel.on('close', async () => { await new Promise(r => setTimeout(r, 1000)); this.AttemptConnection(); });
            this.isReady = true;
            console.log('RabbitMQ class connection established.');
        } catch (error) {
            console.log(`Error: rabbitmq AttemptConnection(): ${error}`);
            await new Promise(r => setTimeout(r, 1000));
            this.AttemptConnection();
        }
    }
    consumeAPIGatewayQueue(msg: amqp.ConsumeMessage | null) {
        if (!msg)
            return;
        var RMqResponse = { req_id: '' } as RabbitMQResponse;
        try {
            const RMqResponse = JSON.parse(msg.content.toString()) as RabbitMQResponse;
            var replyInstanceCallback = this.reply_map.get(RMqResponse.req_id);
            if (replyInstanceCallback === undefined)
                throw `request id ${RMqResponse.req_id} not found`;
            replyInstanceCallback(RMqResponse);
            this.reply_map.delete(RMqResponse.req_id);
        } catch (error) {
            console.log(`Error: rabbitmq consumeAPIGatewayQueue(): ${error}`);
            this.reply_map.delete(RMqResponse.req_id);
        }
    }
    public sendToUserManagerQueue(req: RabbitMQRequest, callback: (response: RabbitMQResponse) => void) {
        if (!this.isReady)
            throw 'RabbitMQ class not ready';
        req.id = crypto.randomUUID();
        if (this.reply_map.has(req.id))
            throw `request id with UID=${req.id} already exist`;
        this.reply_map.set(req.id, callback);
        this.channel.sendToQueue(this.user_manager_queue, Buffer.from(JSON.stringify(req)));
    }
}

const rabbitmq = new RabbitMQ();

export default rabbitmq;

