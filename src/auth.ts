import packageJson from '../package.json' with { type: 'json' };

import { post } from '@/api';

type RegisterFormData = {
  account: string;
  password: string;
  email: string;
  username: string;
  locale: string;
};

type LoginFormData = {
  account: string;
  password: string;
};

export async function register(formData: RegisterFormData): Promise<{ success: true; message: string } | { success: false }> {
  const res = await post('/account/register', formData);
  if (!res || typeof res !== 'object' || !('message' in res) || typeof res.message !== 'string') return { success: false };

  return { success: true, message: res.message };
}

export async function login(formData: LoginFormData): Promise<{ success: true; token: string } | { success: false }> {
  const res = await post('/account/login', { ...formData, version: packageJson.version });
  if (!res || typeof res !== 'object' || !('token' in res) || typeof res.token !== 'string') return { success: false };

  return { success: true, token: res.token };
}

export async function autoLogin(token: string): Promise<{ success: true; token: string } | { success: false }> {
  const res = await post('/token/verify', { token, version: packageJson.version });
  if (!res || typeof res !== 'object' || !('token' in res) || typeof res.token !== 'string') return { success: false };

  return { success: true, token: res.token };
}
