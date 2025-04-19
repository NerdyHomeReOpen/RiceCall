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
  gender: 'Male' | 'Female';
}

interface AccountItem {
  account: string;
  token: string;
  auto: boolean;
  selected: boolean;
}

const getParsed = (): { accounts: AccountItem[]; remembered: string[] } => {
  try {
    return JSON.parse(localStorage.getItem('login-accounts') || '');
  } catch {
    return { accounts: [], remembered: [] };
  }
};

const saveParsed = (data: { accounts: AccountItem[]; remembered: string[] }) =>
  localStorage.setItem('login-accounts', JSON.stringify(data));

export const authService = {
  login: async (formData: LoginFormData): Promise<boolean> => {
    const res = await apiService.post('/login', {
      ...formData,
      password: formData.password,
    });
    if (!res?.token) return false;
    localStorage.setItem('token', res.token);
    const parsed = getParsed();
    parsed.accounts = parsed.accounts.map((acc) =>
      acc.account === formData.account
        ? {
            ...acc,
            token: formData.autoLogin ? res.token : '',
            auto: formData.autoLogin,
            selected: true,
          }
        : { ...acc, token: acc.auto ? acc.token : '', selected: false },
    );
    if (!parsed.accounts.find((a) => a.account === formData.account)) {
      parsed.accounts.push({
        account: formData.account,
        token: formData.autoLogin ? res.token : '',
        auto: formData.autoLogin,
        selected: true,
      });
    }
    parsed.remembered = formData.rememberAccount
      ? Array.from(new Set([...parsed.remembered, formData.account]))
      : parsed.remembered.filter((a) => a !== formData.account);
    saveParsed(parsed);
    ipcService.auth.login(res.token);
    return true;
  },

  register: async (data: RegisterFormData) => {
    const res = await apiService.post('/register', {
      ...data,
      password: data.password,
    });
    return !!res;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('autoLogin');
    ipcService.auth.logout();
    const parsed = getParsed();
    parsed.accounts = parsed.accounts.map((acc) => ({
      ...acc,
      token: acc.auto ? acc.token : '',
    }));
    saveParsed(parsed);
    return true;
  },

  isAutoLoginEnabled: () => localStorage.getItem('autoLogin') === 'true',
  isRememberAccountEnabled: () => !!localStorage.getItem('account'),

  autoLogin: async () => {
    const parsed = getParsed();
    const acc =
      parsed.accounts.find((a) => a.auto && a.selected) ||
      parsed.accounts.find((a) => a.auto);
    if (!acc?.token) return false;
    localStorage.setItem('token', acc.token);
    ipcService.auth.login(acc.token);
    return true;
  },
};

export default authService;
