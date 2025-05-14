import { Request, Response } from 'express';
import { AbstractController } from '@src/controllers/_base/controller';
import { CreateUserUseCase } from '@src/use-cases/user/create-user.usecase';

import { Wrong } from '@src/util/either';
import { AlreadyExistsError, NotFoundError } from '@src/errors/generic.errors';
import { InputValidationError } from '@src/errors/input-validation.error';
import { ListUsersUseCase } from '@src/use-cases/user/list-users.usecase';
import { ShowUserUseCase } from '@src/use-cases/user/show-user.usecase';
import { UpdateUserUseCase } from '@src/use-cases/user/update-user.usecase';
import { DeleteUserUseCase } from '@src/use-cases/user/delete-user.usecase';
import { DefaultFailOutput } from '@src/types/errors';
import { UserControllerOutput } from '@src/use-cases/user/dtos';

type FailOutput = DefaultFailOutput;
type SuccessOutput = UserControllerOutput;

export class UserController extends AbstractController<FailOutput, SuccessOutput> {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly showUserUseCase: ShowUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {
    super();
  }

  async index(req: Request, res: Response) {
    const userId = req.params.id;
    const result = await this.listUsersUseCase.run({ id: userId });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async show(req: Request, res: Response) {
    const userId = req.params.id;
    const result = await this.showUserUseCase.run({ id: userId });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async create(req: Request, res: Response) {
    const result = await this.createUserUseCase.run(req.body);
    return result.isRight() ? this.created(req, res, result) : this.handleError(req, res, result);
  }

  async update(req: Request, res: Response) {
    const userId = req.params.id;
    const result = await this.updateUserUseCase.run({
      id: userId,
      ...req.body,
    });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  async delete(req: Request, res: Response) {
    const userId = req.params.id;
    const result = await this.deleteUserUseCase.run({ id: userId });
    return result.isRight() ? this.ok(req, res, result) : this.handleError(req, res, result);
  }

  private handleError(
    req: Request,
    res: Response,
    result: Wrong<FailOutput, SuccessOutput> | FailOutput,
  ) {
    const error = result instanceof Wrong ? result.value : result;

    if (error instanceof InputValidationError) {
      return this.badRequest(req, res, result);
    }

    if (error instanceof NotFoundError) {
      return this.notFound(req, res, result);
    }

    if (error instanceof AlreadyExistsError) {
      return this.conflict(req, res, result);
    }

    return this.internalServerError(req, res, result);
  }
}
