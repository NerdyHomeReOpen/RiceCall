// Services
import api from '@/services/api.service';

// Package
import packageJson from '../../package.json';
const version = packageJson.version;

interface LoginFormData {
  account: string;
  password: string;
  rememberAccount: boolean;
  autoLogin: boolean;
}

interface RegisterFormData {
  account: string;
  password: string;
  username: string;
}

export const authService = {
  register: async (data: RegisterFormData): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/register', data);

    return { success: !!res, message: res?.message || '' };
  },

  login: async (data: LoginFormData): Promise<{ success: true; token: string } | { success: false }> => {
    const res = await api.post('/login', {
      account: data.account,
      password: data.password,
      version,
    });
    if (!res?.token) return { success: false };

    return { success: true, token: res.token };
  },

  logout: async (): Promise<boolean> => {
    localStorage.removeItem('token');

    return true;
  },

  autoLogin: async (): Promise<{ success: true; token: string } | { success: false }> => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false };

    const res = await api.post('/token/verify', { token, version });
    if (!res?.token) return { success: false };

    return { success: true, token: res.token };
  },
};

export default authService;
