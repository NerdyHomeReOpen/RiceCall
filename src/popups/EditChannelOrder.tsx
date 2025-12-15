import React, { useEffect, useState, useRef, useMemo } from 'react';

// Types
import type { Channel, Category, Server, User } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import styles from '@/styles/editChannelOrder.module.css';
import serverPage from '@/styles/server.module.css';
import popup from '@/styles/popup.module.css';

// Services
import ipc from '@/services/ipc.service';

// Utils
import { handleOpenAlertDialog, handleOpenCreateChannel, handleOpenEditChannelName } from '@/utils/popup';
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
  const orderMapRef = useRef<Record<string, number>>(
    serverChannelsData.reduce(
      (acc, channel) => {
        acc[channel.channelId] = channel.order;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  // States
  const [serverChannels, setServerChannels] = useState<(Channel | Category)[]>(serverChannelsData.filter((c) => !c.isLobby));
  const [selectedChannel, setSelectedChannel] = useState<Channel | Category | null>(null);
  const [groupChannels, setGroupChannels] = useState<(Channel | Category)[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Variables
  const { channelId: selectedChannelId, isLobby: isSelectedChannelLobby } = selectedChannel ?? Default.channel();
  const editedChannels = useMemo(() => {
    return serverChannels
      .filter((c) => !c.categoryId)
      .reduce(
        (acc, c, index) => {
          if (c.order !== index || c.order !== orderMapRef.current[c.channelId]) {
            acc.push({ order: index, channelId: c.channelId });
          }
          serverChannels
            .filter((sc) => sc.categoryId === c.channelId)
            .forEach((sc, sindex) => {
              if (sc.order !== sindex || sc.order !== orderMapRef.current[sc.channelId]) {
                acc.push({ order: sindex, channelId: sc.channelId });
              }
            });
          return acc;
        },
        [] as { order: number; channelId: string }[],
      );
  }, [serverChannels]);
  const currentIndex = groupChannels.findIndex((c) => c.channelId === selectedChannelId);
  const firstChannel = groupChannels[0];
  const lastChannel = groupChannels[groupChannels.length - 1];
  const isSelected = !!selectedChannel;
  const isFirst = firstChannel?.channelId === selectedChannelId;
  const isLast = lastChannel?.channelId === selectedChannelId;
  const canRename = isSelected && !isSelectedChannelLobby;
  const canDelete = isSelected && !isSelectedChannelLobby;
  const canMoveUp = isSelected && !isFirst && !isSelectedChannelLobby && currentIndex > 0;
  const canMoveDown = isSelected && !isLast && !isSelectedChannelLobby && currentIndex < groupChannels.length - 1;
  const canTop = isSelected && !isFirst && !isSelectedChannelLobby;
  const canBottom = isSelected && !isLast && !isSelectedChannelLobby;
  const canAdd = !isSelectedChannelLobby && !selectedChannel?.categoryId;
  const canSubmit = editedChannels.length > 0;

  // Handlers
  const handleEditChannels = (serverId: Server['serverId'], updates: Partial<Channel>[]) => {
    ipc.socket.send('editChannel', ...updates.map((update) => ({ serverId, channelId: update.channelId!, update })));
    ipc.window.close();
  };

  const handleDeleteChannel = (channelId: Channel['channelId'], serverId: Server['serverId']) => {
    handleOpenAlertDialog(t('confirm-delete-channel', { '0': selectedChannel?.name ?? '' }), () => {
      ipc.socket.send('deleteChannel', { serverId, channelId });
      setSelectedChannel(null);
    });
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

    for (const gc of newGroupChannels) {
      const index = newServerChannels.findIndex((sc) => sc.channelId === gc.channelId);
      if (index !== -1) {
        newServerChannels[index].order = gc.order;
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

  // Effects
  useEffect(() => {
    if (serverChannels.length === 0) return;
    setExpanded((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const sc of serverChannels) {
        if (next[sc.channelId] === undefined) next[sc.channelId] = true;
      }
      return next;
    });
  }, [serverChannels]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelAdd', (...args: { data: Channel }[]) => {
      const add = new Set(args.map((i) => `${i.data.channelId}`));
      setServerChannels((prev) => prev.filter((c) => !add.has(`${c.channelId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Channel> }[]) => {
      const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
      setServerChannels((prev) => prev.map((c) => (update.has(`${c.channelId}`) ? { ...c, ...update.get(`${c.channelId}`) } : c)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelRemove', (...args: { channelId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.channelId}`));
      setServerChannels((prev) => prev.filter((c) => !remove.has(`${c.channelId}`)));
    });
    return () => unsub();
  }, []);

  const categoryTab = (category: Category) => {
    const { channelId: categoryId, name: categoryName, visibility: categoryVisibility, isLobby: isCategoryLobby, order: categoryOrder } = category;
    const subChannels = serverChannels?.filter((c) => c.categoryId === categoryId);
    const isSelected = selectedChannelId === categoryId;

    return (
      <div key={categoryId}>
        <div
          className={`${serverPage['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedChannel(selectedChannelId === categoryId ? null : category);
            setGroupChannels(serverChannels.filter((sc) => !sc.categoryId).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)));
          }}
        >
          <div
            className={`${serverPage['tab-icon']} ${expanded[categoryId] ? serverPage['expanded'] : ''} ${serverPage[categoryVisibility]} ${isCategoryLobby ? serverPage['lobby'] : ''}`}
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
            .filter((sc) => sc.type === 'channel')
            .map((sc) => channelTab(sc))}
        </div>
      </div>
    );
  };

  const channelTab = (channel: Channel) => {
    const { channelId, name: channelName, visibility: channelVisibility, isLobby: isChannelLobby, order: channelOrder, categoryId: channelCategoryId } = channel;
    const isSelected = selectedChannelId === channelId;

    return (
      <div
        key={channelId}
        className={`${serverPage['channel-tab']} ${isSelected ? styles['selected'] : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedChannel(selectedChannelId === channelId ? null : channel);
          setGroupChannels(serverChannels.filter((sc) => sc.categoryId === channelCategoryId).sort((a, b) => (a.order !== b.order ? a.order - b.order : a.createdAt - b.createdAt)));
        }}
      >
        <div className={`${serverPage['tab-icon']} ${serverPage[channelVisibility]} ${isChannelLobby ? serverPage['lobby'] : ''}`} onClick={(e) => e.stopPropagation()} />
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
              .filter((sc) => !sc.categoryId)
              .map((sc) => (sc.type === 'category' ? categoryTab(sc) : channelTab(sc)))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={`${popup['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={() => (canSubmit ? handleEditChannels(serverId, editedChannels) : null)}>
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
