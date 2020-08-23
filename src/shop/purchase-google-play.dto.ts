import { IsString } from 'class-validator';

export class PurchaseGooglePlayDto {

  @IsString()
  shopItemId: string;

  @IsString()
  googlePlayToken: string;

}
