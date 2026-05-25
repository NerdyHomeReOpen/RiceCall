import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import { openCreateChannel, openEditChannelName, deleteChannel, editChannels } from '@/services';

import { useAppSelector } from '@/hooks/useStore';

import CategoryTab from './CategoryTab';
import ChannelTab from './ChannelTab';

import styles from './EditChannelOrder.module.css';

interface EditChannelOrderPopupProps {
  id: string;
  serverId: Types.Server['serverId'];
}

const EditChannelOrderPopup: React.FC<EditChannelOrderPopupProps> = React.memo(({ id, serverId }) => {
  const { t } = useTranslation();

  const userId = useAppSelector((state) => state.user.data.userId);
  const channelsData = useAppSelector((state) => state.channels.data.filter((c) => !c.isLobby));

  const channelOrderMapRef = useRef<Record<string, number>>(
    channelsData.reduce(
      (acc, channel) => {
        acc[channel.channelId] = channel.order;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  const [channels, setChannels] = useState<(Types.Channel | Types.Category)[]>(channelsData);
  const [selectedChannel, setSelectedChannel] = useState<Types.Channel | Types.Category | null>(null);
  const [categoryChildren, setCategoryChildren] = useState<(Types.Channel | Types.Category)[]>([]);

  const editedChannels = useMemo(() => {
    return channels
      .filter((c) => !c.categoryId && !c.isLobby)
      .sort((a, b) => a.order - b.order)
      .reduce(
        (acc, c, index) => {
          if (c.order !== index || c.order !== channelOrderMapRef.current[c.channelId]) {
            acc.push({ order: index, channelId: c.channelId });
          }
          channels
            .filter((sc) => sc.categoryId === c.channelId)
            .sort((a, b) => a.order - b.order)
            .forEach((sc, sindex) => {
              if (sc.order !== sindex || sc.order !== channelOrderMapRef.current[sc.channelId]) {
                acc.push({ order: sindex, channelId: sc.channelId });
              }
            });
          return acc;
        },
        [] as { order: number; channelId: string }[],
      );
  }, [channels]);

  const sortedChannels = channels.filter((c) => c.categoryId === null && !c.isLobby).sort((a, b) => a.order - b.order);
  const currentIndex = categoryChildren.findIndex((c) => c.channelId === selectedChannel?.channelId);
  const firstChannel = categoryChildren[0];
  const lastChannel = categoryChildren[categoryChildren.length - 1];
  const isSelected = !!selectedChannel;
  const isFirst = firstChannel?.channelId === selectedChannel?.channelId;
  const isLast = lastChannel?.channelId === selectedChannel?.channelId;
  const canRename = isSelected && !selectedChannel?.isLobby;
  const canDelete = isSelected && !selectedChannel?.isLobby;
  const canMoveUp = isSelected && !isFirst && !selectedChannel?.isLobby && currentIndex > 0;
  const canMoveDown = isSelected && !isLast && !selectedChannel?.isLobby && currentIndex < categoryChildren.length - 1;
  const canTop = isSelected && !isFirst && !selectedChannel?.isLobby;
  const canBottom = isSelected && !isLast && !selectedChannel?.isLobby;
  const canAdd = !selectedChannel?.isLobby && !selectedChannel?.categoryId;
  const canSubmit = editedChannels.length > 0;

  const changeOrder = (currentIndex: number, targetIndex: number) => {
    if (currentIndex === targetIndex) return;
    if (currentIndex < 0 || currentIndex > categoryChildren.length - 1) return;
    if (targetIndex < 0 || targetIndex > categoryChildren.length - 1) return;

    const newChannels = [...channels];
    const newCategoryChildren = categoryChildren.map((c) => ({ ...c }));

    if (currentIndex < targetIndex) {
      for (let i = currentIndex; i < targetIndex; i++) {
        const temp = newCategoryChildren[currentIndex].order;
        newCategoryChildren[currentIndex].order = newCategoryChildren[i + 1].order;
        newCategoryChildren[i + 1].order = temp;
      }
    } else {
      for (let i = currentIndex; i > targetIndex; i--) {
        const temp = newCategoryChildren[currentIndex].order;
        newCategoryChildren[currentIndex].order = newCategoryChildren[i - 1].order;
        newCategoryChildren[i - 1].order = temp;
      }
    }

    for (const child of newCategoryChildren) {
      const index = newChannels.findIndex((c) => c.channelId === child.channelId);
      if (index !== -1) {
        newChannels[index] = { ...newChannels[index], order: child.order };
      }
    }
    setChannels(newChannels.sort((a, b) => a.order - b.order));
    setCategoryChildren(newCategoryChildren.sort((a, b) => a.order - b.order));
  };

  const handleAddChannelBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openCreateChannel(userId, serverId, selectedChannel?.channelId);
  };

  const handleChangeChannelNameBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditChannelName(userId, serverId, selectedChannel?.channelId ?? '');
  };

  const handleDeleteChannelBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChannel(serverId, selectedChannel?.channelId ?? '', selectedChannel?.name ?? '');
  };

  const handleMoveUpBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    changeOrder(currentIndex, currentIndex - 1);
  };

  const handleMoveDownBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    changeOrder(currentIndex, currentIndex + 1);
  };

  const handleTopBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    changeOrder(currentIndex, 0);
  };

  const handleBottomBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    changeOrder(currentIndex, categoryChildren.length - 1);
  };

  const handleSelect = (channel: Types.Channel | Types.Category) => {
    setSelectedChannel(channel);
    setCategoryChildren(channels.filter((c) => c.categoryId === channel.categoryId && !c.isLobby).sort((a, b) => a.order - b.order));
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    editChannels(serverId, editedChannels);
    ipc.popup.close(id);
  };

  const handleCloseBtnClick = () => {
    ipc.popup.close(id);
  };

  return (
    <div className="popup-wrapper">
      <div className={styles['edit-channel-order-header']}>
        <div className={`${styles['add-channel-button']} ${!canAdd ? 'disabled' : ''}`} onClick={handleAddChannelBtnClick}>
          {t('create')}
        </div>
        <div className={`${styles['change-channel-name-button']} ${!canRename ? 'disabled' : ''}`} onClick={handleChangeChannelNameBtnClick}>
          {t('change-name')}
        </div>
        <div className={`${styles['delete-channel-button']} ${!canDelete ? 'disabled' : ''}`} onClick={handleDeleteChannelBtnClick}>
          {t('delete')}
        </div>
        <div className={`${styles['up-channel-order-button']} ${!canMoveUp ? 'disabled' : ''}`} onClick={handleMoveUpBtnClick}>
          {t('move-up')}
        </div>
        <div className={`${styles['down-channel-order-button']} ${!canMoveDown ? 'disabled' : ''}`} onClick={handleMoveDownBtnClick}>
          {t('move-down')}
        </div>
        <div className={`${styles['top-channel-order-button']} ${!canTop ? 'disabled' : ''}`} onClick={handleTopBtnClick}>
          {t('move-top')}
        </div>
        <div className={`${styles['bottom-channel-order-button']} ${!canBottom ? 'disabled' : ''}`} onClick={handleBottomBtnClick}>
          {t('move-bottom')}
        </div>
      </div>
      <div className="popup-body">
        <div className={styles['edit-channel-order-body']}>
          <div className={styles['channel-list']} onClick={(e) => e.stopPropagation()}>
            {sortedChannels.map((c) =>
              c.type === 'category' ? <CategoryTab key={c.channelId} channels={channels} category={c} onSelect={handleSelect} /> : <ChannelTab key={c.channelId} channel={c} onSelect={handleSelect} />,
            )}
          </div>
        </div>
      </div>
      <div className="popup-footer">
        <div className={`button ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className="button" onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditChannelOrderPopup.displayName = 'EditChannelOrderPopup';

export default EditChannelOrderPopup;
