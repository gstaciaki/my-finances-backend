import { faker } from '@faker-js/faker';
import { Actor } from '@src/database/context';

export const genActor = ({ userId = faker.string.uuid() }: Partial<Actor> = {}): Actor => ({
  userId,
});
