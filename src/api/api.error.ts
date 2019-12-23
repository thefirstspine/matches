export class ApiError extends Error {

  static readonly CODE_PARSE_ERROR: number = -32700;
  static readonly CODE_INVALID_REQUEST: number = -32600;
  static readonly CODE_METHOD_NOT_FOUND: number = -32601;
  static readonly CODE_INVALID_PARAMS: number = -32602;
  static readonly CODE_INTERNAL_ERROR: number = -32603;

  private errorCode: number;

  constructor(message: string, code: number) {
    super(message);
    this.errorCode = code;
  }

  public get code() {
    return this.errorCode;
  }

}
