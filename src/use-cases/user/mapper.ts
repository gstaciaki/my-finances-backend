import { User } from '@src/entities/user.entity';
import { OutputUser } from './dtos';

export class UserMapper {
  static toOutput(user: User): OutputUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
