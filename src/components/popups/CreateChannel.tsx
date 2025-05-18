import React, { useEffect, useRef, useState } from 'react';

// Types
import { Channel, Server, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface CreateChannelPopupProps {
  userId: User['userId'];
  channelId: Channel['channelId'] | null;
  serverId: Server['serverId'];
}

const CreateChannelPopup: React.FC<CreateChannelPopupProps> = React.memo(
  (initialData: CreateChannelPopupProps) => {
    // Hooks
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);

    // States
    const [parent, setParent] = useState<Channel>(createDefault.channel());
    const [channel, setChannel] = useState<Channel>(createDefault.channel());

    // Variables
    const { channelId, serverId } = initialData;
    const { name: parentName } = parent;
    const { name: channelName } = channel;

    const handleCreateChannel = (
      channel: Partial<Channel>,
      serverId: Server['serverId'],
    ) => {
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
          refreshService.channel({
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
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={popup['inputBox']}>
                <div className={popup['label']}>{lang.tr.parentChannel}</div>
                <div className={popup['label']}>
                  {parentName || lang.tr.none}
                </div>
              </div>
              <div className={popup['inputBox']}>
                <div className={popup['label']}>{lang.tr.channelName}</div>
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

        <div className={popup['popupFooter']}>
          <button
            className={popup['button']}
            disabled={!channelName.trim()}
            onClick={() => {
              handleCreateChannel(
                { name: channelName, categoryId: channelId },
                serverId,
              );
              handleClose();
            }}
          >
            {lang.tr.confirm}
          </button>
          <button className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

CreateChannelPopup.displayName = 'CreateChannelPopup';

export default CreateChannelPopup;
