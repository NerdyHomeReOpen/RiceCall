import React, { useEffect, useRef, useState } from 'react';

// Types
import { Channel, Server } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';
import getService from '@/services/get.service';

// Utils
import Default from '@/utils/default';

interface CreateChannelPopupProps {
  channelId: Channel['channelId'] | null;
  serverId: Server['serverId'];
}

const CreateChannelPopup: React.FC<CreateChannelPopupProps> = React.memo(({ channelId, serverId }) => {
  // Hooks
  const socket = useSocket();
  const { t } = useTranslation();

  // Refs
  const refreshRef = useRef(false);

  // States
  const [parent, setParent] = useState<Channel>(Default.channel());
  const [channel, setChannel] = useState<Channel>(Default.channel());

  // Variables
  const { name: parentName } = parent;
  const { name: channelName } = channel;
  const canCreate = channelName.trim();

  const handleCreateChannel = (channel: Partial<Channel>, serverId: Server['serverId']) => {
    if (!socket) return;
    socket.send.createChannel({ channel, serverId });
  };

  const handleClose = () => {
    ipcService.window.close();
  };

  // Effects
  useEffect(() => {
    if (!channelId || refreshRef.current) return;
    const refresh = async () => {
      refreshRef.current = true;
      Promise.all([
        getService.channel({
          channelId: channelId,
        }),
      ]).then(([parent]) => {
        if (parent) {
          setParent(parent);
        }
      });
    };
    refresh();
  }, [channelId]);

  return (
    <div className={popup['popupContainer']}>
      {/* Body */}
      <div className={popup['popupBody']}>
        <div className={setting['body']}>
          <div className={popup['inputGroup']}>
            <div className={popup['inputBox']}>
              <div className={popup['label']}>{t('parent-channel')}</div>
              <div className={popup['label']}>{parentName || t('none')}</div>
            </div>
            <div className={popup['inputBox']}>
              <div className={popup['label']}>{t('channel-name')}</div>
              <input
                name="name"
                type="text"
                value={channelName}
                maxLength={32}
                onChange={(e) =>
                  setChannel((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popupFooter']}>
        <div
          className={`${popup['button']} ${!canCreate ? popup['disabled'] : ''}`}
          onClick={() => {
            handleCreateChannel({ name: channelName, categoryId: channelId }, serverId);
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={() => handleClose()}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

CreateChannelPopup.displayName = 'CreateChannelPopup';

export default CreateChannelPopup;
