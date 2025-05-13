import jwt from 'jsonwebtoken';

// Config
import { jwtConfig } from '@/config';

export function generateJWT(data: any) {
  return jwt.sign(data, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: 'HS256',
  });
}

export function verifyJWT(token: string) {
  try {
    const data = jwt.verify(token, jwtConfig.secret, {
      algorithms: ['HS256'],
    }) as { userId: string };
    return { valid: true, data };
  } catch (error) {
    return { valid: false, error };
  }
}
