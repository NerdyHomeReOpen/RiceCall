import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/pages/login.module.css';

// Services
import authService from '@/services/auth.service';

// Providers
import { useLanguage } from '@/providers/Language';

interface FormDatas {
  account: string;
  password: string;
  rememberAccount: boolean;
  autoLogin: boolean;
}

interface LoginPageProps {
  setSection: (section: 'login' | 'register') => void;
}

const LoginPage: React.FC<LoginPageProps> = React.memo(({ setSection }) => {
  // Hooks
  const lang = useLanguage();

  // Refs
  const comboRef = useRef<HTMLDivElement>(null);
  const rememberAccountRef = useRef<HTMLInputElement>(null);
  const autoLoginRef = useRef<HTMLInputElement>(null);

  // States
  const [formData, setFormData] = useState<FormDatas>({
    account: '',
    password: '',
    rememberAccount: false,
    autoLogin: false,
  });
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAccountSelectBox, setShowAccountSelectBox] =
    useState<boolean>(false);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'account') {
      const match = accounts.find((acc: string) => acc === value);
      setFormData((prev) => ({
        ...prev,
        account: value,
        rememberAccount: !!match,
        autoLogin: !!match,
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
          return prev;
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
    if (await authService.login(formData)) {
      if (formData.rememberAccount && !accounts.includes(formData.account)) {
        setAccounts([...accounts, formData.account]);
        localStorage.setItem('login-account', formData.account);
      }
      setSection('login');
    }
    setIsLoading(false);
  };

  // Effects
  useEffect(() => {
    const loginAccount = localStorage.getItem('login-account');
    setFormData((prev) => ({
      ...prev,
      account: loginAccount || '',
      rememberAccount: !!loginAccount,
      autoLogin: !!loginAccount,
    }));
  }, []);

  useEffect(() => {
    const accounts = localStorage.getItem('accounts')?.split(',') || [];
    setAccounts(accounts);
  }, []);

  useEffect(() => {
    localStorage.setItem('accounts', accounts.join(','));
  }, [accounts]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!comboRef.current?.contains(e.target as Node))
        setShowAccountSelectBox(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles['loginWrapper']}>
      {/* Main Content */}
      <div className={styles['loginContent']}>
        <div className={styles['appLogo']} />
        <form
          className={styles['formWrapper']}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {isLoading && (
            <>
              <div className={styles['loadingIndicator']}>
                {lang.tr.onLogin}
              </div>
              <div className={styles['loadingBar']} />
            </>
          )}
          {!isLoading && (
            <>
              <div className={styles['inputBox']}>
                <div className={styles['label']}>{lang.tr.account}</div>
                <div className={styles['loginAccountBox']} ref={comboRef}>
                  <input
                    type="text"
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    onBlur={() => {}}
                    placeholder={lang.tr.pleaseInputAccount}
                    className={styles['input']}
                  />
                  <div
                    className={styles['comboArrow']}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAccountSelectBox((prev) => !prev);
                    }}
                  />
                  <div
                    className={styles['accountSelectBox']}
                    style={showAccountSelectBox ? {} : { display: 'none' }}
                  >
                    {accounts.map((account) => (
                      <div
                        key={account}
                        className={styles['accountSelectOptionBox']}
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            account: account,
                            rememberAccount: true,
                            autoLogin: true,
                          }));
                          setShowAccountSelectBox(false);
                        }}
                      >
                        {account}
                        <div
                          className={styles['accountSelectCloseBtn']}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccounts(accounts.filter((a) => a !== account));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className={styles['inputBox']}>
                <div className={styles['label']}>{lang.tr.password}</div>
                <div className={styles['loginAccountBox']}>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={() => {}}
                    placeholder={lang.tr.pleaseInputPassword}
                    className={styles['input']}
                  />
                </div>
              </div>
              <div className={styles['checkWrapper']}>
                <div className={styles['checkBox']}>
                  <input
                    ref={rememberAccountRef}
                    type="checkbox"
                    name="rememberAccount"
                    checked={formData.rememberAccount}
                    onChange={handleInputChange}
                    className={styles['check']}
                    tabIndex={-1}
                  />
                  {lang.tr.rememberAccount}
                </div>
                <div className={styles['checkBox']}>
                  <input
                    ref={autoLoginRef}
                    type="checkbox"
                    name="autoLogin"
                    checked={formData.autoLogin}
                    onChange={handleInputChange}
                    className={styles['check']}
                    tabIndex={-1}
                  />
                  {lang.tr.autoLogin}
                </div>
              </div>
              <button
                className={styles['button']}
                onClick={handleSubmit}
                tabIndex={-1}
                disabled={!formData.account || !formData.password}
              >
                {lang.tr.login}
              </button>
            </>
          )}
        </form>
      </div>
      {/* Footer */}
      <div className={styles['loginFooter']}>
        <div
          className={styles['createAccount']}
          onClick={() => {
            setSection('register');
          }}
        >
          {lang.tr.registerAccount}
        </div>
        <div className={styles['forgetPassword']}>{lang.tr.forgotPassword}</div>
      </div>
    </div>
  );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
