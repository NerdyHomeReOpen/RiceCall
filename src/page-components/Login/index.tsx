import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import styles from './Login.module.css';

interface LoginPageProps {
  display: boolean;
  onRegisterBtnClick: () => void;
  onChangeServerBtnClick: () => void;
}

const LoginPageComponent: React.FC<LoginPageProps> = React.memo(({ display, onRegisterBtnClick, onChangeServerBtnClick }) => {
  const { t } = useTranslation();

  const comboRef = useRef<HTMLDivElement>(null);

  const [account, setAccount] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberAccount, setRememberAccount] = useState<boolean>(false);
  const [autoLogin, setAutoLogin] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAccountselectBox, setShowAccountselectBox] = useState<boolean>(false);

  const deleteAccount = (account: string) => {
    ipc.accounts.delete(account);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    if (name === 'account') {
      const match = accounts[value];
      setAccount(value);
      setRememberAccount(match?.rememberAccount ?? false);
      setAutoLogin(match?.autoLogin ?? false);
    } else if (name === 'password') {
      setPassword(value);
    } else if (name === 'autoLogin') {
      setAutoLogin(checked);
      setRememberAccount(checked ? true : rememberAccount);
    } else if (name === 'rememberAccount') {
      if (autoLogin && !checked) {
        setAutoLogin(false);
        setRememberAccount(false);
      }
      setRememberAccount(checked);
    }
  };

  const handleAccountSelectClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setShowAccountselectBox((prev) => !prev);
  };

  const handleForgotPasswordClick = () => {
    window.open('https://ricecall.com/forget', '_blank');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!account || !password) return;

    setIsLoading(true);

    await ipc.auth.login({ account, password }).then((res) => {
      if (res.success) {
        if (rememberAccount) ipc.accounts.add(account, { autoLogin, rememberAccount, password });
        localStorage.setItem('login-account', account);
      }
    });

    setIsLoading(false);
  };

  const handleChangeServerBtnClick = () => {
    onChangeServerBtnClick();
  };

  const handleRegisterBtnClick = () => {
    onRegisterBtnClick();
  };

  useEffect(() => {
    const loginAccount = localStorage.getItem('login-account') || '';
    setAccount(accounts[loginAccount] ? loginAccount : '');
    setPassword(accounts[loginAccount]?.password ?? '');
    setRememberAccount(!!accounts[loginAccount]?.rememberAccount);
    setAutoLogin(!!accounts[loginAccount]?.autoLogin);
  }, [accounts]);

  useEffect(() => {
    const changeAccounts = (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => {
      setAccounts(accounts);
    };
    changeAccounts(ipc.accounts.get());
    const unsub = ipc.accounts.onUpdate(changeAccounts);
    return () => unsub();
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!comboRef.current?.contains(e.target as Node)) setShowAccountselectBox(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <main className={styles['login-page']} style={display ? {} : { display: 'none' }}>
      <main className={styles['login-page-body']}>
        <div className={styles['app-logo']} />
        <form className={styles['login-form-wrapper']} onSubmit={handleSubmit}>
          {isLoading ? (
            <>
              <div className={styles['loading-text']}>{`${t('logining')}...`}</div>
              <div className={styles['loading-bar']} />
            </>
          ) : (
            <>
              <div className={styles['input-wrapper']}>
                <div className={styles['label']}>{t('account')}</div>
                <div className={styles['input-box']} ref={comboRef}>
                  <input type="text" name="account" value={account} onChange={handleInputChange} placeholder={t('please-input-account')} className={styles['input']} />
                  <div className={styles['account-dropdown-arrow']} onClick={handleAccountSelectClick} />
                  <div className={styles['account-options']} style={showAccountselectBox ? {} : { display: 'none' }}>
                    {Object.entries(accounts).map(([account, { autoLogin, rememberAccount, password }]) => (
                      <div
                        key={account}
                        className={styles['account-option']}
                        onClick={() => {
                          setAccount(account);
                          setRememberAccount(rememberAccount);
                          setAutoLogin(autoLogin);
                          setPassword(password);
                          setShowAccountselectBox(false);
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
                  <input type="checkbox" name="rememberAccount" checked={rememberAccount} onChange={handleInputChange} className={styles['check']} tabIndex={-1} />
                  {t('remember-account')}
                </div>
                <div className={styles['check-box']}>
                  <input type="checkbox" name="autoLogin" checked={autoLogin} onChange={handleInputChange} className={styles['check']} tabIndex={-1} />
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
      <div className={styles['login-page-footer']}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className={styles['create-account-button']} onClick={handleRegisterBtnClick}>
            {t('register-account')}
          </div>
          {'/'}
          <div className={styles['change-server-button']} onClick={handleChangeServerBtnClick}>
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
