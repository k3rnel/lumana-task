import { Module } from "@nestjs/common";
import { ProcessManager } from "@app/common/process-manager/process-manager.service";

@Module({
    providers: [ProcessManager],
    exports: [ProcessManager],
})
export class ProcessManagerModule {}
