export function removeAccents(input: string): string {
  if (!input) {
    return input;
  }

  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
