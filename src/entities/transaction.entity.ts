import { OutputTransaction } from '@src/use-cases/transaction/dtos';
import { BaseEntity, BaseProps } from './_base/entity';
import { Account } from './account.entity';
import { formatCurrencyToOutput } from '@src/util/currency';

export interface TransactionProps extends BaseProps {
  description?: string | null;
  amount: number;
  account: Account;
}

export class Transaction extends BaseEntity {
  readonly description: string | null;
  readonly amount: number;
  readonly account: Account;

  constructor({ description, amount, account, ...base }: TransactionProps) {
    super(base);
    this.description = description ?? null;
    this.amount = amount;
    this.account = account;
  }

  public toPrismaInput() {
    return {
      amount: this.amount,
      description: this.description,
      accountId: this.account.id,
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public toOutput(): OutputTransaction {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      amount: formatCurrencyToOutput(this.amount),
      description: this.description,
    };
  }
}
