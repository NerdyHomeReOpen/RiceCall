import React, { useState } from 'react';

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
                <div className={styles['loginAccountBox']}>
                  <input
                    type="text"
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={lang.tr.pleaseInputAccount}
                    className={styles['input']}
                  />
                  <div className={styles['comboArrow']}></div>
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
