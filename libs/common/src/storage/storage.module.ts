import { DynamicModule, Module } from "@nestjs/common";
import { StorageService } from "@app/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { StorageConfig } from "@app/common/storage/storage-config.interface";

@Module({})
export class StorageModule {
    static forRoot(options: { useFactory: (config: ConfigService) => StorageConfig; inject?: any[] }): DynamicModule {
        return {
            global: true,
            module: StorageModule,
            imports: [ConfigModule],
            providers: [
                {
                    provide: "STORAGE_CONFIG",
                    useFactory: options.useFactory,
                    inject: [ConfigService],
                },
                {
                    provide: StorageService,
                    useFactory: (cfg: StorageConfig) => new StorageService(cfg),
                    inject: ["STORAGE_CONFIG"],
                },
            ],
            exports: [StorageService],
        };
    }
}
