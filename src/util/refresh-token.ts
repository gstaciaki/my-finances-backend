import crypto from 'node:crypto';

export const generateRefreshToken = () => {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.hash('sha256', token);

  return { token, hash };
};
export const hashRefreshToken = (token: string) => {
  return crypto.hash('sha256', token);
};
