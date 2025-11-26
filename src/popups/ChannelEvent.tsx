import React, { useMemo, useState, useEffect } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import styles from '@/styles/channelEvent.module.css';
import permission from '@/styles/permission.module.css';

// Types
import type { Channel, OnlineMember, Member, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog, handleOpenDirectMessage, handleOpenUserInfo, handleOpenEditNickname, handleOpenBlockMember } from '@/utils/popup';
import Sorter from '@/utils/sorter';
import { isMember, isServerAdmin, isChannelMod, isServerOwner, isChannelAdmin } from '@/utils/permission';

interface ChannelEventPopupProps {
  user: User;
  channels: Channel[];
  serverOnlineMembers: OnlineMember[];
}

const ChannelEventPopup: React.FC<ChannelEventPopupProps> = React.memo(({ user, channels, serverOnlineMembers }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // States
  const [serverChannels, setServerChannels] = useState<Channel[]>(channels);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>(serverOnlineMembers);
  const [selectMode, setSelectMode] = useState<'current' | 'all'>('current');

  // Variables
  const { userId, currentChannelId: userCurrentChannelId, permissionLevel: userPermissionLevel } = user;

  const { channelId, name: channelName } = serverChannels.filter((c) => c.channelId === userCurrentChannelId)[0];

  // Effects

  // Handlers
  const handleClose = () => {
    ipc.window.close();
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Header */}
      <div className={styles['options-viewer']}>
        <div className={`${styles['option-tab']} ${selectMode === 'current' ? styles['active'] : ''}`} onClick={() => setSelectMode('current')}>
          {t('current-channel')}
        </div>
        <div className={`${styles['option-tab']} ${selectMode === 'all' ? styles['active'] : ''}`} onClick={() => setSelectMode('all')}>
          {t('all-channel')}
        </div>
      </div>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={styles['event-list']} style={selectMode === 'current' ? {} : { display: 'none' }}>
          <div className={styles['current-channel']}>{channelName}</div>
        </div>
        <div className={styles['event-list']} style={selectMode === 'all' ? {} : { display: 'none' }}></div>
      </div>
      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

ChannelEventPopup.displayName = 'ChannelEventPopup';

export default ChannelEventPopup;
