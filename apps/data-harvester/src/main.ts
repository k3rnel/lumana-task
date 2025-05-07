import { NestFactory } from "@nestjs/core";
import { DataHarvesterModule } from "./data-harvester.module";
import { ValidationPipe } from "@nestjs/common";

(async () => {
    const app = await NestFactory.create(DataHarvesterModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.listen(3000);
})();
