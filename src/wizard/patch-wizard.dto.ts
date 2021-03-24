import {Length, IsOptional, IsNumber, IsIn, IsString} from 'class-validator';

export class PatchWizardDto {

  @Length(3, 100)
  @IsOptional()
  name?: string;

  @IsOptional()
  avatar?: string;

  @IsOptional()
  title?: string;

  @IsOptional()
  @IsNumber({}, {each: true})
  friends?: number[];

  @IsOptional()
  @IsString({each: true})
  quests?: string[];
}
