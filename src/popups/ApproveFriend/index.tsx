import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

import * as Actions from '@/action';

import { useAppSelector } from '@/hooks/Store';

interface ApproveFriendPopupProps {
  id: string;
  targetId: Types.User['userId'];
}

const ApproveFriendPopup: React.FC<ApproveFriendPopupProps> = React.memo(({ id, targetId }) => {
  const { t } = useTranslation();

  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  const [friendNotes, setFriendNotes] = useState<string>('');
  const [friendGroupId, setFriendGroupId] = useState<Types.FriendGroup['friendGroupId']>('');

  const handleCreateFriendGroupBtnClick = () => {
    Actions.openCreateFriendGroup();
  };

  const handleFriendGroupIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFriendGroupId(e.target.value);
  };

  const handleFriendNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFriendNotes(e.target.value);
  };

  const handleAddBtnClick = () => {
    Actions.approveFriendApplication(targetId, friendGroupId || null, friendNotes);
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className="popup-body">
        <div className="dialog-content col">
          <div className="input-box col">
            <div className="label">{t('select-friend-group')}</div>
            <div className="row">
              <div className="select-box" style={{ maxWidth: '100px', minWidth: '0' }}>
                <select className="select" onChange={handleFriendGroupIdChange}>
                  <option value={''}>{t('none')}</option>
                  {friendGroups.map((group) => (
                    <option key={group.friendGroupId} value={group.friendGroupId}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="link-text" onClick={handleCreateFriendGroupBtnClick}>
                {t('create-friend-group')}
              </div>
            </div>
          </div>
          <div className="input-box col">
            <div className="label">{t('friend-note-name')}</div>
            <input className="input" type="text" onChange={handleFriendNotesChange} style={{ maxWidth: '60%' }} />
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className="button" onClick={handleAddBtnClick}>
          {t('add')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ApproveFriendPopup.displayName = 'ApproveFriendPopup';

export default ApproveFriendPopup;
