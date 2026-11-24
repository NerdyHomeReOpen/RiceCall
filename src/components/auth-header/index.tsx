import React from 'react';

interface AuthHeaderProps {
  onMinimize: () => void;
  onClose: () => void;
}

const AuthHeader: React.FC<AuthHeaderProps> = React.memo(({ onMinimize, onClose }) => {
  const handleMinimizeClick = () => {
    onMinimize();
  };

  const handleCloseClick = () => {
    onClose();
  };

  return (
    <header className="z-10 flex justify-between min-h-[40px] text-secondary-color bg-main-color bg-(image:--header-image) bg-no-repeat bg-[position:0_0] bg-cover [-webkit-app-region:drag]">
      <div className="flex flex-row gap-[5px] items-center justify-between px-[10px] before:inline-block before:min-w-[18px] before:min-h-[18px] before:content-[''] before:bg-[url('/rc_logo_small.svg')] before:bg-no-repeat before:bg-center before:bg-auto">
        <div className="inline-block min-w-[60px] min-h-[24px] bg-[url('/login_logo_title.svg')] bg-no-repeat bg-center bg-contain" />
      </div>
      <div className="flex gap-[5px] items-center justify-end min-w-fit mr-[10px] [-webkit-app-region:no-drag] cursor-pointer">
        <div
          className="inline-block min-w-[20px] min-h-[20px] cursor-pointer bg-[url('/Button_Minsize.svg')] bg-no-repeat bg-[position:0_0] bg-cover hover:bg-[position:-20px_0] active:bg-[position:-40px_0]"
          onClick={handleMinimizeClick}
        />
        <div
          className="inline-block min-w-[20px] min-h-[20px] cursor-pointer bg-[url('/Button_Close.svg')] bg-no-repeat bg-[position:0_0] bg-cover hover:bg-[position:-20px_0] active:bg-[position:-40px_0]"
          onClick={handleCloseClick}
        />
      </div>
    </header>
  );
});

AuthHeader.displayName = 'AuthHeader';

export default AuthHeader;
