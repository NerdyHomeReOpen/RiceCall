import React from 'react';

import type * as Types from '@/types';

interface StatusItemProps {
  status: Types.User['status'];
  onStatusSelect: (status: Types.User['status']) => void;
  onClose: () => void;
}

const StatusItem: React.FC<StatusItemProps> = React.memo(({ status, onStatusSelect, onClose }) => {
  const handleClick = () => {
    onStatusSelect(status);
    onClose();
  };

  return (
    <div
      key={status}
      className={`box-content flex flex-col items-center justify-center w-[13px] h-[13px] px-[5px] py-[3px] hover:bg-hover before:inline-block before:min-w-[13px] before:min-h-[13px] before:content-[''] before:bg-[url('/user_state.svg')] before:bg-no-repeat ${{ online: 'before:bg-position-[0_0]', dnd: 'before:bg-position-[-13px_0]', idle: 'before:bg-position-[-26px_0]', gn: 'before:bg-position-[-39px_0]' }[status] ?? 'before:bg-position-[0_0]'}`}
      datatype={status}
      onClick={handleClick}
    />
  );
});

StatusItem.displayName = 'StatusItem';

export default StatusItem;
