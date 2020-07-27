import { IsIn, IsString, IsObject, IsInt, IsOptional } from 'class-validator';

export class JsonRpcRequestDto {

  @IsIn(['2.0'])
  jsonrpc: string;

  @IsInt()
  @IsOptional()
  id?: number;

  @IsString()
  method: string;

  @IsObject()
  params: {[key: string]: any};

}
