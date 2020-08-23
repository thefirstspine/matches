import { IsString } from 'class-validator';

export class ExchangeDto {

  @IsString()
  shopItemId: string;

}
