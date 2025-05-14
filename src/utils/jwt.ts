import jwt from 'jsonwebtoken';

// Config
import { jwtConfig } from '@/config';

export function generateJWT(data: any) {
  return jwt.sign(data, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: 'HS256',
  } as any);
}

export function verifyJWT(token: string) {
  try {
    const data = jwt.verify(token, jwtConfig.secret, {
      algorithms: ['HS256'],
    }) as { userId: string };
    return { valid: true, data };
  } catch (error: any) {
    return { valid: false, error };
  }
}
