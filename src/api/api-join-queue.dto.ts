import { IsString, IsOptional } from 'class-validator';

export class ApiJoinQueueDto {

  @IsString()
  key: string;

  @IsString()
  destiny: string;

  @IsString()
  @IsOptional()
  origin?: string;

  @IsString()
  @IsOptional()
  style?: string;

  @IsString()
  @IsOptional()
  cover?: string;

}
