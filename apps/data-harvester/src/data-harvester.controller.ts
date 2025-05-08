import { Controller, Get, NotFoundException, Param, Post, Res, StreamableFile } from "@nestjs/common";
import { DataHarvesterService } from "./data-harvester.service";
import { ProcessInfo, ProcessInfoDto } from "@app/common";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";

@Controller("harvest")
export class DataHarvesterController {
    constructor(private readonly dataHarvesterService: DataHarvesterService) {}

    @Post("/collect")
    @ApiCreatedResponse({ description: "The download process has started. Please follow the process ID provided." })
    public async startHarvestingProcess(): Promise<{ processId: string; message: string }> {
        const processId = await this.dataHarvesterService.collect();

        return {
            processId,
            message: "The download process has started. Please follow the process ID provided.",
        };
    }

    /**
     * Checks the status of a download process.
     */
    @Get("/process/:id")
    @ApiOkResponse({ description: "Provides process instance", type: ProcessInfoDto })
    public async getHarvestStatus(@Param("id") id: string): Promise<ProcessInfo> {
        const process = this.dataHarvesterService.getHarvestStatus(id);

        if (!process) {
            throw new NotFoundException(`Process ${id} not found`);
        }

        return process;
    }

    @Get("process/:id/:fileName")
    @ApiOkResponse({ description: "Downloads prepared file", type: StreamableFile })
    async streamFile(
        @Param("id") processId: string,
        @Param("fileName") fileName: string,
        @Res({ passthrough: true }) res,
    ): Promise<StreamableFile> {
        const { stream, stats } = await this.dataHarvesterService.getFileStream(processId, fileName);

        res.set({
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename=\"${fileName}\"`,
            "Content-Length": stats.size.toString(),
        });

        return new StreamableFile(stream);
    }
}
