import { Controller, Get, NotFoundException, Param, Post, Res, StreamableFile } from "@nestjs/common";
import { DataHarvesterService } from "./data-harvester.service";
import { ProcessInfo } from "@app/common";

@Controller("harvest")
export class DataHarvesterController {
    constructor(private readonly dataHarvesterService: DataHarvesterService) {}

    @Post("/collect")
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
    public async getHarvestStatus(@Param("id") id: string): Promise<ProcessInfo> {
        const process = this.dataHarvesterService.getHarvestStatus(id);

        if (!process) {
            throw new NotFoundException(`Process ${id} not found`);
        }

        return process;
    }

    @Get("process/:id/:fileName")
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
