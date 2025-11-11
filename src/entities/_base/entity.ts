import { randomUUID } from "crypto";

export interface BaseProps {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props?: BaseProps) {
    this.id = props?.id ?? randomUUID();
    this.createdAt = props?.createdAt ?? new Date();
    this.updatedAt = props?.updatedAt ?? new Date();
  }
}
