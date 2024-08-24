import { IsString, IsOptional, IsNumber } from 'class-validator';

export class ApiJoinQueueDto {

  @IsString()
  key: string;

  @IsString()
  destiny: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsNumber()
  score: number;

}
