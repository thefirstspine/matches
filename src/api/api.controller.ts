import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiError } from './api.error';
import { JsonRpcRequestDto } from './json-rpc-request.dto';
import { LogsService } from '@thefirstspine/logs-nest';
import { CertificateGuard } from '@thefirstspine/certificate-nest';
import { AuthGuard } from './auth.guard';

/**
 * Main API Controller. The controller does accept only one POST request.
 * This controller handle all the requets from the clients.
 */
@Controller('api')
export class ApiController {

  constructor(
    private readonly apiService: ApiService,
    private readonly logService: LogsService,
  ) {}

  /**
   * Main post method. This method is protected with the AuthGuard
   * @param body
   */
  @Post()
  @UseGuards(CertificateGuard)
  @UseGuards(AuthGuard)
  async api(@Req() request, @Body() body: JsonRpcRequestDto): Promise<IJsonRpcResponse|IJsonRpcError> {
    // Does the method exist?
    if (typeof this.apiService[body.method] === 'undefined') {
      return this.outputError(new ApiError('The method does not exist / is not available', ApiError.CODE_METHOD_NOT_FOUND));
    }

    this.logService.info('JSON RPC request incoming', body);

    try {
      // Try to execute the method on the service
      const result: any = await this.apiService[body.method]({
        params: body.params,
        id: body.id,
        user: request.user,
      });
      return {
        jsonrpc: '2.0',
        result,
        id: body.id,
      };
    } catch (e) {
      // In case of error, output the error
      if (e instanceof Error) {
        this.logService.error(
          'API error',
          {
            name: e.name,
            message: e.message,
            stack: e.stack,
          });
      }
      if (e instanceof ApiError) {
        return this.outputError(e);
      } else {
        return this.outputError(new ApiError(e.message, ApiError.CODE_INTERNAL_ERROR));
      }
    }
  }

  /**
   * Output an error from an ApiError instance
   * @param error
   */
  outputError(error: ApiError): IJsonRpcError {
    return {
      jsonrpc: '2.0',
      error: {
        message: error.message,
        code: error.code,
      },
    };
  }

}

/**
 * Interface representing a full JSON-RPC request
 * @see https://www.jsonrpc.org/specification#request_object
 */
export interface IJsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params: any;
  id?: number;
}

/**
 * Interface representing a full JSON-RPC response
 * @see https://www.jsonrpc.org/specification#response_object
 */
export interface IJsonRpcResponse {
  jsonrpc: '2.0';
  result: any;
  id?: number;
}

/**
 * Interface representing a full JSON-RPC error
 * @see https://www.jsonrpc.org/specification#error_object
 */
export interface IJsonRpcError {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: any;
  };
}
