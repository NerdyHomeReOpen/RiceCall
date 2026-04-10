import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

import * as Actions from '@/action';

interface BlockMemberPopupProps {
  id: string;
  serverId: Types.Server['serverId'];
  member: Types.Member;
}

const BlockMemberPopup: React.FC<BlockMemberPopupProps> = React.memo(({ id, serverId, member }) => {
  const { t } = useTranslation();

  const [blockType, setBlockType] = useState<'block-permanent' | 'block-ip'>('block-permanent');

  const blockTypeOptions = [
    { key: 'block-permanent', label: t('block-permanent'), disabled: false },
    { key: 'block-ip', label: t('block-ip'), disabled: true },
  ];

  const handleBlockTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBlockType(e.target.value as 'block-permanent' | 'block-ip');
  };

  const handleConfirmBtnClick = () => {
    Actions.blockUserFromServer(member.userId, serverId, -1);
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content">
          <div className="dialog-icon alert" />
          <div className="col">
            <div className="label">{t('confirm-block-user', { '0': member.nickname || member.name })}</div>
            <div className="col">
              <div className="input-box row">
                <div className="label">{t('block-type')}</div>
                <div className="select-box">
                  <select value={blockType} onChange={handleBlockTypeChange}>
                    {blockTypeOptions.map((option) => (
                      <option key={option.key} value={option.key} disabled={option.disabled}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

BlockMemberPopup.displayName = 'BlockMemberPopup';

export default BlockMemberPopup;
