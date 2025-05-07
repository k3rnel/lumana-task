import { NestFactory } from "@nestjs/core";
import { LoggerModule } from "./logger.module";

(async () => {
    const app = await NestFactory.create(LoggerModule);
    await app.listen(3001);
})();
