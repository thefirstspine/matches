import { IsString, IsOptional, IsArray, IsIn } from 'class-validator';
import { Themes } from '../game/themes';
import { Modifiers } from '../game/modifiers';

export class ApiCreateQueueDto {

  @IsString()
  gameTypeId: string;

  @IsString()
  @IsOptional()
  @IsIn(Themes.all)
  theme?: string;

  @IsArray()
  @IsString({ each: true })
  @IsIn(Modifiers.user, { each: true })
  @IsOptional()
  modifiers?: string[];

}
