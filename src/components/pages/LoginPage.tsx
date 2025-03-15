import React, { ChangeEvent, FocusEvent, FormEvent, useState } from 'react';

// CSS
import styles from '@/styles/loginPage.module.css';

// Utils
import { validateAccount, validatePassword } from '@/utils/validators';

// Services
import { authService } from '@/services/auth.service';

// Components
import InputField from '@/components/InputField';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';

interface FormErrors {
  general?: string;
  account?: string;
  password?: string;
}

// Login Form Component
interface LoginPageData {
  account: string;
  password: string;
  rememberAccount: boolean;
  autoLogin: boolean;
}

interface LoginPageProps {
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
}

const LoginPage: React.FC<LoginPageProps> = React.memo(
  ({ onLoginSuccess, onRegisterClick }) => {
    // Language
    const lang = useLanguage();

    // Form Control
    const [formData, setFormData] = useState<LoginPageData>({
      account: '',
      password: '',
      rememberAccount: false,
      autoLogin: false,
    });

    // Error Control
    const [errors, setErrors] = useState<FormErrors>({});

    // Loading Control
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Handlers
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
      const { name, value, type, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>): void => {
      const { name, value } = e.target;
      if (name === 'account') {
        setErrors((prev) => ({
          ...prev,
          account: validateAccount(value),
        }));
      } else if (name === 'password') {
        setErrors((prev) => ({
          ...prev,
          password: validatePassword(value),
        }));
      }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        if (await authService.login(formData)) onLoginSuccess();
      } catch (error) {
        setErrors({
          general:
            error instanceof Error ? error.message : lang.tr.unknownError,
        });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className={styles['loginWrapper']}>
        {/* Main Content */}
        <div className={styles['loginContent']}>
          <div className={styles['appLogo']}></div>
          <form onSubmit={handleSubmit} className={styles['formWrapper']}>
            {errors.general && (
              <div className={styles['errorBox']}>{errors.general}</div>
            )}
            {isLoading && (
              <div className={styles['loadingIndicator']}>
                {lang.tr.onLogin}
              </div>
            )}
            <div className={styles['inputBox']}>
              <label className={styles['label']}>{lang.tr.account}</label>
              <InputField
                type="text"
                name="account"
                value={formData.account}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={lang.tr.pleaseInputAccount}
                showFunctionButton={'account'}
                style={{
                  borderColor: errors.account ? '#f87171' : '#d1d5db',
                }}
              />
            </div>
            <div className={styles['inputBox']}>
              <label className={styles['label']}>{lang.tr.password}</label>
              <InputField
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={lang.tr.pleaseInputPassword}
                showFunctionButton={'password'}
                style={{
                  borderColor: errors.password ? '#f87171' : '#d1d5db',
                }}
              />
            </div>
            <div className={styles['checkWrapper']}>
              <label className={styles['checkBox']}>
                <input
                  type="checkbox"
                  name="rememberAccount"
                  checked={formData.rememberAccount}
                  onChange={handleInputChange}
                  className={styles['check']}
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
                />
                {lang.tr.autoLogin}
              </label>
            </div>
            <button type="submit" className={styles['button']}>
              {lang.tr.login}
            </button>
          </form>
        </div>
        {/* Footer */}
        <div className={styles['loginFooter']}>
          <div className={styles['createAccount']} onClick={onRegisterClick}>
            {lang.tr.registerAccount}
          </div>
          <div className={styles['forgetPassword']}>
            {lang.tr.forgotPassword}
          </div>
        </div>
      </div>
    );
  },
);

LoginPage.displayName = 'LoginPage';

export default LoginPage;
