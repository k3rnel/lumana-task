import { Injectable, NotFoundException } from "@nestjs/common";
import { GeonamesService } from "./geonames/geonames.service";
import { ProcessInfo, ProcessManager, StorageService } from "@app/common";
import * as fs from "fs";
import path from "node:path";
import { Stats } from "node:fs";

@Injectable()
export class DataHarvesterService {
    constructor(
        private readonly geonames: GeonamesService,
        private readonly processManager: ProcessManager,
        private readonly storageService: StorageService,
    ) {}

    public async collect(): Promise<string> {
        const processId = this.processManager.create();

        this.geonames.downloadAndExtract(processId).catch((err) => this.processManager.fail(processId, err.message));

        return processId;
    }

    public getHarvestStatus(id: string): ProcessInfo {
        const process = this.processManager.get(id);

        if (!process) {
            throw new NotFoundException(`Process ${id} not found`);
        }

        return process;
    }

    public async getFileStream(processId: string, fileName: string): Promise<{ stream: fs.ReadStream; stats: Stats }> {
        const process = this.processManager.get(processId);

        if (process && process.status !== "done") {
            throw new NotFoundException(`Process ${processId} is not ready`);
        }

        const fullPath = this.storageService.getFilePath(path.join(processId, fileName));
        const exists = await this.storageService.fileExists(fullPath);

        if (!exists) {
            throw new NotFoundException(`File ${fileName} not found in process ${processId}`);
        }

        const stream = fs.createReadStream(fullPath);
        const stats = await this.storageService.getStats(fullPath);

        return { stream, stats };
    }
}
