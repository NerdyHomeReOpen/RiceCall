import { modules } from './modules';

export const accounts = {
  get: (): Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }> => {
    return modules.default.getAccounts();
  },

  add: (account: string, data: { autoLogin: boolean; rememberAccount: boolean; password: string }): void => {
    modules.default.addAccount(account, data);
  },

  delete: (account: string): void => {
    modules.default.deleteAccount(account);
  },

  onUpdate: (callback: (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => void): (() => void) => {
    return modules.default.listen('accounts', callback);
  },
};
