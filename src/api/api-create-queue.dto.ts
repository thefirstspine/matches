import { IsString } from 'class-validator';

export class ApiCreateQueueDto {

  @IsString()
  gameTypeId: string;

}
