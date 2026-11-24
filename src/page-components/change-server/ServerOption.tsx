import React from 'react';
import { useTranslation } from 'react-i18next';

interface ServerOptionProps {
  option: { tKey: string; value: 'prod' | 'dev' };
  onServerSelect: (value: 'prod' | 'dev') => void;
}

const ServerOption: React.FC<ServerOptionProps> = React.memo(({ option, onServerSelect }) => {
  const { t } = useTranslation();

  const handleClick = () => {
    onServerSelect(option.value);
  };

  return (
    <button
      key={option.value}
      className="w-[200px] h-[42px] mt-[10px] text-white cursor-pointer bg-[#1680ce] rounded-[4px] hover:bg-[#419ddd] active:bg-[#1680ce] disabled:cursor-not-allowed disabled:bg-[#1680ce] disabled:opacity-60"
      onClick={handleClick}
    >
      {t(option.tKey)}
    </button>
  );
});

ServerOption.displayName = 'ServerOption';

export default ServerOption;
