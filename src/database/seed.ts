import * as readline from 'readline';
import { cleanDatabase } from 'test/helpers/base-test';
import { usersSeed } from './seeds/user.seed';
import { prisma } from '.';

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log('ATTENTION: this operation will purge all data on database');

  const confirmed = await askConfirmation('Are you sure? (y/N): ');

  if (!confirmed) {
    process.exit(0);
  }

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
