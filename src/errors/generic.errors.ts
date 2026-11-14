import { BaseBusinessError } from './base-business.error';

export class AlreadyExistsError extends BaseBusinessError {
  constructor(entity: string, field?: string) {
    const fieldInfo = field ? ` com este(a) ${field}` : '';
    super(`Já existe um(a) ${entity}${fieldInfo}.`);
  }
}

export class NotFoundError extends BaseBusinessError {
  constructor();
  constructor(entity: string, field: string, value: string);

  constructor(entity?: string, field?: string, value?: string) {
    super(
      entity
        ? `Não foi encontrado(a) ${entity} com ${field}: ${value}.`
        : 'Registro não encontrado.',
    );
  }
}

export class ForbiddenError extends BaseBusinessError {
  constructor() {
    super('Forbidden acess');
  }
}

export class ConflitError extends BaseBusinessError {
  constructor(message?: string) {
    super(message);
  }
}

export class ServiceUnavailableError extends BaseBusinessError {
  constructor(message?: string) {
    super(message);
  }
}

export class TooManyRequestsError extends BaseBusinessError {
  constructor(message?: string) {
    super(message);
  }
}
