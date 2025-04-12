import React, { useEffect, useRef, useState } from 'react';

// Types
import { Category, Channel, Server, User } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// CSS
import popup from '@/styles/common/popup.module.css';
import setting from '@/styles/popups/editServer.module.css';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface CreateChannelPopupProps {
  userId: User['userId'];
  categoryId: Category['categoryId'] | null;
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
    const [parentName, setParentName] = useState<Channel['name']>(
      createDefault.channel().name,
    );
    const [channelName, setChannelName] = useState<Channel['name']>(
      createDefault.channel().name,
    );

    // Variables
    const { categoryId, serverId } = initialData;
    const isRoot = !categoryId;

    // Handlers
    const handleCreateChannel = (
      channel: Partial<Channel>,
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.createChannel({ channel, serverId });
    };

    const handleChannelUpdate = (data: Channel | null) => {
      if (!data) data = createDefault.channel();
      setParentName(data.name);
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!categoryId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.channel({
            channelId: categoryId,
          }),
        ]).then(([channel]) => {
          handleChannelUpdate(channel);
        });
      };
      refresh();
    }, [categoryId]);

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          <div className={setting['body']}>
            <div className={popup['inputGroup']}>
              <div className={popup['inputBox']}>
                <div className={popup['label']}>{lang.tr.parentChannel}</div>
                <label>{parentName || lang.tr.none}</label>
              </div>
              <div className={popup['inputBox']}>
                <div className={popup['label']}>{lang.tr.channelName}</div>
                <input
                  className={popup['input']}
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={`${popup['button']} ${
              !channelName.trim() ? popup['disabled'] : ''
            }`}
            disabled={!channelName.trim()}
            onClick={() => {
              handleCreateChannel(
                {
                  name: channelName,
                  isRoot: isRoot,
                  categoryId: categoryId,
                },
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
