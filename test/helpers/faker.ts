export function genCpf(): string {
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let cpf = '';
  for (let i = 0; i < 9; i++) {
    cpf += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return cpf;
}
