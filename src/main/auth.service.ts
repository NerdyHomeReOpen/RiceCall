// Package
import packageJson from '../../package.json';
const version = packageJson.version;

// Services
import api from './api.service.js';

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

const authService = {
  register: async (formData: RegisterFormData): Promise<{ success: true; message: string } | { success: false }> => {
    const res = await api.post('/account/register', formData);
    if (!res) return { success: false };

    return { success: true, message: res.message };
  },

  login: async (formData: LoginFormData): Promise<{ success: true; token: string } | { success: false }> => {
    const res = await api.post('/account/login', { ...formData, version });
    if (!res?.token) return { success: false };

    return { success: true, token: res.token };
  },

  autoLogin: async (token: string): Promise<{ success: true; token: string } | { success: false }> => {
    const res = await api.post('/token/verify', { token, version });
    if (!res?.token) return { success: false };

    return { success: true, token: res.token };
  },
};

export default authService;
