import { Module } from "@nestjs/common";
import { GeonamesService } from "./geonames.service";
import { HttpModule } from "@nestjs/axios";
import { ProcessManagerModule } from "@app/common";

@Module({
    imports: [HttpModule, ProcessManagerModule],
    providers: [GeonamesService],
    exports: [GeonamesService],
})
export class GeonamesModule {}
