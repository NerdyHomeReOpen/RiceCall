import React, { useEffect, useRef, useState } from 'react';

// CSS
import styles from '@/styles/loginPage.module.css';

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
  const [accountList, setAccountList] = useState<string[]>();

  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = localStorage.getItem('login-accounts');
    if (existing) {
      setAccountList(existing.split(','));
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setAccountSelectBox(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
      const key = 'login-accounts';
      const existing = localStorage.getItem(key);
      const list = existing ? existing.split(',') : [];
      if (!list.includes(formData.account)) {
        list.push(formData.account);
      }
      if (formData.rememberAccount) {
        localStorage.setItem(key, list.join(','));
        setAccountList(list);
      }
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
                  {accountList?.map((account) => (
                    <div
                      key={account}
                      className={styles['accountSelectOptionBox']}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, account }));
                        setAccountSelectBox(false);
                      }}
                    >
                      {account}
                      <div
                        className={styles['accountSelectCloseBtn']}
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = accountList.filter(
                            (a) => a !== account,
                          );
                          localStorage.setItem(
                            'login-accounts',
                            updated.join(','),
                          );
                          setAccountList(updated);
                          setFormData((prev) => ({
                            ...prev,
                            account:
                              prev.account === account ? '' : prev.account,
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
