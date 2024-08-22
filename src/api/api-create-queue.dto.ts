import { IsString, IsOptional, IsIn, IsNumber, Min, Max } from 'class-validator';
import { Themes } from '../game/themes';

export class ApiCreateQueueDto {

  @IsString()
  gameTypeId: string;

  @IsString()
  @IsOptional()
  @IsIn(Themes.user)
  theme?: string;

  @IsString()
  @IsOptional()
  key?: string;

  @IsNumber()
  @Min(0.1)
  @Max(9999)
  @IsOptional()
  expirationTimeModifier?: number;

}
