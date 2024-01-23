import { IsString, IsOptional, IsArray, IsIn, IsNumber, Min, Max } from 'class-validator';
import { Themes } from '../game/themes';
import { Modifiers } from '../game/modifiers';

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

  @IsArray()
  @IsString({ each: true })
  @IsIn(Modifiers.user, { each: true })
  @IsOptional()
  modifiers?: string[];

  @IsNumber()
  @Min(0.1)
  @Max(9999)
  @IsOptional()
  expirationTimeModifier?: number;

}
