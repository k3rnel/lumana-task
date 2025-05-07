import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { catchError, lastValueFrom, map, throwError } from "rxjs";
import { StorageService } from "@app/common";
import { ProcessManager } from "@app/common";
import * as fs from "fs";
import * as readline from "readline";
import { RuntimeException } from "@nestjs/core/errors/exceptions";
import path from "node:path";

@Injectable()
export class GeonamesService {
    private readonly logger = new Logger(GeonamesService.name);
    private readonly downloadUrl = "https://download.geonames.org/export/dump/allCountries.zip";

    constructor(
        private readonly httpService: HttpService,
        private readonly storageService: StorageService,
        private readonly processManager: ProcessManager,
    ) {}

    public async downloadAndExtract(processId: string): Promise<void> {
        try {
            this.processManager.markProcessing(processId);
            this.logger.log(`[${processId}] Starting download and extract process`);

            const baseDir = this.storageService.getFilePath(processId);
            await fs.promises.mkdir(baseDir, { recursive: true });

            const zipFileName = `allCountries_${processId}.zip`;
            const zipFilePath = path.join(baseDir, zipFileName);
            const writer = fs.createWriteStream(zipFilePath);

            this.logger.log(`[${processId}] Downloading ZIP file...`);
            const stream$ = this.httpService.get(this.downloadUrl, { responseType: "stream" }).pipe(
                map((res) => res.data.pipe(writer)),
                catchError((err) => {
                    return throwError(() => new Error(`Download failed: ${err.message}`));
                }),
            );

            await lastValueFrom(stream$);
            await new Promise<void>((resolve, reject) => {
                writer.on("finish", () => resolve());
                writer.on("error", reject);
            });
            this.logger.log(`[${processId}] ZIP file downloaded.`);

            this.logger.log(`[${processId}] Extracting ZIP file...`);
            const extractedFiles = await this.storageService.unzipFile(zipFilePath);
            const txtPath = extractedFiles.find((f) => path.basename(f) === "allCountries.txt");

            if (!txtPath) {
                throw new Error("allCountries.txt not found after extraction");
            }

            this.logger.log(`[${processId}] ZIP file extracted.`);

            const txtFileName = `allCountries_${processId}.txt`;
            const jsonFileName = `all_countries.json`;
            const txtFilePath = path.join(baseDir, txtFileName);
            const jsonFilePath = path.join(baseDir, jsonFileName);

            await fs.promises.rename(txtPath, txtFilePath);

            this.logger.log(`[${processId}] Parsing TXT to JSON...`);
            await this.parseAllCountriesTxtToJsonFile(txtFilePath, jsonFilePath);
            this.logger.log(`[${processId}] TXT parsed to JSON.`);

            const publicUrl = this.storageService.getPublicUrl(
                path.join("harvest", "process", processId, jsonFileName),
            );

            this.logger.log(`[${processId}] Cleaning up extra files...`);
            await this.storageService.deleteFile(txtFilePath);
            await this.storageService.deleteFile(zipFilePath);

            this.logger.log(`[${processId}] Process complete. File available at ${publicUrl}`);
            this.processManager.complete(processId, { publicUrl });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            this.logger.error(`[${processId}] Process failed: ${message}`);
            this.processManager.fail(processId, message);
        }
    }

    private async parseAllCountriesTxtToJsonFile(txtFilePath: string, outputFilePath: string): Promise<void> {
        if (!(await this.storageService.fileExists(txtFilePath))) {
            throw new RuntimeException(`Txt file does not exist at ${txtFilePath}`);
        }

        const inputStream = fs.createReadStream(txtFilePath, { encoding: "utf-8" });
        const outputStream = fs.createWriteStream(outputFilePath, { encoding: "utf-8" });

        const rl = readline.createInterface({
            input: inputStream,
            crlfDelay: Infinity,
        });

        outputStream.write("[\n");
        let isFirst = true;

        for await (const line of rl) {
            if (!line.trim()) continue;

            const values = line.split("\t");
            if (values.length < 19) continue;

            const record = {
                geonameid: values[0],
                name: values[1],
                asciiname: values[2],
                alternatenames: values[3],
                latitude: parseFloat(values[4]),
                longitude: parseFloat(values[5]),
                featureClass: values[6],
                featureCode: values[7],
                countryCode: values[8],
                cc2: values[9],
                admin1Code: values[10],
                admin2Code: values[11],
                admin3Code: values[12],
                admin4Code: values[13],
                population: parseInt(values[14], 10),
                elevation: values[15] ? parseInt(values[15], 10) : null,
                dem: values[16],
                timezone: values[17],
                modificationDate: values[18],
            };

            const json = JSON.stringify(record, null, 2);
            if (!isFirst) outputStream.write(",\n");
            outputStream.write(json);
            isFirst = false;
        }

        outputStream.write("\n]");
        outputStream.end();
    }
}
