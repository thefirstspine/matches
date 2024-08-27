import { IsString, IsOptional, IsNumber, IsArray, ValidateIf } from 'class-validator';

export class ApiJoinQueueDto {

  @IsString()
  key: string;

  @IsArray()
  @IsOptional()
  cards?: any[];

  @IsNumber()
  score: number;

}
