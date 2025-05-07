import { Inject, Injectable, Logger } from "@nestjs/common";
import * as fs from "fs";
import { Db } from "mongodb";
import { pipeline, Writable } from "node:stream";
import { parser } from "stream-json";
import { streamArray } from "stream-json/streamers/StreamArray";

@Injectable()
export class DataSeederService {
    private logger: Logger = new Logger();

    constructor(
        @Inject("DATABASE_CONNECTION")
        private readonly db: Db,
    ) {}

    async ingestFile(filePath: string): Promise<void> {
        const collection = this.db.collection("geonames");
        const buffer: Record<string, any>[] = [];

        const writable = new Writable({
            objectMode: true,
            write: async ({ value }: { key: number; value: Record<string, any> }, _, callback) => {
                try {
                    const document = {
                        ...value,
                        location: {
                            type: "Point",
                            coordinates: [value.longitude, value.latitude],
                        },
                    };

                    buffer.push(document);

                    if (buffer.length >= 5000) {
                        await collection.insertMany(buffer);
                        this.logger.log(`Inserted ${buffer.length} records`);
                        buffer.length = 0;
                    }

                    callback();
                } catch (error) {
                    this.logger.error("Error inserting record:", error);
                    callback(error);
                }
            },
        });

        try {
            await new Promise<void>((resolve, reject) => {
                pipeline(fs.createReadStream(filePath), parser(), streamArray(), writable, (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });

            if (buffer.length) {
                await collection.insertMany(buffer);
                this.logger.log(`Inserted remaining ${buffer.length} records`);
            }

            this.logger.log("Ingestion complete");
        } catch (err) {
            this.logger.error("Failed to ingest file", err);
        }
    }
}
