import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/pages/login.module.css';

// Utils
import { createValidators } from '@/utils/validators';

// Services
import authService from '@/services/auth.service';

// Providers
import { useLanguage } from '@/providers/Language';

interface FormErrors {
  general?: string;
  account?: string;
  password?: string;
}

interface FormDatas {
  account: string;
  password: string;
  rememberAccount: boolean;
  autoLogin: boolean;
}

interface AccountItem {
  account: string;
  token: string;
  auto: boolean;
}

interface LoginPageProps {
  setSection: (section: 'login' | 'register') => void;
}

const LoginPage: React.FC<LoginPageProps> = React.memo(({ setSection }) => {
  // Hooks
  const lang = useLanguage();
  const validators = React.useMemo(() => createValidators(lang), [lang]);

  // States
  const [formData, setFormData] = useState<FormDatas>({
    account: '',
    password: '',
    rememberAccount: false,
    autoLogin: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountSelectBox, setAccountSelectBox] = useState<boolean>(false);
  const [accountList, setAccountList] = useState<AccountItem[]>([]);

  const comboRef = useRef<HTMLDivElement>(null);

  const getParsedAccounts = () => {
    try {
      const raw = localStorage.getItem('login-accounts');
      return raw ? JSON.parse(raw) : { accounts: [], remembered: [] };
    } catch {
      return { accounts: [], remembered: [] };
    }
  };

  useEffect(() => {
    const { accounts } = getParsedAccounts();
    setAccountList(accounts);
    const defaultAcc = accounts.find(
      (a: { selected: string }) => a.selected,
    )?.account;
    const match = accounts.find(
      (a: { account: string }) => a.account === defaultAcc,
    );
    if (match) {
      setFormData((prev) => ({
        ...prev,
        account: defaultAcc,
        rememberAccount: true,
        autoLogin: match.auto || false,
      }));
    }
    const listener = (e: MouseEvent) => {
      if (!comboRef.current?.contains(e.target as Node))
        setAccountSelectBox(false);
    };
    document.addEventListener('click', listener);
    return () => document.removeEventListener('click', listener);
  }, []);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === 'account') {
      const { accounts, remembered } = getParsedAccounts();
      const match = accounts.find(
        (a: { account: string }) => a.account === value,
      );
      setFormData((prev) => ({
        ...prev,
        account: value,
        rememberAccount: remembered.includes(value),
        autoLogin: match?.auto || false,
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

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'account') {
      setErrors((prev) => ({
        ...prev,
        account: validators.validateAccount(value),
      }));
    } else if (name === 'password') {
      setErrors((prev) => ({
        ...prev,
        password: validators.validatePassword(value),
      }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.account || !formData.password) return;
    setIsLoading(true);
    if (await authService.login(formData)) {
      const parsed = getParsedAccounts();
      const idx = parsed.accounts.findIndex(
        (a: { account: string }) => a.account === formData.account,
      );
      const token = localStorage.getItem('token') || '';
      if (formData.rememberAccount) {
        if (idx >= 0) {
          parsed.accounts[idx].token = token;
          parsed.accounts[idx].auto = formData.autoLogin;
        } else {
          parsed.accounts.push({
            account: formData.account,
            token,
            auto: formData.autoLogin,
          });
        }
        if (!parsed.remembered.includes(formData.account))
          parsed.remembered.push(formData.account);
      } else {
        parsed.accounts = parsed.accounts.filter(
          (a: { account: string }) => a.account !== formData.account,
        );
        parsed.remembered = parsed.remembered.filter(
          (a: string) => a !== formData.account,
        );
      }
      localStorage.setItem('login-accounts', JSON.stringify(parsed));
      setAccountList(parsed.accounts);
      setSection('login');
    }
    setIsLoading(false);
  };

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
              {errors.general && (
                <div className={styles['errorBox']}>{errors.general}</div>
              )}
              <div className={styles['inputBox']}>
                <label className={styles['label']}>{lang.tr.account}</label>
                <div className={styles['loginAccountBox']} ref={comboRef}>
                  <input
                    type="text"
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={lang.tr.pleaseInputAccount}
                    className={styles['input']}
                  />
                  <div
                    className={styles['comboArrow']}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAccountSelectBox((prev) => !prev);
                    }}
                  ></div>
                </div>
                <div
                  className={`${styles['accountSelectBox']} ${
                    accountSelectBox ? styles['showAccountSelectBox'] : ''
                  }`}
                >
                  {accountList.map((account) => (
                    <div
                      key={account.account}
                      className={styles['accountSelectOptionBox']}
                      onClick={() => {
                        const parsed = getParsedAccounts();
                        setFormData((prev) => ({
                          ...prev,
                          account: account.account,
                          rememberAccount: parsed.remembered.includes(
                            account.account,
                          ),
                          autoLogin: account.auto,
                        }));
                        setAccountSelectBox(false);
                      }}
                    >
                      {account.account}
                      <div
                        className={styles['accountSelectCloseBtn']}
                        onClick={(e) => {
                          e.stopPropagation();
                          const parsed = getParsedAccounts();
                          parsed.accounts = parsed.accounts.filter(
                            (a: AccountItem) => a.account !== account.account,
                          );
                          parsed.remembered = parsed.remembered.filter(
                            (a: string) => a !== account.account,
                          );
                          localStorage.setItem(
                            'login-accounts',
                            JSON.stringify(parsed),
                          );
                          setAccountList(parsed.accounts);
                          setFormData((prev) => ({
                            ...prev,
                            account:
                              prev.account === account.account
                                ? ''
                                : prev.account,
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles['inputBox']}>
                <label className={styles['label']}>{lang.tr.password}</label>
                <div className={styles['loginAccountBox']}>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={lang.tr.pleaseInputPassword}
                    className={styles['input']}
                  />
                </div>
              </div>
              {errors && (
                <div className={styles['warningMessage']}>
                  {errors.account || errors.password || ''}
                </div>
              )}
              <div className={styles['checkWrapper']}>
                <label className={styles['checkBox']}>
                  <input
                    type="checkbox"
                    name="rememberAccount"
                    checked={formData.rememberAccount}
                    onChange={handleInputChange}
                    className={styles['check']}
                    tabIndex={-1}
                  />
                  {lang.tr.rememberAccount}
                </label>
                <label className={styles['checkBox']}>
                  <input
                    type="checkbox"
                    name="autoLogin"
                    checked={formData.autoLogin}
                    onChange={handleInputChange}
                    className={styles['check']}
                    tabIndex={-1}
                  />
                  {lang.tr.autoLogin}
                </label>
              </div>
              <button
                className={styles['button']}
                onClick={handleSubmit}
                tabIndex={-1}
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
