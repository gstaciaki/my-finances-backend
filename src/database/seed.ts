import { cleanDatabase } from 'test/helpers/base-test';
import { usersSeed } from './seeds/user.seed';
import { prisma } from '.';

async function main() {
  console.log('Cleaning database...');
  await cleanDatabase(prisma);

  console.log('Starting seeds...');

  await usersSeed();
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
