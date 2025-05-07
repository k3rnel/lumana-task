import { IsOptional, IsString, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";
import { number } from "joi";

export class SearchGeonamesDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    countryCode?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    populationMin?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    populationMax?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 20;
}
