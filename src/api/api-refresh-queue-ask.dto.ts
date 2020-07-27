import { IsString, IsOptional } from 'class-validator';

export class ApiRefreshQueueAskDto {

  @IsString()
  key: string;

}
