import {Length, IsOptional, IsNumber} from 'class-validator';

export class PatchWizardDto {

  @Length(3, 10)
  @IsOptional()
  name?: string;

  @IsOptional()
  avatar?: string;

  @IsOptional()
  title?: string;

  @IsOptional()
  @IsNumber({}, {each: true})
  friends?: number[];
}
