import { Injectable } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";
import AdmZip from "adm-zip";
import { StorageConfig } from "./storage-config.interface";

const STORAGE_DIR = path.join(__dirname, "..", "..", "..", "storage");

@Injectable()
export class StorageService {
    constructor(private readonly config: StorageConfig) {}

    public get storageDir() {
        return STORAGE_DIR;
    }

    public async ensureStorageDir() {
        await fs.mkdir(STORAGE_DIR, { recursive: true });
    }

    public async writeFile(buffer: Buffer, filename: string): Promise<string> {
        await this.ensureStorageDir();
        const filePath = path.join(STORAGE_DIR, filename);
        await fs.writeFile(filePath, buffer);
        return filePath;
    }

    public async unzipFile(zipPath: string): Promise<string[]> {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(STORAGE_DIR, true);
        return zip.getEntries().map((entry) => path.join(STORAGE_DIR, entry.entryName));
    }

    public async getStats(filePath: string) {
        return fs.stat(filePath);
    }

    public async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    public async deleteFile(filePath: string): Promise<void> {
        if (await this.fileExists(filePath)) {
            await fs.unlink(filePath);
        }
    }

    public async clearStorage(): Promise<void> {
        const files = await fs.readdir(STORAGE_DIR);
        for (const file of files) {
            await this.deleteFile(path.join(STORAGE_DIR, file));
        }
    }

    public async listFiles(): Promise<string[]> {
        return fs.readdir(STORAGE_DIR);
    }

    public getFilePath(filename: string): string {
        return path.join(STORAGE_DIR, filename);
    }

    public async readFileAsBuffer(filename: string): Promise<Buffer> {
        return fs.readFile(this.getFilePath(filename));
    }

    public async readFileAsText(filename: string): Promise<string> {
        return fs.readFile(this.getFilePath(filename), { encoding: "utf-8" });
    }

    public getPublicUrl(pathToFile: string): string {
        console.log(this.config.BASE_URL);
        return path.join(this.config.BASE_URL, pathToFile);
    }

    public async createDirectory(dir: string): Promise<void> {
        await fs.mkdir(dir, { recursive: true });
    }
}
