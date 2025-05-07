import { BadRequestException, Controller, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as os from "os";
import { diskStorage } from "multer";
import { extname } from "path";
import { DataSeederService } from "./data-seeder.service";

@Controller("seeder")
export class DataSeederController {
    constructor(private seederService: DataSeederService) {}

    @Post("upload")
    // Ignore IDE error if you're using webstorm. It is already one year they're not fixing this.
    @UseInterceptors(
        FileInterceptor("file", {
            storage: diskStorage({
                destination: os.tmpdir(),
                filename: (req, file, cb) => {
                    const ext = extname(file.originalname);
                    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.originalname.endsWith(".json") || file.mimetype !== "application/json") {
                    return cb(new BadRequestException("Only JSON files are allowed"), false);
                }
                cb(null, true);
            },
        }),
    )
    async handleUpload(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException("File upload failed or missing");

        await this.seederService.ingestFile(file.path);

        return { message: "Upload successful", path: file.path };
    }
}
