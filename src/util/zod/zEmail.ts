import z from 'zod';

export const zEmail = z.string().trim().toLowerCase().pipe(z.email());
