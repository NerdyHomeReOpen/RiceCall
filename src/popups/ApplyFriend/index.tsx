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
  receiver: Types.User;
  friendApplication: Types.FriendApplication | null;
}

const ApplyFriendPopup: React.FC<ApplyFriendPopupProps> = React.memo(({ id, receiver, friendApplication }) => {
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

  const handleReceiverNameClick = () => {
    Actions.openUserInfo(user.userId, receiver.userId);
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
    Actions.sendFriendApplication(receiver.userId, { description: applicationDesc }, friendGroupId || null);
    ipc.popup.close(id);
  };

  const handleSubmitEditBtnClick = () => {
    Actions.editFriendApplication(receiver.userId, { description: applicationDesc });
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
          receiver={receiver}
          friendGroups={friendGroups}
          friendGroupId={friendGroupId}
          applicationDesc={applicationDesc}
          onReceiverNameClick={handleReceiverNameClick}
          onFriendGroupIdChange={handleFriendGroupIdChange}
          onApplicationDescChange={handleApplicationDescChange}
          onCreateFriendGroupBtnClick={handleCreateFriendGroupBtnClick}
          onSubmitBtnClick={handleSubmitClick}
          onCancelBtnClick={handleCancelBtnClick}
        />
      )}
      {isSentSection && <SentSection receiver={receiver} onReceiverNameClick={handleReceiverNameClick} onModifyBtnClick={handleModifyBtnClick} onConfirmBtnClick={handleConfirmBtnClick} />}
      {isEditSection && (
        <EditSection
          receiver={receiver}
          applicationDesc={applicationDesc}
          onReceiverNameClick={handleReceiverNameClick}
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
