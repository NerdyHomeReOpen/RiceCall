import React, { useState } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import ipc from '@/main/ipc';

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

  const [section, setSection] = useState<number>(friendApplication ? 1 : 0); // 0: send, 1: sent, 2: edit
  const [friendGroupId, setFriendGroupId] = useState<Types.FriendGroup['friendGroupId']>('');
  const [applicationDesc, setApplicationDesc] = useState<Types.FriendApplication['description']>(friendApplication?.description || '');

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

  const handleModifyClick = () => {
    setSection(2);
  };

  const handleSubmitClick = () => {
    Actions.sendFriendApplication(target.userId, { description: applicationDesc }, friendGroupId || null);
    ipc.popup.close(id);
  };

  const handleSubmitEditClick = () => {
    Actions.editFriendApplication(target.userId, { description: applicationDesc });
    ipc.popup.close(id);
  };

  const handleCloseClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      {section === 0 && (
        <SendSection
          target={target}
          friendGroups={friendGroups}
          friendGroupId={friendGroupId}
          applicationDesc={applicationDesc}
          onTargetNameClick={handleTargetNameClick}
          onFriendGroupIdChange={handleFriendGroupIdChange}
          onApplicationDescChange={handleApplicationDescChange}
          onCreateFriendGroup={handleCreateFriendGroupBtnClick}
          onSubmitClick={handleSubmitClick}
          onCloseClick={handleCloseClick}
        />
      )}
      {section === 1 && <SentSection target={target} onTargetNameClick={handleTargetNameClick} onModifyClick={handleModifyClick} onCloseClick={handleCloseClick} />}
      {section === 2 && (
        <EditSection
          target={target}
          applicationDesc={applicationDesc}
          onTargetNameClick={handleTargetNameClick}
          onApplicationDescChange={handleApplicationDescChange}
          onSubmitClick={handleSubmitEditClick}
          onCloseClick={handleCloseClick}
        />
      )}
    </div>
  );
});

ApplyFriendPopup.displayName = 'ApplyFriendPopup';

export default ApplyFriendPopup;
