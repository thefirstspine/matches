import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiService } from './api.service';
import { ApiError } from './api.error';
import { AuthGuard } from '../@shared/auth-shared/auth.guard';

/**
 * Main API Controller. The controller does accept only one POST request.
 * This controller handle all the requets from the clients.
 */
@Controller('api')
export class ApiController {

  constructor(private readonly apiService: ApiService) {}

  /**
   * Main post method. This method is protected with the AuthGuard
   * @param body
   */
  @Post()
  @UseGuards(AuthGuard)
  api(@Req() request: any): IJsonRpcResponse|IJsonRpcError {
    // Try to decode request
    if (!isJsonRpcRequest(request.body)) {
      return this.outputError(new ApiError('The JSON sent is not a valid Request object', ApiError.CODE_INVALID_REQUEST));
    }

    // Does the method exist?
    if (typeof this.apiService[request.body.method] === 'undefined') {
      return this.outputError(new ApiError('The method does not exist / is not available', ApiError.CODE_METHOD_NOT_FOUND));
    }

    try {
      // Try to execute the method on the service
      const result: any = this.apiService[request.body.method]({
        params: request.body.params,
        id: request.body.id,
        user: request.user,
      });
      return {
        jsonrpc: '2.0',
        result,
        id: request.body.id,
      };
    } catch (e) {
      // In case of error, output the error
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

/**
 * Type guard for IJsonRpcRequest
 * @param toBeDetermined
 */
export function isJsonRpcRequest(toBeDetermined: any): toBeDetermined is IJsonRpcRequest {
  return toBeDetermined.jsonrpc === '2.0' && toBeDetermined.method && toBeDetermined.params;
}
