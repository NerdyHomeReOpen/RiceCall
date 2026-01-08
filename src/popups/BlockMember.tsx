import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';

import popupStyles from '@/styles/popup.module.css';

interface BlockMemberPopupProps {
  serverId: Types.Server['serverId'];
  member: Types.Member;
}

const BlockMemberPopup: React.FC<BlockMemberPopupProps> = React.memo(({ serverId, member }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [blockType, setBlockType] = useState<'block-permanent' | 'block-ip'>('block-permanent');

  // Variables
  const blockTypeOptions = [
    { key: 'block-permanent', label: t('block-permanent'), disabled: false },
    { key: 'block-ip', label: t('block-ip'), disabled: true },
  ];

  // Handlers
  const handleBlockTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBlockType(e.target.value as 'block-permanent' | 'block-ip');
  };

  const handleConfirmBtnClick = () => {
    Popup.blockUserFromServer(member.userId, serverId, -1);
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={popupStyles['popup-body']}>
        <div className={popupStyles['dialog-content']}>
          <div className={`${popupStyles['dialog-icon']} ${popupStyles['alert']}`} />
          <div className={popupStyles['col']}>
            <div className={popupStyles['label']}>{t('confirm-block-user', { '0': member.nickname || member.name })}</div>
            <div className={popupStyles['col']}>
              <div className={`${popupStyles['input-box']} ${popupStyles['row']}`}>
                <div className={popupStyles['label']}>{t('block-type')}</div>
                <div className={popupStyles['select-box']}>
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
      <div className={popupStyles['popup-footer']}>
        <div className={popupStyles['button']} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

BlockMemberPopup.displayName = 'BlockMemberPopup';

export default BlockMemberPopup;
