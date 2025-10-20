import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/login.module.css';

// Services
import auth from '@/services/auth.service';
import ipc from '@/services/ipc.service';

// Providers
import { useTranslation } from 'react-i18next';

interface FormDatas {
  account: string;
  password: string;
  rememberAccount: boolean;
  autoLogin: boolean;
}

interface LoginPageProps {
  display: boolean;
  setSection: (section: 'login' | 'register') => void;
}

const LoginPage: React.FC<LoginPageProps> = React.memo(({ display, setSection }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const comboRef = useRef<HTMLDivElement>(null);

  // States
  const [formData, setFormData] = useState<FormDatas>({
    account: '',
    password: '',
    rememberAccount: false,
    autoLogin: false,
  });
  const [accounts, setAccounts] = useState<Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAccountselectBox, setShowAccountselectBox] = useState<boolean>(false);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'account') {
      const match = accounts[value];
      setFormData((prev) => ({
        ...prev,
        account: value,
        rememberAccount: match?.rememberAccount ?? false,
        autoLogin: match?.autoLogin ?? false,
      }));
    } else if (name === 'autoLogin') {
      setFormData((prev) => ({
        ...prev,
        autoLogin: checked,
        rememberAccount: checked ? true : prev.rememberAccount,
      }));
    } else if (name === 'rememberAccount') {
      setFormData((prev) => {
        if (prev.autoLogin && !checked) {
          return {
            ...prev,
            autoLogin: false,
            rememberAccount: false,
          };
        }
        return {
          ...prev,
          rememberAccount: checked,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.account || !formData.password) return;
    setIsLoading(true);
    if (await auth.login(formData)) {
      localStorage.setItem('login-account', formData.account);
      setSection('login');
    }
    setIsLoading(false);
  };

  const handleDeleteAccount = (account: string) => {
    ipc.accounts.delete(account);
  };

  // Effects
  useEffect(() => {
    const loginAccount = localStorage.getItem('login-account') || '';
    setFormData((prev) => ({
      ...prev,
      account: accounts[loginAccount] ? loginAccount : '',
      password: accounts[loginAccount]?.password ?? '',
      rememberAccount: !!accounts[loginAccount]?.rememberAccount,
      autoLogin: !!accounts[loginAccount]?.autoLogin,
    }));
  }, [accounts]);

  useEffect(() => {
    const changeAccounts = (accounts: Record<string, { autoLogin: boolean; rememberAccount: boolean; password: string }>) => {
      setAccounts(accounts);
    };
    changeAccounts(ipc.accounts.get());
    const unsubscribe = [ipc.accounts.onUpdate(changeAccounts)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!comboRef.current?.contains(e.target as Node)) setShowAccountselectBox(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <main className={styles['login']} style={display ? {} : { display: 'none' }}>
      {/* Body */}
      <main className={styles['login-body']}>
        <div className={styles['app-logo']} />
        <form
          className={styles['form-wrapper']}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {isLoading && (
            <>
              <div className={styles['loading-indicator']}>{`${t('logining')}...`}</div>
              <div className={styles['loading-bar']} />
            </>
          )}
          {!isLoading && (
            <>
              <div className={styles['input-wrapper']}>
                <div className={styles['label']}>{t('account')}</div>
                <div className={styles['input-box']} ref={comboRef}>
                  <input type="text" name="account" value={formData.account} onChange={handleInputChange} placeholder={t('please-input-account')} className={styles['input']} />
                  <div
                    className={styles['combo-arrow']}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAccountselectBox((prev) => !prev);
                    }}
                  />
                  <div className={styles['account-select-box']} style={showAccountselectBox ? {} : { display: 'none' }}>
                    {Object.entries(accounts).map(([account, { autoLogin, rememberAccount, password }]) => (
                      <div
                        key={account}
                        className={styles['account-select-option-box']}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            account: account,
                            rememberAccount: rememberAccount,
                            autoLogin: autoLogin,
                            password: password,
                          }));
                          setShowAccountselectBox(false);
                        }}
                      >
                        {account}
                        <div
                          className={styles['account-select-delete-btn']}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAccount(account);
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
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={t('please-input-password')} className={styles['input']} />
                </div>
              </div>
              <div className={styles['check-wrapper']}>
                <div className={styles['check-box']}>
                  <input type="checkbox" name="rememberAccount" checked={formData.rememberAccount} onChange={handleInputChange} className={styles['check']} tabIndex={-1} />
                  {t('remember-account')}
                </div>
                <div className={styles['check-box']}>
                  <input type="checkbox" name="autoLogin" checked={formData.autoLogin} onChange={handleInputChange} className={styles['check']} tabIndex={-1} />
                  {t('auto-login')}
                </div>
              </div>
              <button className={styles['submit-button']} onClick={handleSubmit} tabIndex={-1} disabled={!formData.account || !formData.password}>
                {t('login')}
              </button>
            </>
          )}
        </form>
      </main>

      {/* Footer */}
      <div className={styles['login-footer']}>
        <div className={styles['create-account']} onClick={() => setSection('register')}>
          {t('register-account')}
        </div>
        <div
          className={styles['forget-password']}
          onClick={() => {
            /*TODO: handleForgotPassword() */
          }}
        >
          {t('forgot-password')}
        </div>
      </div>
    </main>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
