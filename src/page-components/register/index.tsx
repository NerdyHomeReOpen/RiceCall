import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

import { openAlertDialog } from '@/services';

interface RegisterPageProps {
  display: boolean;
  onBackToLoginBtnClick: () => void;
}

const RegisterPageComponent: React.FC<RegisterPageProps> = React.memo(({ display, onBackToLoginBtnClick }) => {
  const { t } = useTranslation();
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

  const canSubmit =
    !!account.trim() &&
    !!password.trim() &&
    !!username.trim() &&
    !!email.trim() &&
    !!confirmPassword.trim() &&
    !accountError &&
    !passwordError &&
    !confirmPasswordError &&
    !usernameError &&
    !emailError;

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

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

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

    await ipc.auth.register({ account, password, email, username, locale: ipc.systemSettings.locale.get() }).then((res) => {
      if (res.success) {
        openAlertDialog(t(res.message, { '0': email }), onBackToLoginBtnClick);
      }
    });

    setIsLoading(false);
  };

  const handleBackToLoginBtnClick = () => {
    onBackToLoginBtnClick();
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background-secondary" style={display ? {} : { display: 'none' }}>
      <main className="flex flex-1 flex-col items-center justify-center w-full h-[60%]">
        <form className="flex flex-col gap-[10px] items-center justify-center w-[300px]" onSubmit={handleSubmit}>
          {isLoading ? (
            <>
              <div className="text-[0.9rem] text-text-color-secondary">{`${t('registering')}...`}</div>
              <div className="flex items-center justify-center w-[256px] h-[12px] bg-[url('/icon_loading.gif')] bg-no-repeat bg-center bg-cover" />
            </>
          ) : (
            <>
              <div className="flex flex-col gap-[3px] w-full">
                <div className="flex items-center w-full">
                  <div className="inline-block w-[80px] pr-[10px] text-[0.9rem] text-text-color-secondary text-right">{t('account')}</div>
                  <input
                    type="text"
                    name="account"
                    value={account}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder={t('please-input-account')}
                    className="relative flex-1 h-[29px] p-[8px] border border-border shadow-[inset_1px_1px_3px_rgb(0_0_0/10%)] transition-shadow duration-300 ease-[ease]"
                    style={accountError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {accountError ? <div className="ml-[80px] text-text-warning">{accountError}</div> : <div className="ml-[80px] text-text-color-quaternary">{t('account-hint')}</div>}
              </div>
              <div className="flex flex-col gap-[3px] w-full">
                <div className="flex items-center w-full">
                  <div className="inline-block w-[80px] pr-[10px] text-[0.9rem] text-text-color-secondary text-right">{t('password')}</div>
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder={t('please-input-password')}
                    className="relative flex-1 h-[29px] p-[8px] border border-border shadow-[inset_1px_1px_3px_rgb(0_0_0/10%)] transition-shadow duration-300 ease-[ease]"
                    style={passwordError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {passwordError ? <div className="ml-[80px] text-text-warning">{passwordError}</div> : <div className="ml-[80px] text-text-color-quaternary">{t('password-hint')}</div>}
              </div>
              <div className="flex flex-col gap-[3px] w-full">
                <div className="flex items-center w-full">
                  <div className="inline-block w-[80px] pr-[10px] text-[0.9rem] text-text-color-secondary text-right">{t('confirm-password')}</div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder={t('please-input-password-again')}
                    className="relative flex-1 h-[29px] p-[8px] border border-border shadow-[inset_1px_1px_3px_rgb(0_0_0/10%)] transition-shadow duration-300 ease-[ease]"
                    style={confirmPasswordError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {confirmPasswordError ? (
                  <div className="ml-[80px] text-text-warning">{confirmPasswordError}</div>
                ) : (
                  <div className="ml-[80px] text-text-color-quaternary">{t('repeat-password-hint')}</div>
                )}
              </div>
              <div className="flex flex-col gap-[3px] w-full">
                <div className="flex items-center w-full">
                  <div className="inline-block w-[80px] pr-[10px] text-[0.9rem] text-text-color-secondary text-right">{t('email')}</div>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder={t('please-input-email')}
                    className="relative flex-1 h-[29px] p-[8px] border border-border shadow-[inset_1px_1px_3px_rgb(0_0_0/10%)] transition-shadow duration-300 ease-[ease]"
                    style={emailError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {emailError ? <div className="ml-[80px] text-text-warning">{emailError}</div> : <div className="ml-[80px] text-text-color-quaternary">{t('email-hint')}</div>}
              </div>
              <div className="flex flex-col gap-[3px] w-full">
                <div className="flex items-center w-full">
                  <div className="inline-block w-[80px] pr-[10px] text-[0.9rem] text-text-color-secondary text-right">{t('nickname')}</div>
                  <input
                    name="username"
                    value={username}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder={t('please-input-nickname')}
                    className="relative flex-1 h-[29px] p-[8px] border border-border shadow-[inset_1px_1px_3px_rgb(0_0_0/10%)] transition-shadow duration-300 ease-[ease]"
                    style={usernameError ? { borderColor: 'var(--text-warning)' } : {}}
                  />
                </div>
                {usernameError ? <div className="ml-[80px] text-text-warning">{usernameError}</div> : <div className="ml-[80px] text-text-color-quaternary">{t('nickname-hint')}</div>}
              </div>
              <button
                className="w-[200px] h-[42px] mt-[10px] text-white cursor-pointer bg-[#1680ce] rounded-[4px] hover:bg-[#419ddd] active:bg-[#1680ce] disabled:cursor-not-allowed disabled:bg-[#1680ce] disabled:opacity-60"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {t('register')}
              </button>
            </>
          )}
        </form>
      </main>
      <div className="flex items-center justify-start w-full px-[15px] py-[10px] mt-auto text-[0.9rem] text-text-color-quaternary bg-footer-background border-t border-t-border">
        <div
          className="flex items-end no-underline cursor-pointer hover:text-[#0073c6] before:min-w-[14px] before:min-h-[14px] before:mr-[5px] before:align-middle before:content-[''] before:bg-no-repeat before:bg-[position:0_0]"
          onClick={handleBackToLoginBtnClick}
        >
          {t('back-to-login')}
        </div>
      </div>
    </main>
  );
});

RegisterPageComponent.displayName = 'RegisterPageComponent';

const RegisterPage = dynamic(() => Promise.resolve(RegisterPageComponent), { ssr: false });

export default RegisterPage;
