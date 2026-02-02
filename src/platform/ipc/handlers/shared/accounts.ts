/**
 * Accounts handlers - shared between Electron and Web.
 * Provides account storage management.
 */

import type { HandlerContext, HandlerRegistration } from '@/platform/ipc/types';

export interface AccountCredentials {
  autoLogin: boolean;
  rememberAccount: boolean;
  password: string;
}

export type AccountsMap = Record<string, AccountCredentials>;

const ACCOUNTS_KEY = 'accounts';

/**
 * Create accounts handlers.
 */
export function createAccountsHandlers(): HandlerRegistration {
  return {
    sync: {
      'get-accounts': (ctx: HandlerContext): AccountsMap => {
        return ctx.storage.get<AccountsMap>(ACCOUNTS_KEY, {});
      },
    },

    send: {
      'add-account': (ctx: HandlerContext, account: string, data: AccountCredentials) => {
        const accounts = ctx.storage.get<AccountsMap>(ACCOUNTS_KEY, {});
        accounts[account] = data;
        ctx.storage.set(ACCOUNTS_KEY, accounts);
        ctx.broadcast('accounts', accounts);
      },

      'delete-account': (ctx: HandlerContext, account: string) => {
        const accounts = ctx.storage.get<AccountsMap>(ACCOUNTS_KEY, {});
        delete accounts[account];
        ctx.storage.set(ACCOUNTS_KEY, accounts);
        ctx.broadcast('accounts', accounts);
      },
    },
  };
}
