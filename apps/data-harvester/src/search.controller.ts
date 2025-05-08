import { Controller, Get, Query } from "@nestjs/common";
import { SearchGeonamesDto } from "./dto/search-geonames.dto";
import { DataFinderService } from "./data-finder.service";
import { EventPublisherService } from "./event-publisher.service";
import { Operation, OperationEvent } from "./dto/operation.event";
import { ApiOkResponse } from "@nestjs/swagger";

@Controller()
export class SearchController {
    constructor(
        private readonly dataFinder: DataFinderService,
        private readonly eventPublisher: EventPublisherService,
    ) {}

    @Get("search")
    @ApiOkResponse({ description: "Provides searched data." })
    async search(@Query() query: SearchGeonamesDto) {
        const result = await this.dataFinder.search(query);

        await this.eventPublisher.publishOperation(
            new OperationEvent(Operation.SEARCH, query, result, new Date(Date.now())),
        );

        return result;
    }
}
