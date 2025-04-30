import jwt from 'jsonwebtoken';

// Config
import config from '@/config';

const JWT_SECRET = config.jwtSecret as jwt.Secret;
const JWT_EXPIRES_IN = parseInt(config.jwtExpiresIn || '0');

export function generateJWT(data: any) {
  const encoded = jwt.sign(data, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return encoded;
}

export function verifyJWT(token: string) {
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  return { valid: true, ...decoded };
}
