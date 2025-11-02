import { BaseEntity, BaseProps } from "./_base/entity";
import { Account } from "./account.entity";

export interface TransactionProps extends BaseProps {
    description: string;
    amount: number;
    account: Account;
}

export class Transaction extends BaseEntity {
    readonly description: string;
    readonly amount: number;
    readonly account: Account;

    constructor({ description, amount, account, ...base }: TransactionProps) {
        super(base)
        this.description = description
        this.amount = amount
        this.account = account
    }
}