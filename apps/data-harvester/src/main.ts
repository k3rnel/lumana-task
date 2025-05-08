import { NestFactory } from "@nestjs/core";
import { DataHarvesterModule } from "./data-harvester.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

(async () => {
    const app = await NestFactory.create(DataHarvesterModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    const configService = app.get<ConfigService<{ HARVESTER_SWAGGER_ENABLE: boolean }>>(ConfigService);

    const swaggerEnabled = Boolean(configService.get("HARVESTER_SWAGGER_ENABLE"));

    if (swaggerEnabled) {
        const config = new DocumentBuilder()
            .setTitle("Harvester API")
            .setDescription(
                "Harvester is responsible for downloading public data (harvesting) uploading and ingesting (seeding). And searching.",
            )
            .addTag("harvester")
            .build();
        const documentFactory = () => SwaggerModule.createDocument(app, config);
        SwaggerModule.setup("docs", app, documentFactory);
    }

    await app.listen(3000);
})();
