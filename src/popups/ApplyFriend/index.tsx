import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Actions from '@/action';

import { useAppSelector } from '@/hooks/Store';

import SendSection from './SendSection';
import SentSection from './SentSection';
import EditSection from './EditSection';

interface ApplyFriendPopupProps {
  id: string;
  target: Types.User;
  friendApplication: Types.FriendApplication | null;
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(({ id, target, friendApplication }) => {
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );

  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);

  const [section, setSection] = useState<number>(friendApplication ? 1 : 0);
  const [friendGroupId, setFriendGroupId] = useState<Types.FriendGroup['friendGroupId']>('');
  const [applicationDesc, setApplicationDesc] = useState<Types.FriendApplication['description']>(friendApplication?.description || '');

  const isSendSection = section === 0;
  const isSentSection = section === 1;
  const isEditSection = section === 2;

  const handleTargetNameClick = () => {
    Actions.openUserInfo(user.userId, target.userId);
  };

  const handleCreateFriendGroupBtnClick = () => {
    Actions.openCreateFriendGroup();
  };

  const handleApplicationDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setApplicationDesc(e.target.value);
  };

  const handleFriendGroupIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFriendGroupId(e.target.value);
  };

  const handleModifyBtnClick = () => {
    setSection(2);
  };

  const handleSubmitClick = () => {
    Actions.sendFriendApplication(target.userId, { description: applicationDesc }, friendGroupId || null);
    ipc.popup.close(id);
  };

  const handleSubmitEditBtnClick = () => {
    Actions.editFriendApplication(target.userId, { description: applicationDesc });
    ipc.popup.close(id);
  };

  const handleConfirmBtnClick = () => {
    ipc.popup.close(id);
  };

  const handleCancelBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      {isSendSection && (
        <SendSection
          target={target}
          friendGroups={friendGroups}
          friendGroupId={friendGroupId}
          applicationDesc={applicationDesc}
          onTargetNameClick={handleTargetNameClick}
          onFriendGroupIdChange={handleFriendGroupIdChange}
          onApplicationDescChange={handleApplicationDescChange}
          onCreateFriendGroupBtnClick={handleCreateFriendGroupBtnClick}
          onSubmitBtnClick={handleSubmitClick}
          onCancelBtnClick={handleCancelBtnClick}
        />
      )}
      {isSentSection && <SentSection target={target} onTargetNameClick={handleTargetNameClick} onModifyBtnClick={handleModifyBtnClick} onConfirmBtnClick={handleConfirmBtnClick} />}
      {isEditSection && (
        <EditSection
          target={target}
          applicationDesc={applicationDesc}
          onTargetNameClick={handleTargetNameClick}
          onApplicationDescChange={handleApplicationDescChange}
          onSubmitBtnClick={handleSubmitEditBtnClick}
          onCancelBtnClick={handleCancelBtnClick}
        />
      )}
    </div>
  );
});

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
