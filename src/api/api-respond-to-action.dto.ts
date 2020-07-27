import { IsString, IsObject } from 'class-validator';

export class ApiRespondToActionDto {

  response: any;

  @IsString()
  actionType: string;

}
