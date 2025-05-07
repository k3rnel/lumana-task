import { ConfigModule, ConfigService } from "@nestjs/config";
import { DynamicModule, Module } from "@nestjs/common";
import { DatabaseConfig } from "@app/common/database/database-config.interface";
import { MongoClient } from "mongodb";

@Module({})
export class DatabaseModule {
    static async forRootAsync(options: {
        useFactory: (config: ConfigService) => DatabaseConfig;
        inject?: any[];
    }): Promise<DynamicModule> {
        return {
            global: true,
            module: DatabaseModule,
            imports: [ConfigModule],
            providers: [
                {
                    provide: "MONGODB_CONFIG",
                    useFactory: options.useFactory,
                    inject: [ConfigService],
                },
                {
                    provide: "DATABASE_CONNECTION",
                    useFactory: async (cfg: DatabaseConfig) => {
                        try {
                            const uri = `mongodb://${cfg.MONGO_USER}:${cfg.MONGO_PASS}@${cfg.MONGO_HOST}:${cfg.MONGO_PORT}`;
                            const client = await MongoClient.connect(uri);

                            return client.db(cfg.MONGO_DATABASE);
                        } catch (e) {
                            throw e;
                        }
                    },
                    inject: ["MONGODB_CONFIG"],
                },
            ],
            exports: ["DATABASE_CONNECTION"],
        };
    }
}
