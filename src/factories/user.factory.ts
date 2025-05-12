import { UserController } from '@src/controllers/user.controller';
import { UserRepository } from '@src/repositories/user.repository';
import { CreateUserUseCase } from '@src/use-cases/user/create-user.usecase';
import { DeleteUserUseCase } from '@src/use-cases/user/delete-user.usecase';
import { ListUsersUseCase } from '@src/use-cases/user/list-users.usecase';
import { ShowUserUseCase } from '@src/use-cases/user/show-user.usecase';
import { UpdateUserUseCase } from '@src/use-cases/user/update-user.usecase';

export function makeUserController(): UserController {
  const userRepository = new UserRepository();
  const createUserUseCase = new CreateUserUseCase(userRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const showUserUseCase = new ShowUserUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);

  return new UserController(
    createUserUseCase,
    listUsersUseCase,
    showUserUseCase,
    updateUserUseCase,
    deleteUserUseCase,
  );
}
