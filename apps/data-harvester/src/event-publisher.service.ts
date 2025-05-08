import { Inject, Injectable } from "@nestjs/common";
import { OperationEvent } from "./dto/operation.event";
import { ClientProxy } from "@nestjs/microservices";

@Injectable()
export class EventPublisherService {
    constructor(@Inject("RABBITMQ_SERVICE") private readonly client: ClientProxy) {}

    async publishOperation(event: OperationEvent): Promise<void> {
        await this.client.emit("data-harvester.operation", event);
    }
}
