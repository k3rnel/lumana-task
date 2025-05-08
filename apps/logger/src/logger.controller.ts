import { Controller, Get } from "@nestjs/common";
import { LoggerService } from "./logger.service";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";

@Controller()
export class LoggerController {
    constructor(private readonly loggerService: LoggerService) {}

    @EventPattern("data_harvester_events")
    async handleServiceAEvents(@Payload() data: any, @Ctx() context: RmqContext) {
        // TODO Implement logging in appropriate database.
    }
}
