import dynamic from 'next/dynamic';
import React, { useState } from 'react';

// Types
import type { TFunction } from 'i18next';

// CSS
import styles from '@/styles/register.module.css';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog } from '@/utils/popup';

interface FormErrors {
  general?: string;
  account?: string;
  password?: string;
  confirmPassword?: string;
  email?: string;
  username?: string;
}

interface FormDatas {
  account: string;
  password: string;
  email: string;
  username: string;
}

function validateAccount(value: string, t: TFunction): string {
  value = value.trim();
  if (!value) return t('account-required');
  if (value.length < 4) return t('account-min-length');
  if (value.length > 16) return t('account-max-length');
  if (!/^[A-Za-z0-9_\.]+$/.test(value)) return t('account-invalid-format');
  return '';
}

function validatePassword(value: string, t: TFunction): string {
  value = value.trim();
  if (!value) return t('password-required');
  if (value.length < 8) return t('password-min-length');
  if (value.length > 20) return t('password-max-length');
  if (!/^[A-Za-z0-9@$!%*#?&]{8,20}$/.test(value)) return t('password-invalid-format');
  return '';
}

function validateConfirmPassword(value: string, check: string, t: TFunction): string {
  if (value !== check) return t('passwords-do-not-match');
  return '';
}

function validateEmail(value: string, t: TFunction): string {
  if (!value) return t('email-required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('email-invalid-format');
  return '';
}

function validateUsername(value: string, t: TFunction): string {
  value = value.trim();
  if (!value) return t('username-required');
  if (value.length < 1) return t('username-min-length');
  if (value.length > 32) return t('username-max-length');
  if (!/^[A-Za-z0-9\u4e00-\u9fa5]+$/.test(value)) return t('username-invalid-format');
  return '';
}

interface RegisterPageProps {
  display: boolean;
  setSection: (section: 'login' | 'register') => void;
}

const RegisterPageComponent: React.FC<RegisterPageProps> = React.memo(({ display, setSection }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [formData, setFormData] = useState<FormDatas>({
    account: '',
    password: '',
    username: '',
    email: '',
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
        account: validateAccount(value, t),
      }));
    } else if (name === 'password') {
      setFormData((prev) => ({
        ...prev,
        password: value,
      }));
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value, t),
      }));
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value, formData.password, t),
      }));
    } else if (name === 'email') {
      setFormData((prev) => ({
        ...prev,
        email: value,
      }));
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(value, t),
      }));
    } else if (name === 'username') {
      setFormData((prev) => ({
        ...prev,
        username: value,
      }));
      setErrors((prev) => ({
        ...prev,
        username: validateUsername(value, t),
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'account') {
      setErrors((prev) => ({
        ...prev,
        account: validateAccount(value, t),
      }));
    } else if (name === 'password') {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value, t),
      }));
    } else if (name === 'confirmPassword') {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value, formData.password, t),
      }));
    } else if (name === 'username') {
      setErrors((prev) => ({
        ...prev,
        username: validateUsername(value, t),
      }));
    } else if (name === 'email') {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(value, t),
      }));
    }
  };

  const handleSubmit = async () => {
    const validationErrors: FormErrors = {};
    if (!formData.account.trim()) {
      validationErrors.account = t('please-input-account');
    }
    if (!formData.password.trim()) {
      validationErrors.password = t('please-input-password');
    }
    if (!formData.username.trim()) {
      validationErrors.username = t('please-input-nickname');
    }
    if (!confirmPassword.trim()) {
      validationErrors.confirmPassword = t('please-input-password-again');
    }
    if (!formData.email.trim()) {
      validationErrors.email = t('please-input-email');
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({
        ...prev,
        ...validationErrors,
        general: t('please-input-all-required'),
      }));
      return;
    }

    setIsLoading(true);

    const res = await ipc.auth.register(formData.account, formData.password, formData.username);
    if (res.success) {
      handleOpenAlertDialog(t(res.message, { '0': formData.email }), () => {
        setSection('login');
      });
    }

    setIsLoading(false);
  };

  return (
    <main className={styles['register']} style={display ? {} : { display: 'none' }}>
      {/* Body */}
      <main className={styles['register-body']}>
        <div className={styles['app-logo']} />
        <div className={styles['form-wrapper']}>
          {isLoading && (
            <>
              <div className={styles['loading-indicator']}>{`${t('registering')}...`}</div>
              <div className={styles['loading-bar']} />
            </>
          )}
          {!isLoading && (
            <>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('account')}</div>
                  <input
                    type="text"
                    name="account"
                    value={formData.account}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-account')}
                    className={styles['input']}
                    style={errors.account ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {errors.account ? <div className={styles['warn-text']}>{errors.account}</div> : <div className={styles['hint-text']}>{t('account-hint')}</div>}
              </div>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('password')}</div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-password')}
                    className={styles['input']}
                    style={errors.password ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {errors.password ? <div className={styles['warn-text']}>{errors.password}</div> : <div className={styles['hint-text']}>{t('password-hint')}</div>}
              </div>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('confirm-password')}</div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-password-again')}
                    className={styles['input']}
                    style={errors.confirmPassword ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {errors.confirmPassword ? <div className={styles['warn-text']}>{errors.confirmPassword}</div> : <div className={styles['hint-text']}>{t('repeat-password-hint')}</div>}
              </div>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('email')}</div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-email')}
                    className={styles['input']}
                    style={errors.email ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {errors.email ? <div className={styles['warn-text']}>{errors.email}</div> : <div className={styles['hint-text']}>{t('email-hint')}</div>}
              </div>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('nickname')}</div>
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-nickname')}
                    className={styles['input']}
                    style={errors.username ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {errors.username ? <div className={styles['warn-text']}>{errors.username}</div> : <div className={styles['hint-text']}>{t('nickname-hint')}</div>}
              </div>
              <button
                className={styles['submit-button']}
                onClick={handleSubmit}
                disabled={
                  !formData.account.trim() ||
                  !formData.password.trim() ||
                  !formData.username.trim() ||
                  !formData.email.trim() ||
                  !confirmPassword.trim() ||
                  !!errors.account ||
                  !!errors.password ||
                  !!errors.confirmPassword ||
                  !!errors.username ||
                  !!errors.email
                }
              >
                {t('register')}
              </button>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <div className={styles['register-footer']}>
        <div className={styles['back-to-login']} onClick={() => setSection('login')}>
          {t('back-to-login')}
        </div>
      </div>
    </main>
  );
});

RegisterPageComponent.displayName = 'RegisterPageComponent';

const RegisterPage = dynamic(() => Promise.resolve(RegisterPageComponent), { ssr: false });

export default RegisterPage;
