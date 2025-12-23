import packageJson from '../package.json' with { type: 'json' };
const version = packageJson.version;
import * as APIService from './api.service.js';

interface RegisterFormData {
  account: string;
  password: string;
  email: string;
  username: string;
  locale: string;
}

interface LoginFormData {
  account: string;
  password: string;
}

export async function register(formData: RegisterFormData): Promise<{ success: true; message: string } | { success: false }> {
  const res = await APIService.post('/account/register', formData);
  if (!res) return { success: false };

  return { success: true, message: res.message };
}

export async function login(formData: LoginFormData): Promise<{ success: true; token: string } | { success: false }> {
  const res = await APIService.post('/account/login', { ...formData, version });
  if (!res?.token) return { success: false };

  return { success: true, token: res.token };
}

export async function autoLogin(token: string): Promise<{ success: true; token: string } | { success: false }> {
  const res = await APIService.post('/token/verify', { token, version });
  if (!res?.token) return { success: false };

  return { success: true, token: res.token };
}
