import { populateUsers } from './populates/user.populate';

// As populates de Conta, Vínculo e Movimentação voltam nas histórias que
// recriarem essas tabelas (ficam em ./populates, fora da compilação).
async function main() {
  console.log('Starting populate script...');

  await populateUsers();

  console.log('Populate script completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
