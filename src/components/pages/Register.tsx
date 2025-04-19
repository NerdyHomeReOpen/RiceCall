import React, { useState } from 'react';

// CSS
import styles from '@/styles/pages/register.module.css';

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
  confirmPassword?: string;
  username?: string;
}

interface FormDatas {
  account: string;
  password: string;
  confirmPassword: string;
  username: string;
  gender: 'Male' | 'Female';
}

interface RegisterPageProps {
  setSection: (section: 'login' | 'register') => void;
}

const RegisterPage: React.FC<RegisterPageProps> = React.memo(
  ({ setSection }) => {
    // Hooks
    const lang = useLanguage();
    const validators = React.useMemo(() => createValidators(lang), [lang]);

    // States
    const [formData, setFormData] = useState<FormDatas>({
      account: '',
      password: '',
      confirmPassword: '',
      username: '',
      gender: 'Male',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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
      } else if (name === 'confirmPassword') {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validators.validateCheckPassword(
            value,
            formData.password,
          ),
        }));
      } else if (name === 'username') {
        setErrors((prev) => ({
          ...prev,
          username: validators.validateUsername(value),
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
      if (!formData.confirmPassword.trim()) {
        validationErrors.confirmPassword = lang.tr.pleaseInputPasswordAgain;
      }
      if (!formData.username.trim()) {
        validationErrors.username = lang.tr.pleaseInputNickname;
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
                <div className={styles['loadingIndicator']}>{'註冊中'}</div>
                <div className={styles['loadingBar']} />
              </>
            )}
            {!isLoading && (
              <>
                <div className={styles['inputWrapper']}>
                  {errors.general && (
                    <div className={styles['errorBox']}>{errors.general}</div>
                  )}
                  <div className={styles['inputBox']}>
                    <label className={styles['label']}>{lang.tr.account}</label>
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
                    <label className={styles['label']}>
                      {lang.tr.password}
                    </label>
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
                    <label className={styles['label']}>
                      {lang.tr.confirmPassword}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
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
                    <label className={styles['label']}>
                      {lang.tr.nickname}
                    </label>
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
                <button className={styles['button']} onClick={handleSubmit}>
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
