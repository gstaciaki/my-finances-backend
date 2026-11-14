import { Actor } from '@src/database/context';
import { IUnitOfWork, Repositories, UnitOfWorkOptions } from '@src/database/unit-of-work';
import { Either } from '@src/util/either';

/**
 * Unit of Work para testes unitários: não abre transação nem contexto,
 * só entrega os repositórios falsos ao callback e devolve o que ele devolver.
 * Guarda os actors recebidos em `actors` para os testes conferirem quem executou.
 */
export class FakeUnitOfWork implements IUnitOfWork {
  readonly actors: Actor[] = [];

  constructor(private readonly repositories: Repositories) {}

  async run<L, R>(
    actor: Actor,
    fn: (repos: Repositories) => Promise<Either<L, R>>,
    // Ignorado: o fake não tem transação, então não há timeout nem espera.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _opts?: UnitOfWorkOptions,
  ): Promise<Either<L, R>> {
    this.actors.push(actor);
    return fn(this.repositories);
  }
}
