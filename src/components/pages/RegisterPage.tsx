/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { ChangeEvent, FocusEvent, FormEvent, useState } from 'react';

// CSS
import styles from '@/styles/registerPage.module.css';

// Utils
import {
  validateAccount,
  validateCheckPassword,
  validatePassword,
  validateUsername,
} from '@/utils/validators';

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
  confirmPassword?: string;
  username?: string;
}

interface RegisterPageData {
  account: string;
  password: string;
  confirmPassword: string;
  username: string;
  gender: 'Male' | 'Female';
}

interface RegisterPageProps {
  onRegisterSuccess: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = React.memo(
  ({ onRegisterSuccess }) => {
    // Language
    const lang = useLanguage();

    // Form Control
    const [formData, setFormData] = useState<RegisterPageData>({
      account: '',
      password: '',
      confirmPassword: '',
      username: '',
      gender: 'Male',
    });

    // Error Control
    const [errors, setErrors] = useState<FormErrors>({});

    // Loading Control
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleInputChange = (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ): void => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleBlur = (
      e: FocusEvent<HTMLInputElement | HTMLSelectElement>,
    ): void => {
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
      } else if (name === 'confirmPassword') {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateCheckPassword(value, formData.password),
        }));
      } else if (name === 'username') {
        setErrors((prev) => ({
          ...prev,
          username: validateUsername(value),
        }));
      }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        if (errors.account) return;
        if (errors.password) return;
        if (errors.confirmPassword) return;
        if (errors.username) return;
        if (await authService.register(formData)) onRegisterSuccess();
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
        <div className={styles['loginContent']}>
          <div className={styles['appLogo']}></div>
          <form onSubmit={handleSubmit} className={styles['formWrapper']}>
            {errors.general && (
              <div className={styles['errorBox']}>{errors.general}</div>
            )}
            <div className={styles['inputWrapper']}>
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
              {errors.account ? (
                <p className={styles['warning']}>{errors.account}</p>
              ) : (
                <p className={styles['hint']}></p>
              )}
            </div>
            <div className={styles['inputWrapper']}>
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
              {errors.password ? (
                <p className={styles['warning']}>{errors.password}</p>
              ) : (
                <p className={styles['hint']}>{lang.tr.passwordHint}</p>
              )}
            </div>
            <div className={styles['inputWrapper']}>
              <div className={styles['inputBox']}>
                <label className={styles['label']}>
                  {lang.tr.confirmPassword}
                </label>
                <InputField
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder={lang.tr.pleaseInputPasswordAgain}
                  showFunctionButton={'password'}
                  style={{
                    borderColor: errors.confirmPassword ? '#f87171' : '#d1d5db',
                  }}
                />
              </div>
              {errors.confirmPassword ? (
                <p className={styles['warning']}>{errors.confirmPassword}</p>
              ) : (
                <p className={styles['hint']}>{lang.tr.repeatInputPassword}</p>
              )}
            </div>
            <div className={styles['inputWrapper']}>
              <div className={styles['inputBox']}>
                <label className={styles['label']}>{lang.tr.nickname}</label>
                <InputField
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  placeholder={lang.tr.pleaseInputNickname}
                  showFunctionButton={'username'}
                  style={{
                    borderColor: errors.username ? '#f87171' : '#d1d5db',
                  }}
                />
              </div>
              {errors.username ? (
                <p className={styles['warning']}>{errors.username}</p>
              ) : (
                <p className={styles['hint']}>{lang.tr.nicknameHint}</p>
              )}
            </div>
            <button type="submit" className={styles['button']}>
              {lang.tr.register}
            </button>
          </form>
        </div>
      </div>
    );
  },
);

RegisterPage.displayName = 'RegisterPage';

export default RegisterPage;
