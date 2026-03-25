export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode = 500, errorCode = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
