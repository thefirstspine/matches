import { IsString } from 'class-validator';

export class ApiGetQueueDto {

  @IsString()
  key: string;

}
