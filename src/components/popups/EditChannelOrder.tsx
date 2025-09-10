import React, { useEffect, useState, useRef, useMemo } from 'react';

// Types
import type { Channel, Category, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import styles from '@/styles/popups/editChannelOrder.module.css';
import serverPage from '@/styles/pages/server.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

// Utils
import Default from '@/utils/default';

interface EditChannelOrderPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  serverChannels: Channel[];
}

const EditChannelOrderPopup: React.FC<EditChannelOrderPopupProps> = React.memo(({ userId, serverId, serverChannels: serverChannelsData }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const orderMap = useRef<Record<string, number>>(
    serverChannelsData.reduce(
      (acc, channel) => {
        acc[channel.channelId] = channel.order;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  // States
  const [serverChannels, setServerChannels] = useState<(Channel | Category)[]>(serverChannelsData);
  const [selectedChannel, setSelectedChannel] = useState<Channel | Category | null>(null);
  const [groupChannels, setGroupChannels] = useState<(Channel | Category)[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Destructuring
  const { channelId: selectedChannelId, isLobby: selectedChannelIsLobby } = selectedChannel ?? Default.channel();

  // Memos
  const editedChannels = useMemo(() => {
    const editedChannels: Partial<Channel>[] = [];
    serverChannels
      .filter((c) => !c.categoryId)
      .forEach((c, index) => {
        if (c.order !== index || c.order !== orderMap.current[c.channelId]) {
          editedChannels.push({ order: index, channelId: c.channelId });
        }
        serverChannels
          .filter((sc) => sc.categoryId === c.channelId)
          .forEach((sc, sindex) => {
            if (sc.order !== sindex || sc.order !== orderMap.current[sc.channelId]) {
              editedChannels.push({ order: sindex, channelId: sc.channelId });
            }
          });
      });
    return editedChannels;
  }, [serverChannels]);
  const currentIndex = useMemo(() => groupChannels.findIndex((c) => c.channelId === selectedChannelId), [groupChannels, selectedChannelId]);
  const firstChannel = useMemo(() => groupChannels[0], [groupChannels]);
  const lastChannel = useMemo(() => groupChannels[groupChannels.length - 1], [groupChannels]);
  const isSelected = useMemo(() => !!selectedChannel, [selectedChannel]);
  const isFirst = useMemo(() => firstChannel?.channelId === selectedChannelId, [firstChannel, selectedChannelId]);
  const isLast = useMemo(() => lastChannel?.channelId === selectedChannelId, [lastChannel, selectedChannelId]);
  const canRename = useMemo(() => isSelected && !selectedChannelIsLobby, [isSelected, selectedChannelIsLobby]);
  const canDelete = useMemo(() => isSelected && !selectedChannelIsLobby, [isSelected, selectedChannelIsLobby]);
  const canMoveUp = useMemo(() => isSelected && !isFirst && !selectedChannelIsLobby && currentIndex > 0, [isSelected, isFirst, selectedChannelIsLobby, currentIndex]);
  const canMoveDown = useMemo(
    () => isSelected && !isLast && !selectedChannelIsLobby && currentIndex < groupChannels.length - 1,
    [isSelected, isLast, selectedChannelIsLobby, currentIndex, groupChannels],
  );
  const canTop = useMemo(() => isSelected && !isFirst && !selectedChannelIsLobby, [isSelected, isFirst, selectedChannelIsLobby]);
  const canBottom = useMemo(() => isSelected && !isLast && !selectedChannelIsLobby, [isSelected, isLast, selectedChannelIsLobby]);
  const canAdd = useMemo(() => !selectedChannelIsLobby && !selectedChannel?.categoryId, [selectedChannelIsLobby, selectedChannel]);
  const canSubmit = useMemo(() => editedChannels.length > 0, [editedChannels]);

  // Handlers
  const handleEditChannels = (serverId: Server['serverId'], updates: Partial<Channel>[]) => {
    ipc.socket.send('editChannel', ...updates.map((update) => ({ serverId, channelId: update.channelId!, update })));
  };

  const handleDeleteChannel = (channelId: Channel['channelId'], serverId: Server['serverId']) => {
    handleOpenAlertDialog(t('confirm-delete-channel', { '0': selectedChannel?.name ?? '' }), () => {
      ipc.socket.send('deleteChannel', { serverId, channelId });
      setSelectedChannel(null);
    });
  };

  const handleOpenCreateChannel = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.popup.open('createChannel', 'createChannel', { userId, serverId, channelId });
  };

  const handleOpenEditChannelName = (userId: User['userId'], serverId: Server['serverId'], channelId: Channel['channelId']) => {
    ipc.popup.open('editChannelName', 'editChannelName', { userId, serverId, channelId, channelName: selectedChannel?.name ?? '' });
  };

  const handleOpenAlertDialog = (message: string, callback: () => void) => {
    ipc.popup.open('dialogAlert', 'dialogAlert', { message, submitTo: 'dialogAlert' });
    ipc.popup.onSubmit('dialogAlert', callback);
  };

  const handleClose = () => {
    ipc.window.close();
  };

  const handleChangeOrder = (currentIndex: number, targetIndex: number) => {
    if (currentIndex === targetIndex) return;
    if (currentIndex < 0 || currentIndex > groupChannels.length - 1) return;
    if (targetIndex < 0 || targetIndex > groupChannels.length - 1) return;

    const newServerChannels = [...serverChannels];
    const newGroupChannels = [...groupChannels];

    if (currentIndex < targetIndex) {
      for (let i = currentIndex; i < targetIndex; i++) {
        const temp = newGroupChannels[currentIndex].order;
        newGroupChannels[currentIndex].order = newGroupChannels[i + 1].order;
        newGroupChannels[i + 1].order = temp;
      }
    } else {
      for (let i = currentIndex; i > targetIndex; i--) {
        const temp = newGroupChannels[currentIndex].order;
        newGroupChannels[currentIndex].order = newGroupChannels[i - 1].order;
        newGroupChannels[i - 1].order = temp;
      }
    }

    for (const ch of newGroupChannels) {
      const index = newServerChannels.findIndex((sch) => sch.channelId === ch.channelId);
      if (index !== -1) {
        newServerChannels[index].order = ch.order;
      }
    }
    setServerChannels(newServerChannels.sort((a, b) => a.order - b.order));
    setGroupChannels(newGroupChannels.sort((a, b) => a.order - b.order));
  };

  const handleUnselect = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(`.${serverPage['channel-tab']}`) || target.closest('[class*="Btn"]')) {
      return;
    }
    setSelectedChannel(null);
  };

  const handleServerChannelAdd = (...args: { data: Channel }[]) => {
    setServerChannels((prev) => [...prev, ...args.map((i) => i.data)]);
  };

  const handleServerChannelUpdate = (...args: { channelId: string; update: Partial<Channel> }[]) => {
    const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
    setServerChannels((prev) => prev.map((c) => (update.has(`${c.channelId}`) ? { ...c, ...update.get(`${c.channelId}`) } : c)));
  };

  const handleServerChannelRemove = (...args: { channelId: string }[]) => {
    const remove = new Set(args.map((i) => `${i.channelId}`));
    setServerChannels((prev) => prev.filter((c) => !remove.has(`${c.channelId}`)));
  };

  // Effects
  useEffect(() => {
    if (serverChannels.length === 0) return;
    setExpanded((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const ch of serverChannels) {
        if (next[ch.channelId] === undefined) next[ch.channelId] = true;
      }
      return next;
    });
  }, [serverChannels]);

  useEffect(() => {
    const unsubscribe = [
      ipc.socket.on('serverChannelAdd', handleServerChannelAdd),
      ipc.socket.on('serverChannelUpdate', handleServerChannelUpdate),
      ipc.socket.on('serverChannelRemove', handleServerChannelRemove),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, []);

  const categoryTab = (category: Category) => {
    const { channelId: categoryId, name: categoryName, visibility: categoryVisibility, isLobby: categoryIsLobby, order: categoryOrder } = category;
    const subChannels = serverChannels?.filter((c) => c.categoryId === categoryId);
    const isSelected = selectedChannelId === categoryId;

    return (
      <div key={categoryId}>
        <div
          className={`${serverPage['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedChannel(selectedChannelId === categoryId ? null : category);
            setGroupChannels(serverChannels.filter((ch) => !ch.categoryId).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)));
          }}
        >
          <div
            className={`${serverPage['tab-icon']} ${expanded[categoryId] ? serverPage['expanded'] : ''} ${serverPage[categoryVisibility]} ${categoryIsLobby ? serverPage['lobby'] : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
            }}
          />
          <div className={serverPage['channel-tab-lable']} style={{ display: 'inline-flex' }}>
            {categoryName}
            <div className={styles['channel-tab-index-text']}>{`(${categoryOrder})`}</div>
          </div>
        </div>
        <div className={serverPage['channel-list']} style={expanded[categoryId] ? {} : { display: 'none' }}>
          {subChannels
            .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt))
            .filter((ch) => ch.type === 'channel')
            .map((channel) => channelTab(channel))}
        </div>
      </div>
    );
  };

  const channelTab = (channel: Channel) => {
    const { channelId, name: channelName, visibility: channelVisibility, isLobby: channelIsLobby, order: channelOrder, categoryId: channelCategoryId } = channel;
    const isSelected = selectedChannelId === channelId;

    return (
      <div
        key={channelId}
        className={`${serverPage['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedChannel(selectedChannelId === channelId ? null : channel);
          setGroupChannels(serverChannels.filter((ch) => ch.categoryId === channelCategoryId).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)));
        }}
      >
        <div className={`${serverPage['tab-icon']} ${serverPage[channelVisibility]} ${channelIsLobby ? serverPage['lobby'] : ''}`} onClick={(e) => e.stopPropagation()} />
        <div className={serverPage['channel-tab-lable']} style={{ display: 'inline-flex' }}>
          {channelName}
          <div className={styles['channel-tab-index-text']}>{`(${channelOrder})`}</div>
        </div>
      </div>
    );
  };

  return (
    <div className={popup['popup-wrapper']}>
      {/* Header */}
      <div className={styles['header']} onClick={handleUnselect}>
        <div
          className={`${styles['add-channel-btn']} ${!canAdd ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenCreateChannel(userId, serverId, selectedChannelId);
          }}
        >
          {t('create')}
        </div>
        <div
          className={`${styles['change-channel-name-btn']} ${!canRename ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenEditChannelName(userId, serverId, selectedChannelId);
          }}
        >
          {t('change-name')}
        </div>
        <div
          className={`${styles['delete-channel-btn']} ${!canDelete ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteChannel(selectedChannel!.channelId, serverId);
          }}
        >
          {t('delete')}
        </div>
        <div
          className={`${styles['up-channel-order-btn']} ${!canMoveUp ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleChangeOrder(currentIndex, currentIndex - 1);
          }}
        >
          {t('move-up')}
        </div>
        <div
          className={`${styles['down-channel-order-btn']} ${!canMoveDown ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleChangeOrder(currentIndex, currentIndex + 1);
          }}
        >
          {t('move-down')}
        </div>
        <div
          className={`${styles['top-channel-order-btn']} ${!canTop ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleChangeOrder(currentIndex, 0);
          }}
        >
          {t('move-top')}
        </div>
        <div
          className={`${styles['bottom-channel-order-btn']} ${!canBottom ? 'disabled' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleChangeOrder(currentIndex, groupChannels.length - 1);
          }}
        >
          {t('move-bottom')}
        </div>
      </div>

      {/* Body */}
      <div className={popup['popup-body']} onClick={handleUnselect}>
        <div className={styles['body']}>
          <div className={serverPage['channel-list']} onClick={(e) => e.stopPropagation()}>
            {serverChannels
              .sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt))
              .filter((ch) => !ch.categoryId)
              .map((channel) => (channel.type === 'category' ? categoryTab(channel) : channelTab(channel)))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div
          className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`}
          onClick={() => {
            handleEditChannels(serverId, editedChannels);
            handleClose();
          }}
        >
          {t('confirm')}
        </div>
        <div className={popup['button']} onClick={handleClose}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditChannelOrderPopup.displayName = 'EditChannelOrderPopup';

export default EditChannelOrderPopup;
