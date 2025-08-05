// Services
import apiService from '@/services/api.service';
import ipcService from '@/services/ipc.service';

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
  isAutoLoginEnabled: () => localStorage.getItem('autoLogin') === 'true',

  isRememberAccountEnabled: () => !!localStorage.getItem('account'),

  register: async (data: RegisterFormData) => {
    const res = await apiService.post('/register', data);
    return !!res;
  },

  login: async (data: LoginFormData): Promise<boolean> => {
    const res = await apiService.post('/login', data);
    if (!res?.token) return false;
    const accounts = localStorage.getItem('accounts')?.split(',') || [];
    if (data.rememberAccount && !accounts.includes(data.account)) {
      accounts.push(data.account);
      localStorage.setItem('accounts', accounts.join(','));
    }
    if (data.autoLogin) {
      localStorage.setItem('token', res.token);
    }
    ipcService.auth.login(res.token);
    return true;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('autoLogin');
    ipcService.auth.logout();
    return true;
  },

  autoLogin: async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const res = await apiService.post('/token/verify', { token });
    if (!res?.token) return false;
    ipcService.auth.login(res.token);
    return true;
  },
};

export default authService;
