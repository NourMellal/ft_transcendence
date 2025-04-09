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
    reply_map = new Map<string, ReplyPayload>();
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
            var replyInstance = this.reply_map.get(RMqResponse.req_id);
            if (replyInstance === undefined)
                throw `request id ${RMqResponse.req_id} not found`;
            replyInstance.reply.raw.statusCode = RMqResponse.status;
            replyInstance.reply.raw.setHeader('Content-Type', 'application/json');
            if (replyInstance.JWT_Token && replyInstance.JWT) {
                const expiresDate = new Date(replyInstance.JWT.exp * 1000).toUTCString();
                replyInstance.reply.raw.setHeader('Set-Cookie', `jwt=${replyInstance.JWT_Token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly`);
            }
            const payload = replyInstance.reply.serialize({
                user_info: RMqResponse.message,
                JWT: replyInstance.JWT_Token
            });
            replyInstance.reply.raw.setHeader('access-control-allow-origin', '*');
            replyInstance.reply.raw.end(payload);
            this.reply_map.delete(RMqResponse.req_id);
        } catch (error) {
            console.log(`Error: rabbitmq consumeAPIGatewayQueue(): ${error}`);
            if ((replyInstance = this.reply_map.get(RMqResponse.req_id)) !== undefined) {
                replyInstance.reply.raw.statusCode = 500;
                replyInstance.reply.raw.end('Internal Server Error');
                this.reply_map.delete(RMqResponse.req_id);
            }
        }
    }
    public sendToUserManagerQueue(req: RabbitMQRequest, reply: FastifyReply, jwt?: JWT, jwt_token?: string) {
        if (!this.isReady)
            throw 'RabbitMQ class not ready';
        req.id = crypto.randomUUID();
        if (this.reply_map.has(req.id))
            throw `request id with UID=${req.id} already exist`;
        this.reply_map.set(req.id, { reply: reply, JWT: jwt, JWT_Token: jwt_token });
        this.channel.sendToQueue(this.user_manager_queue, Buffer.from(JSON.stringify(req)));
    }
}

const rabbitmq = new RabbitMQ();

export default rabbitmq;

