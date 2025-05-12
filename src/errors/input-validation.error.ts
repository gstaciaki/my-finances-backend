export class InputValidationError extends Error {
  constructor(
    message = "Um ou mais dados de entrada fornecidos são inválidos"
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
