import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET as jwt.Secret;
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '0');

export function generateJWT(data: any) {
  const encoded = jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return encoded;
}

export function verifyJWT(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return { valid: true, ...decoded };
}
