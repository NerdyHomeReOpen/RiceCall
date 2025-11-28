import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import i18n from '@/i18n';

// CSS
import styles from '@/styles/register.module.css';

// Providers
import { useTranslation } from 'react-i18next';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog } from '@/utils/popup';

interface RegisterPageProps {
  display: boolean;
  setSection: (section: 'login' | 'register') => void;
}

const RegisterPageComponent: React.FC<RegisterPageProps> = React.memo(({ display, setSection }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [account, setAccount] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [accountError, setAccountError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Handlers
  function validateAccount(value: string): string {
    value = value.trim();
    if (!value) return t('account-required');
    if (value.length < 4) return t('account-min-length');
    if (value.length > 16) return t('account-max-length');
    if (!/^[A-Za-z0-9_\.]+$/.test(value)) return t('account-invalid-format');
    return '';
  }

  function validatePassword(value: string): string {
    value = value.trim();
    if (!value) return t('password-required');
    if (value.length < 8) return t('password-min-length');
    if (value.length > 20) return t('password-max-length');
    if (!/^[A-Za-z0-9@$!%*#?&]{8,20}$/.test(value)) return t('password-invalid-format');
    return '';
  }

  function validateConfirmPassword(value: string, check: string): string {
    if (value !== check) return t('passwords-do-not-match');
    return '';
  }

  function validateEmail(value: string): string {
    if (!value) return t('email-required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('email-invalid-format');
    return '';
  }

  function validateUsername(value: string): string {
    value = value.trim();
    if (!value) return t('username-required');
    if (value.length < 1) return t('username-min-length');
    if (value.length > 32) return t('username-max-length');
    if (!/^[A-Za-z0-9\u4e00-\u9fa5]+$/.test(value)) return t('username-invalid-format');
    return '';
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'account') {
      setAccount(value);
      setAccountError(validateAccount(value));
    } else if (name === 'password') {
      setPassword(value);
      setPasswordError(validatePassword(value));
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
      setConfirmPasswordError(validateConfirmPassword(value, password));
    } else if (name === 'email') {
      setEmail(value);
      setEmailError(validateEmail(value));
    } else if (name === 'username') {
      setUsername(value);
      setUsernameError(validateUsername(value));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'account') {
      setAccountError(validateAccount(value));
    } else if (name === 'password') {
      setPasswordError(validatePassword(value));
    } else if (name === 'confirmPassword') {
      setConfirmPasswordError(validateConfirmPassword(value, password));
    } else if (name === 'username') {
      setUsernameError(validateUsername(value));
    } else if (name === 'email') {
      setEmailError(validateEmail(value));
    }
  };

  const handleSubmit = async () => {
    if (!account.trim()) {
      setAccountError(t('please-input-account'));
    }
    if (!password.trim()) {
      setPasswordError(t('please-input-password'));
    }
    if (!username.trim()) {
      setUsernameError(t('please-input-nickname'));
    }
    if (!confirmPassword.trim()) {
      setConfirmPasswordError(t('please-input-password-again'));
    }
    if (!email.trim()) {
      setEmailError(t('please-input-email'));
    }

    setIsLoading(true);

    await ipc.auth.register({ account, password, email, username, locale: i18n.language ?? 'zh-TW' }).then((res) => {
      if (res.success) {
        handleOpenAlertDialog(t(res.message, { '0': email }), () => setSection('login'));
      }
    });

    setIsLoading(false);
  };

  return (
    <main className={styles['register']} style={display ? {} : { display: 'none' }}>
      {/* Body */}
      <main className={styles['register-body']}>
        <div className={styles['app-logo']} />
        <div className={styles['form-wrapper']}>
          {isLoading ? (
            <>
              <div className={styles['loading-indicator']}>{`${t('registering')}...`}</div>
              <div className={styles['loading-bar']} />
            </>
          ) : (
            <>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('account')}</div>
                  <input
                    type="text"
                    name="account"
                    value={account}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-account')}
                    className={styles['input']}
                    style={accountError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {accountError ? <div className={styles['warn-text']}>{accountError}</div> : <div className={styles['hint-text']}>{t('account-hint')}</div>}
              </div>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('password')}</div>
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-password')}
                    className={styles['input']}
                    style={passwordError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {passwordError ? <div className={styles['warn-text']}>{passwordError}</div> : <div className={styles['hint-text']}>{t('password-hint')}</div>}
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
                    style={confirmPasswordError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {confirmPasswordError ? <div className={styles['warn-text']}>{confirmPasswordError}</div> : <div className={styles['hint-text']}>{t('repeat-password-hint')}</div>}
              </div>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('email')}</div>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-email')}
                    className={styles['input']}
                    style={emailError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {emailError ? <div className={styles['warn-text']}>{emailError}</div> : <div className={styles['hint-text']}>{t('email-hint')}</div>}
              </div>
              <div className={styles['input-wrapper']}>
                <div className={styles['input-box']}>
                  <div className={styles['label']}>{t('nickname')}</div>
                  <input
                    name="username"
                    value={username}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={t('please-input-nickname')}
                    className={styles['input']}
                    style={usernameError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {usernameError ? <div className={styles['warn-text']}>{usernameError}</div> : <div className={styles['hint-text']}>{t('nickname-hint')}</div>}
              </div>
              <button
                className={styles['submit-button']}
                onClick={handleSubmit}
                disabled={
                  !account.trim() ||
                  !password.trim() ||
                  !username.trim() ||
                  !email.trim() ||
                  !confirmPassword.trim() ||
                  !!accountError ||
                  !!passwordError ||
                  !!confirmPasswordError ||
                  !!usernameError ||
                  !!emailError
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
