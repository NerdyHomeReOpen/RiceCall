import React, { useState } from 'react';

// Types
import { Translation } from '@/types';

// CSS
import styles from '@/styles/pages/register.module.css';

// Services
import authService from '@/services/auth.service';

// Providers
import { useLanguage } from '@/providers/Language';

interface FormErrors {
  general?: string;
  account?: string;
  password?: string;
  username?: string;
  confirmPassword?: string;
}

interface FormDatas {
  account: string;
  password: string;
  username: string;
}

function validateAccount(value: string, lang: { tr: Translation }): string {
  value = value.trim();
  if (!value) return lang.tr.accountRequired;
  if (value.length < 4) return lang.tr.accountMinLength;
  if (value.length > 16) return lang.tr.accountMaxLength;
  if (!/^[A-Za-z0-9_\.]+$/.test(value)) return lang.tr.accountInvalidFormat;
  return '';
}

function validatePassword(value: string, lang: { tr: Translation }): string {
  value = value.trim();
  if (!value) return lang.tr.passwordRequired;
  if (value.length < 8) return lang.tr.passwordMinLength;
  if (value.length > 20) return lang.tr.passwordMaxLength;
  if (!/^[A-Za-z0-9@$!%*#?&]{8,20}$/.test(value))
    return lang.tr.passwordInvalidFormat;
  return '';
}

function validateUsername(value: string, lang: { tr: Translation }): string {
  value = value.trim();
  if (!value) return lang.tr.usernameRequired;
  if (value.length < 2) return lang.tr.usernameMinLength;
  if (value.length > 32) return lang.tr.usernameMaxLength;
  if (!/^[A-Za-z0-9\u4e00-\u9fa5]+$/.test(value))
    return lang.tr.usernameInvalidFormat;
  return '';
}

function validateCheckPassword(
  value: string,
  check: string,
  lang: { tr: Translation },
): string {
  if (value !== check) return lang.tr.passwordsDoNotMatch;
  return '';
}

interface RegisterPageProps {
  setSection: (section: 'login' | 'register') => void;
}

const RegisterPage: React.FC<RegisterPageProps> = React.memo(
  ({ setSection }) => {
    // Hooks
    const lang = useLanguage();

    // States
    const [formData, setFormData] = useState<FormDatas>({
      account: '',
      password: '',
      username: '',
    });
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'account') {
        setFormData((prev) => ({
          ...prev,
          account: value,
        }));
        setErrors((prev) => ({
          ...prev,
          account: validateAccount(value, lang),
        }));
      } else if (name === 'password') {
        setFormData((prev) => ({
          ...prev,
          password: value,
        }));
        setErrors((prev) => ({
          ...prev,
          password: validatePassword(value, lang),
        }));
      } else if (name === 'confirmPassword') {
        setConfirmPassword(value);
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateCheckPassword(
            value,
            formData.password,
            lang,
          ),
        }));
      } else if (name === 'username') {
        setFormData((prev) => ({
          ...prev,
          username: value,
        }));
        setErrors((prev) => ({
          ...prev,
          username: validateUsername(value, lang),
        }));
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'account') {
        setErrors((prev) => ({
          ...prev,
          account: validateAccount(value, lang),
        }));
      } else if (name === 'password') {
        setErrors((prev) => ({
          ...prev,
          password: validatePassword(value, lang),
        }));
      } else if (name === 'confirmPassword') {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateCheckPassword(
            value,
            formData.password,
            lang,
          ),
        }));
      } else if (name === 'username') {
        setErrors((prev) => ({
          ...prev,
          username: validateUsername(value, lang),
        }));
      }
    };

    const handleSubmit = async () => {
      const validationErrors: FormErrors = {};
      if (!formData.account.trim()) {
        validationErrors.account = lang.tr.pleaseInputAccount;
      }
      if (!formData.password.trim()) {
        validationErrors.password = lang.tr.pleaseInputPassword;
      }
      if (!formData.username.trim()) {
        validationErrors.username = lang.tr.pleaseInputNickname;
      }
      if (!confirmPassword.trim()) {
        validationErrors.confirmPassword = lang.tr.pleaseInputPasswordAgain;
      }
      if (Object.keys(validationErrors).length > 0) {
        setErrors((prev) => ({
          ...prev,
          ...validationErrors,
          general: lang.tr.pleaseInputAllRequired,
        }));
        return;
      }
      setIsLoading(true);
      if (await authService.register(formData)) setSection('login');
      setIsLoading(false);
    };

    return (
      <div className={styles['loginWrapper']}>
        <div className={styles['loginContent']}>
          <div className={styles['appLogo']} />
          <div className={styles['formWrapper']}>
            {isLoading && (
              <>
                <div className={styles['loadingIndicator']}>
                  {lang.tr.registering}
                </div>
                <div className={styles['loadingBar']} />
              </>
            )}
            {!isLoading && (
              <>
                <div className={styles['inputWrapper']}>
                  <div className={styles['inputBox']}>
                    <div className={styles['label']}>{lang.tr.account}</div>
                    <input
                      type="text"
                      name="account"
                      value={formData.account}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder={lang.tr.pleaseInputAccount}
                      className={styles['input']}
                      style={{
                        borderColor: errors.account ? '#f87171' : '#d1d5db',
                      }}
                    />
                  </div>
                  {errors.account ? (
                    <div className={styles['warning']}>{errors.account}</div>
                  ) : (
                    <div className={styles['hint']}>
                      {lang.tr.accountCannotChange}
                    </div>
                  )}
                </div>
                <div className={styles['inputWrapper']}>
                  <div className={styles['inputBox']}>
                    <div className={styles['label']}>{lang.tr.password}</div>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder={lang.tr.pleaseInputPassword}
                      className={styles['input']}
                      style={{
                        borderColor: errors.password ? '#f87171' : '#d1d5db',
                      }}
                    />
                  </div>
                  {errors.password ? (
                    <div className={styles['warning']}>{errors.password}</div>
                  ) : (
                    <div className={styles['hint']}>{lang.tr.passwordHint}</div>
                  )}
                </div>
                <div className={styles['inputWrapper']}>
                  <div className={styles['inputBox']}>
                    <div className={styles['label']}>
                      {lang.tr.confirmPassword}
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder={lang.tr.pleaseInputPasswordAgain}
                      className={styles['input']}
                      style={{
                        borderColor: errors.confirmPassword
                          ? '#f87171'
                          : '#d1d5db',
                      }}
                    />
                  </div>
                  {errors.confirmPassword ? (
                    <div className={styles['warning']}>
                      {errors.confirmPassword}
                    </div>
                  ) : (
                    <div className={styles['hint']}>
                      {lang.tr.repeatInputPassword}
                    </div>
                  )}
                </div>
                <div className={styles['inputWrapper']}>
                  <div className={styles['inputBox']}>
                    <div className={styles['label']}>{lang.tr.nickname}</div>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder={lang.tr.pleaseInputNickname}
                      className={styles['input']}
                      style={{
                        borderColor: errors.username ? '#f87171' : '#d1d5db',
                      }}
                    />
                  </div>
                  {errors.username ? (
                    <div className={styles['warning']}>{errors.username}</div>
                  ) : (
                    <div className={styles['hint']}>{lang.tr.nicknameHint}</div>
                  )}
                </div>
                <button
                  className={styles['button']}
                  onClick={handleSubmit}
                  disabled={
                    !formData.account.trim() ||
                    !formData.password.trim() ||
                    !formData.username.trim() ||
                    !confirmPassword.trim() ||
                    !!errors.account ||
                    !!errors.password ||
                    !!errors.confirmPassword ||
                    !!errors.username
                  }
                >
                  {lang.tr.register}
                </button>
              </>
            )}
          </div>
        </div>
        <div className={styles['loginFooter']}>
          <div
            className={styles['backToLogin']}
            onClick={() => setSection('login')}
          >
            {lang.tr.backToLogin}
          </div>
        </div>
      </div>
    );
  },
);

RegisterPage.displayName = 'RegisterPage';

export default RegisterPage;
