import { BaseBusinessError } from './base-business.error';

export class EmailOrPasswordWrongError extends BaseBusinessError {
  constructor() {
    super('Email ou senha do usuário incorreto');
  }
}

export class InvalidRefreshTokenError extends BaseBusinessError {
  constructor() {
    super('Refresh token é inválido');
  }
}
