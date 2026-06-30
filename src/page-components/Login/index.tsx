import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import styles from './Login.module.css';

interface LoginPageProps {
  isActive: boolean;
  onNavigateToRegisterPage: () => void;
  onNavigateToChangeServerPage: () => void;
}

const LoginPageComponent: React.FC<LoginPageProps> = React.memo(({ isActive, onNavigateToRegisterPage, onNavigateToChangeServerPage }) => {
  const { t } = useTranslation();

  const comboEl = useRef<HTMLDivElement>(null);

  const [account, setAccount] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isRememberAccChecked, setIsRememberAccChecked] = useState<boolean>(false);
  const [isAutoLoginChecked, setIsAutoLoginChecked] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAccDropdownVisible, setIsAccDropdownVisible] = useState<boolean>(false);

  const deleteAccount = (account: string) => {
    ipc.accounts.delete(account);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;

    switch (name) {
      case 'account':
        const match = accounts[value];
        setAccount(value);
        setIsRememberAccChecked(match?.rememberAccount ?? false);
        setIsAutoLoginChecked(match?.autoLogin ?? false);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'autoLogin':
        setIsAutoLoginChecked(checked);
        setIsRememberAccChecked(checked ? true : isRememberAccChecked);
        break;
      case 'rememberAccount':
        if (isAutoLoginChecked && !checked) {
          setIsAutoLoginChecked(false);
          setIsRememberAccChecked(false);
        }
        setIsRememberAccChecked(checked);
        break;
    }
  };

  const handleAccountSelectClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsAccDropdownVisible((prev) => !prev);
  };

  const handleRegisterAccountPageClick = () => {
    onNavigateToRegisterPage();
  };

  const handleChangeServerPageClick = () => {
    onNavigateToChangeServerPage();
  };

  const handleForgotPasswordClick = () => {
    window.open('https://ricecall.com/forget', '_blank');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!account || !password) return;

    setIsLoading(true);

    await ipc.auth
      .login({ account, password })
      .then((res) => {
        if (!res.success) return;

        if (isRememberAccChecked) {
          ipc.accounts.add(account, { autoLogin: isAutoLoginChecked, rememberAccount: isRememberAccChecked, password });
        }

        localStorage.setItem('login-account', account);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    const loginAccount = localStorage.getItem('login-account') || '';

    setAccount(accounts[loginAccount] ? loginAccount : '');
    setPassword(accounts[loginAccount]?.password ?? '');
    setIsRememberAccChecked(accounts[loginAccount]?.rememberAccount ?? false);
    setIsAutoLoginChecked(accounts[loginAccount]?.autoLogin ?? false);
  }, [accounts]);

  useEffect(() => {
    const updateAccounts = (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => {
      setAccounts(accounts);
    };

    updateAccounts(ipc.accounts.get());
    const unsub = ipc.accounts.onUpdate(updateAccounts);

    return () => unsub();
  }, []);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (!comboEl.current?.contains(e.target as Node)) setIsAccDropdownVisible(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <main className={styles['page']} style={isActive ? {} : { display: 'none' }}>
      <main className={styles['body']}>
        <div className={styles['app-logo']} />
        <form className={styles['form-wrapper']} onSubmit={handleSubmit}>
          {isLoading ? (
            <>
              <div className={styles['loading-text']}>{`${t('logining')}...`}</div>
              <div className={styles['loading-bar']} />
            </>
          ) : (
            <>
              <div className={styles['input-wrapper']}>
                <div className={styles['label']}>{t('account')}</div>
                <div className={styles['input-box']} ref={comboEl}>
                  <input type="text" name="account" value={account} onChange={handleInputChange} placeholder={t('please-input-account')} className={styles['input']} />
                  <div className={styles['account-dropdown-arrow']} onClick={handleAccountSelectClick} />
                  <div className={styles['account-options']} style={isAccDropdownVisible ? {} : { display: 'none' }}>
                    {Object.entries(accounts).map(([account, { autoLogin, rememberAccount, password }]) => (
                      <div
                        key={account}
                        className={styles['account-option']}
                        onClick={() => {
                          setAccount(account);
                          setPassword(password);
                          setIsRememberAccChecked(rememberAccount);
                          setIsAutoLoginChecked(autoLogin);
                          setIsAccDropdownVisible(false);
                        }}
                      >
                        {account}
                        <div
                          className={styles['account-delete-button']}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAccount(account);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles['input-wrapper']}>
                <div className={styles['label']}>{t('password')}</div>
                <div className={styles['input-box']}>
                  <input type="password" name="password" value={password} onChange={handleInputChange} placeholder={t('please-input-password')} className={styles['input']} />
                </div>
              </div>
              <div className={styles['check-box-wrapper']}>
                <div className={styles['check-box']}>
                  <input type="checkbox" name="rememberAccount" checked={isRememberAccChecked} onChange={handleInputChange} className={styles['check']} tabIndex={-1} />
                  {t('remember-account')}
                </div>
                <div className={styles['check-box']}>
                  <input type="checkbox" name="autoLogin" checked={isAutoLoginChecked} onChange={handleInputChange} className={styles['check']} tabIndex={-1} />
                  {t('auto-login')}
                </div>
              </div>
              <button className={styles['submit-button']} onClick={handleSubmit} tabIndex={-1} disabled={!account || !password}>
                {t('login')}
              </button>
            </>
          )}
        </form>
      </main>
      <div className={styles['footer']}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className={styles['register-account-button']} onClick={handleRegisterAccountPageClick}>
            {t('register-account')}
          </div>
          {'/'}
          <div className={styles['change-server-button']} onClick={handleChangeServerPageClick}>
            {t('change-server')}
          </div>
        </div>
        <div className={styles['forget-password-button']} onClick={handleForgotPasswordClick}>
          {t('forgot-password')}
        </div>
      </div>
    </main>
  );
});

LoginPageComponent.displayName = 'LoginPageComponent';

const LoginPage = dynamic(() => Promise.resolve(LoginPageComponent), { ssr: false });

export default LoginPage;
