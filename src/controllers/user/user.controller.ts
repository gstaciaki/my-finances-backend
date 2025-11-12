import { Request, Response } from 'express';
import { AbstractController } from '@src/controllers/_base/controller';
import { CreateUserUseCase } from '@src/use-cases/user/create-user/create-user.usecase';
import { ListUsersUseCase } from '@src/use-cases/user/list-users/list-users.usecase';
import { ShowUserUseCase } from '@src/use-cases/user/show-user/show-user.usecase';
import { UpdateUserUseCase } from '@src/use-cases/user/update-user/update-user.usecase';
import { DeleteUserUseCase } from '@src/use-cases/user/delete-user/delete-user.usecase';
import { DefaultFailOutput } from '@src/types/errors';
import { ListUsersInput, UserControllerOutput } from '@src/use-cases/user/dtos';

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
    const result = await this.listUsersUseCase.run(req.query as unknown as ListUsersInput);
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
}
