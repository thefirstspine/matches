import {Length, IsOptional} from 'class-validator';

export class PatchWizardDto {

  @Length(3, 10)
  @IsOptional()
  name?: string;

  @IsOptional()
  avatar?: string;

  @IsOptional()
  title?: string;
}
