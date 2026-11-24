import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import * as ipc from '@/main/ipc';

interface LoginPageProps {
  display: boolean;
  onRegisterBtnClick: () => void;
  onChangeServerBtnClick: () => void;
}

const LoginPageComponent: React.FC<LoginPageProps> = React.memo(({ display, onRegisterBtnClick, onChangeServerBtnClick }) => {
  const { t } = useTranslation();
  const comboRef = useRef<HTMLDivElement>(null);
  const [account, setAccount] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberAccount, setRememberAccount] = useState<boolean>(false);
  const [isAutoLoginEnabled, setIsAutoLoginEnabled] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Record<string, { isAutoLoginEnabled: boolean; rememberAccount: boolean; password: string }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAccountSelectBoxVisible, setIsAccountSelectBoxVisible] = useState<boolean>(false);

  const deleteAccount = (account: string) => {
    ipc.accounts.delete(account);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;

    if (name === 'account') {
      const match = accounts[value];
      setAccount(value);
      setRememberAccount(match?.rememberAccount ?? false);
      setIsAutoLoginEnabled(match?.isAutoLoginEnabled ?? false);
    } else if (name === 'password') {
      setPassword(value);
    } else if (name === 'isAutoLoginEnabled') {
      setIsAutoLoginEnabled(checked);
      setRememberAccount(checked ? true : rememberAccount);
    } else if (name === 'rememberAccount') {
      if (isAutoLoginEnabled && !checked) {
        setIsAutoLoginEnabled(false);
        setRememberAccount(false);
      }

      setRememberAccount(checked);
    }
  };

  const handleAccountSelectClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsAccountSelectBoxVisible((prev) => !prev);
  };

  const handleForgotPasswordClick = () => {
    window.open('https://ricecall.com/password/forget', '_blank');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!account || !password) return;
    setIsLoading(true);

    await ipc.auth.login({ account, password }).then((res) => {
      if (res.success) {
        if (rememberAccount) ipc.accounts.add(account, { isAutoLoginEnabled, rememberAccount, password });
        localStorage.setItem('login-account', account);
      }
    });

    setIsLoading(false);
  };

  const handleChangeServerBtnClick = () => {
    onChangeServerBtnClick();
  };

  const handleRegisterBtnClick = () => {
    onRegisterBtnClick();
  };

  useEffect(() => {
    const loginAccount = localStorage.getItem('login-account') || '';
    setAccount(accounts[loginAccount] ? loginAccount : '');
    setPassword(accounts[loginAccount]?.password ?? '');
    setRememberAccount(!!accounts[loginAccount]?.rememberAccount);
    setIsAutoLoginEnabled(!!accounts[loginAccount]?.isAutoLoginEnabled);
  }, [accounts]);

  useEffect(() => {
    const changeAccounts = (accounts: Record<string, { isAutoLoginEnabled: boolean; rememberAccount: boolean; password: string }>) => {
      setAccounts(accounts);
    };

    changeAccounts(ipc.accounts.get());
    const unsub = ipc.accounts.onUpdate(changeAccounts);
    return () => unsub();
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!comboRef.current?.contains(e.target as Node)) setIsAccountSelectBoxVisible(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center justify-center min-w-0 min-h-0 bg-background" style={display ? {} : { display: 'none' }}>
      <main className="flex flex-col gap-[10px] items-center justify-center w-[226px] h-full">
        <div className="block min-w-[226px] min-h-[54px] bg-[url('/login_logo.svg')] bg-no-repeat bg-center bg-contain" />
        <form className="flex flex-col gap-[10px] items-center justify-center w-full h-[60%]" onSubmit={handleSubmit}>
          {isLoading ? (
            <>
              <div className="text-[0.9rem] text-text-color-secondary">{`${t('logining')}...`}</div>
              <div className="flex items-center justify-center w-[256px] h-[12px] bg-[url('/icon_loading.gif')] bg-no-repeat bg-center bg-auto" />
            </>
          ) : (
            <>
              <div className="flex flex-col w-full max-w-[400px]">
                <div className="block w-auto mb-[5px] text-text-color-secondary text-left">{t('account')}</div>
                <div className="group relative flex border border-border shadow-[inset_1px_1px_3px_#0000001f] hover:border-border-secondary" ref={comboRef}>
                  <input
                    type="text"
                    name="account"
                    value={account}
                    onChange={handleInputChange}
                    placeholder={t('please-input-account')}
                    className="relative flex-1 h-[29px] p-[8px] transition-shadow duration-300 ease-[ease]"
                  />
                  <div
                    className="relative flex items-center justify-center w-[25px] h-full before:w-[2px] before:h-[20px] before:mr-[3px] before:content-[''] before:bg-[url('/channel/icon_v_split.svg')] before:bg-no-repeat before:bg-[position:0_0] after:w-[20px] after:h-[12px] after:content-[''] after:bg-[url('/login_combobox_triangle.svg')] after:bg-no-repeat after:bg-[position:-7px_0] group-hover:bg-[linear-gradient(to_bottom,#fff_0%,#f3f3f3_50%,#e0e0e0_100%)] group-hover:after:bg-[position:-33px_0] active:bg-[linear-gradient(to_bottom,#e0e0e0_0%,#f3f3f3_50%,#fff_100%)] active:after:bg-[position:-59px_0]"
                    onClick={handleAccountSelectClick}
                  />
                  <div
                    className="absolute top-[30px] z-1 flex flex-col w-full h-[200px] overflow-y-auto bg-background border border-border"
                    style={isAccountSelectBoxVisible ? {} : { display: 'none' }}
                  >
                    {Object.entries(accounts).map(([account, { isAutoLoginEnabled, rememberAccount, password }]) => (
                      <div
                        key={account}
                        className="relative flex shrink-0 items-center justify-between w-full h-[25px] px-[3px] hover:bg-hover"
                        onClick={() => {
                          setAccount(account);
                          setRememberAccount(rememberAccount);
                          setIsAutoLoginEnabled(isAutoLoginEnabled);
                          setPassword(password);
                          setIsAccountSelectBoxVisible(false);
                        }}
                      >
                        {account}
                        <div
                          className="min-w-[18px] min-h-[18px] cursor-pointer bg-[url('/loading_close.svg')] bg-[position:0_0] bg-cover hover:bg-[position:-18px_0] active:bg-[position:-36px_0]"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAccount(account);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col w-full max-w-[400px]">
                <div className="block w-auto mb-[5px] text-text-color-secondary text-left">{t('password')}</div>
                <div className="group relative flex border border-border shadow-[inset_1px_1px_3px_#0000001f] hover:border-border-secondary">
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={handleInputChange}
                    placeholder={t('please-input-password')}
                    className="relative flex-1 h-[29px] p-[8px] transition-shadow duration-300 ease-[ease]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between w-full max-w-[400px] text-[0.9rem] text-text-color-quaternary">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberAccount"
                    checked={rememberAccount}
                    onChange={handleInputChange}
                    className="appearance-none cursor-pointer before:block before:min-w-[18px] before:min-h-[18px] before:content-[''] before:bg-[url('/ctrl/checkbox_icon.svg')] before:bg-[position:0_0] before:bg-auto checked:before:bg-[position:0_-18px] hover:before:bg-[position:-18px_0] hover:checked:before:bg-[position:-18px_-18px]"
                    tabIndex={-1}
                  />
                  {t('remember-account')}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAutoLoginEnabled"
                    checked={isAutoLoginEnabled}
                    onChange={handleInputChange}
                    className="appearance-none cursor-pointer before:block before:min-w-[18px] before:min-h-[18px] before:content-[''] before:bg-[url('/ctrl/checkbox_icon.svg')] before:bg-[position:0_0] before:bg-auto checked:before:bg-[position:0_-18px] hover:before:bg-[position:-18px_0] hover:checked:before:bg-[position:-18px_-18px]"
                    tabIndex={-1}
                  />
                  {t('auto-login')}
                </div>
              </div>
              <button
                className="w-[200px] h-[42px] mt-[10px] text-white cursor-pointer bg-[#1680ce] rounded-[4px] hover:bg-[#419ddd] active:bg-[#1680ce] disabled:cursor-not-allowed disabled:bg-[#1680ce] disabled:opacity-60"
                onClick={handleSubmit}
                tabIndex={-1}
                disabled={!account || !password}
              >
                {t('login')}
              </button>
            </>
          )}
        </form>
      </main>
      <div className="flex items-center justify-between w-full px-[15px] py-[10px] text-[0.9rem] text-text-color-quaternary bg-footer-background border-t border-t-border">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div
            className="flex items-end no-underline cursor-pointer hover:text-[#0073c6] before:min-w-[14px] before:min-h-[14px] before:mr-[5px] before:align-middle before:content-[''] before:bg-cover before:bg-[url('/icon_createaccount.svg')] before:bg-no-repeat before:bg-[position:0_0]"
            onClick={handleRegisterBtnClick}
          >
            {t('register-account')}
          </div>
          {'/'}
          <div className="flex items-end no-underline cursor-pointer hover:text-[#0073c6]" onClick={handleChangeServerBtnClick}>
            {t('change-server')}
          </div>
        </div>
        <div
          className="flex items-end no-underline cursor-pointer hover:text-[#0073c6] before:min-w-[14px] before:min-h-[14px] before:mr-[5px] before:align-middle before:content-[''] before:bg-cover before:bg-[url('/icon_getpass.svg')] before:bg-no-repeat before:bg-[position:0_0]"
          onClick={handleForgotPasswordClick}
        >
          {t('forgot-password')}
        </div>
      </div>
    </main>
  );
});

LoginPageComponent.displayName = 'LoginPageComponent';

const LoginPage = dynamic(() => Promise.resolve(LoginPageComponent), { ssr: false });

export default LoginPage;
