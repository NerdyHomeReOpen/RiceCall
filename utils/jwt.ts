/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
import jwt from 'jsonwebtoken';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '0';

export function generateJWT(data: any) {
  return jwt.sign({ ...data }, JWT_SECRET, {
    expiresIn: parseInt(JWT_EXPIRES_IN),
  });
}

export function verifyJWT(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { valid: true, ...decoded };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}
