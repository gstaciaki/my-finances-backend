import { populateUsers } from './populates/user.populate';
import { populateAccounts } from './populates/account.populate';
import { populateUserAccounts } from './populates/user-account.populate';
import { populateTransactions } from './populates/transaction.populate';

async function main() {
  console.log('Starting populate script...');

  const userIds = await populateUsers();

  const accounts = await populateAccounts();
  const accountIds = accounts.map(account => account.id);

  await populateUserAccounts(userIds, accountIds);

  await populateTransactions(accountIds);

  console.log('Populate script completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
