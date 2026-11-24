import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

import type * as Types from '@/types';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

interface SendSectionProps {
  receiver: Types.User;
  friendGroups: Types.FriendGroup[];
  friendGroupId: string;
  applicationDesc: string;
  onReceiverNameClick: () => void;
  onFriendGroupIdChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onApplicationDescChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCreateFriendGroupBtnClick: () => void;
  onSubmitBtnClick: () => void;
  onCancelBtnClick: () => void;
}

const SendSection: React.FC<SendSectionProps> = React.memo(
  ({ receiver, friendGroups, applicationDesc, onReceiverNameClick, onFriendGroupIdChange, onApplicationDescChange, onCreateFriendGroupBtnClick, onSubmitBtnClick, onCancelBtnClick }) => {
    const { t } = useTranslation();

    return (
      <>
        <div className="popup-body">
          <div className="popup-content col">
            <div className="label">{t('apply-friend-label')}</div>
            <div className="row">
              <div className="relative self-center w-[40px] h-[40px] mr-[5px] before:absolute before:-top-px before:-left-px before:z-1 before:min-w-[42px] before:min-h-[42px] before:content-[''] before:bg-[url('/channel/server_logo_border.svg')] before:bg-no-repeat before:bg-position-[0_0] before:bg-cover">
                <Image src={receiver.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="receiver_avatar" width={40} height={40} loading="lazy" draggable="false" />
              </div>
              <div className="flex flex-1 flex-col justify-around h-full">
                <div className="link-text" onClick={onReceiverNameClick}>
                  {receiver.name}
                </div>
                <div className="sub-text">{receiver.displayId}</div>
              </div>
            </div>
            <div className="w-full my-[5px] border-b border-b-border" />
            <div className="col">
              <div className="input-box col">
                <div className="label">{t('select-friend-group')}</div>
                <div className="row">
                  <div className="select-box" style={{ maxWidth: '100px', minWidth: '0' }}>
                    <select className="select" onChange={onFriendGroupIdChange}>
                      <option value={''}>{t('none')}</option>
                      {friendGroups.map((group) => (
                        <option key={group.friendGroupId} value={group.friendGroupId}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="link-text" onClick={onCreateFriendGroupBtnClick}>
                    {t('create-friend-group')}
                  </div>
                </div>
              </div>
              <div className="input-box col">
                <div className="label">{t('note')}</div>
                <textarea rows={2} value={applicationDesc} onChange={onApplicationDescChange} />
              </div>
            </div>
          </div>
        </div>
        <div className="popup-footer">
          <div className="button" onClick={onSubmitBtnClick}>
            {t('submit')}
          </div>
          <div className="button" onClick={onCancelBtnClick}>
            {t('cancel')}
          </div>
        </div>
      </>
    );
  },
);

SendSection.displayName = 'SendSection';

export default SendSection;
