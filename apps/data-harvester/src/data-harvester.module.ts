import { Module } from "@nestjs/common";
import { DataHarvesterController } from "./data-harvester.controller";
import { DataHarvesterService } from "./data-harvester.service";
import { GeonamesModule } from "./geonames/geonames.module";
import { ProcessManagerModule, StorageModule } from "@app/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as Joi from "joi";
import { DatabaseModule } from "@app/common/database";
import { DataSeederController } from "./data-seeder.controller";
import { DataSeederService } from "./data-seeder.service";
import { CollectionIndexService } from "./collection-index.service";
import { SearchController } from "./search.controller";
import { DataFinderService } from "./data-finder.service";
import { MessageBroker } from "@app/common/message-broker";
import { EventPublisherService } from "./event-publisher.service";

@Module({
    imports: [
        GeonamesModule,
        ProcessManagerModule,
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                HARVESTER_BASE_URL: Joi.string().required(),

                MONGO_HOST: Joi.string().required(),
                MONGO_PORT: Joi.string().required(),
                MONGO_USER: Joi.string().required(),
                MONGO_PASS: Joi.string().required(),
                MONGO_DATABASE: Joi.string().required(),

                RABBITMQ_HOST: Joi.string().required(),
                RABBITMQ_PORT: Joi.string().required(),
                RABBITMQ_USER: Joi.string().required(),
                RABBITMQ_PASS: Joi.string().required(),
                RABBITMQ_QUEUE: Joi.string().required(),
            }),
        }),
        StorageModule.forRoot({
            useFactory: (config: ConfigService) => ({
                BASE_URL: config.get("HARVESTER_BASE_URL") as string,
            }),
        }),
        DatabaseModule.forRootAsync({
            useFactory: (config: ConfigService) => ({
                MONGO_PORT: config.get("MONGO_PORT") as string,
                MONGO_HOST: config.get("MONGO_HOST") as string,
                MONGO_USER: config.get("MONGO_USER") as string,
                MONGO_PASS: config.get("MONGO_PASS") as string,
                MONGO_DATABASE: config.get("MONGO_DATABASE") as string,
            }),
        }),
        MessageBroker.forRootAsync({
            useFactory: (config: ConfigService) => ({
                RABBITMQ_HOST: config.get("RABBITMQ_HOST") as string,
                RABBITMQ_PORT: config.get("RABBITMQ_PORT") as string,
                RABBITMQ_USER: config.get("RABBITMQ_USER") as string,
                RABBITMQ_PASS: config.get("RABBITMQ_PASS") as string,
                RABBITMQ_QUEUE: config.get("RABBITMQ_QUEUE") as string,
            }),
        }),
    ],
    controllers: [DataHarvesterController, DataSeederController, SearchController],
    providers: [
        DataHarvesterService,
        DataSeederService,
        CollectionIndexService,
        DataFinderService,
        EventPublisherService,
    ],
    exports: [],
})
export class DataHarvesterModule {}
