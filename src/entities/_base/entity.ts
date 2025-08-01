import { v4 as uuid } from 'uuid';

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
    this.id = props?.id ?? uuid();
    this.createdAt = props?.createdAt ?? new Date();
    this.updatedAt = props?.updatedAt ?? new Date();
  }
}
