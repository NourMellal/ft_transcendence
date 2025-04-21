import { RabbitMQMicroServices, RabbitMQRequest, RabbitMQResponse } from "../types/RabbitMQMessages";

export function HandleMessage(RMqRequest: RabbitMQRequest): RabbitMQResponse {
    const RMqResponse: RabbitMQResponse = { service: RabbitMQMicroServices.NOTIFICATIONS, req_id: RMqRequest.id } as RabbitMQResponse;
    switch (RMqRequest.op) {
        default:
            console.log("WARNING: rabbitmq HandleMessage(): operation not implemented.");
            throw 'operation not implemented';
    }
    return RMqResponse;
}

export default HandleMessage;