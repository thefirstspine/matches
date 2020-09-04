import { IsString } from 'class-validator';

export class PurchaseDto {

  @IsString()
  shopItemId: string;

}
