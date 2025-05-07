import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Db } from "mongodb";

@Injectable()
export class CollectionIndexService implements OnModuleInit {
    private logger: Logger = new Logger(CollectionIndexService.name);

    constructor(
        @Inject("DATABASE_CONNECTION")
        private readonly db: Db,
    ) {}

    async onModuleInit() {
        await this.createGeonamesIndexes();
    }

    private async createGeonamesIndexes() {
        try {
            await this.db.createCollection("geonames");
        } catch (err: any) {
            if (err.codeName !== "NamespaceExists") throw err;
        }

        const collection = this.db.collection("geonames");

        await Promise.all([
            collection.createIndex({ geonameid: 1 }, { unique: true }),
            collection.createIndex({ name: 1 }),
            collection.createIndex({ asciiname: 1 }),
            collection.createIndex({ countryCode: 1, admin1Code: 1 }),
            collection.createIndex({ featureClass: 1, featureCode: 1 }),
            collection.createIndex({ modificationDate: -1 }),
            collection.createIndex({ population: -1 }),
            collection.createIndex({ location: "2dsphere" }),
            collection.createIndex(
                { name: "text", asciiname: "text", alternatenames: "text" },
                { name: "TextSearchIndex" },
            ),
        ]);

        this.logger.log("Geonames collection indexes created/updated successfully.");
    }
}
