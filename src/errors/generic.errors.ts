import { BaseBusinessError } from "./base-business.error";

export class AlreadyExistsError extends BaseBusinessError {
  constructor(entity: string, field?: string) {
    const fieldInfo = field ? ` com este(a) ${field}` : "";
    super(`Já existe um(a) ${entity}${fieldInfo}.`);
  }
}
