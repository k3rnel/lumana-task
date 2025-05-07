import { Inject, Injectable } from "@nestjs/common";
import { SearchGeonamesDto } from "./dto/search-geonames.dto";
import { Db } from "mongodb";
import { EventPublisherService } from "./event-publisher.service";

@Injectable()
export class DataFinderService {
    constructor(
        @Inject("DATABASE_CONNECTION")
        private readonly db: Db,
    ) {}

    async search(query: SearchGeonamesDto) {
        const collection = this.db.collection("geonames");
        const { name, countryCode, populationMin, populationMax, page = 1, limit = 20 } = query;
        const filter: Record<string, any> = {};

        if (name) {
            filter.$text = { $search: name };
        }

        if (countryCode) {
            filter.countryCode = countryCode;
        }

        if (populationMin !== undefined || populationMax !== undefined) {
            filter.population = {};
            if (populationMin !== undefined) {
                filter.population.$gte = populationMin;
            }
            if (populationMax !== undefined) {
                filter.population.$lte = populationMax;
            }
        }

        const cursor = collection
            .find(filter)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ population: -1 });

        const results = await cursor.toArray();
        const total = await collection.countDocuments(filter, {
            hint: { population: -1 },
        });

        return {
            total,
            page,
            limit,
            data: results,
        };
    }
}
