import { modules } from './modules';

export const auth = {
  login: async (formData: { account: string; password: string }): Promise<{ success: true; token: string } | { success: false }> => {
    return await modules.default.login(formData);
  },

  logout: async (): Promise<void> => {
    return await modules.default.logout();
  },

  register: async (formData: { account: string; password: string; email: string; username: string; locale: string }): Promise<{ success: true; message: string } | { success: false }> => {
    return await modules.default.register(formData);
  },

  autoLogin: async (token: string): Promise<{ success: true; token: string } | { success: false }> => {
    return await modules.default.autoLogin(token);
  },
};
