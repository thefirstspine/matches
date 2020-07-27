import { IsString, IsOptional } from 'class-validator';

export class ApiQuitQueueDto {

  @IsString()
  key: string;

}
