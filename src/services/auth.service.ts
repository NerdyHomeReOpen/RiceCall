// Services
import api from '@/services/api.service';
import ipc from '@/services/ipc.service';

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
  register: async (data: RegisterFormData): Promise<boolean> => {
    const res = await api.post('/register', data);
    return !!res;
  },

  login: async (data: LoginFormData): Promise<boolean> => {
    const res = await api.post('/login', {
      account: data.account,
      password: data.password,
      version,
    });
    if (!res?.token) return false;

    if (data.rememberAccount) {
      ipc.accounts.add(data.account, data);
    }
    if (data.autoLogin) {
      localStorage.setItem('token', res.token);
    }

    ipc.auth.login(res.token);
    return true;
  },

  logout: () => {
    localStorage.removeItem('token');
    ipc.auth.logout();
    return true;
  },

  autoLogin: async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const res = await api.post('/token/verify', { token, version });
    if (!res?.token) return false;

    ipc.auth.login(res.token);
    return true;
  },
};

export default authService;
