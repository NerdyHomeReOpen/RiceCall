import React, { useEffect, useState, useRef, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { setSelectedItemId } from '@/store/slices/uiSlice';
import { setChannels } from '@/store/slices/channelsSlice';

import * as Popup from '@/utils/popup';

import styles from '@/styles/editChannelOrder.module.css';
import serverPage from '@/styles/server.module.css';
import popupStyles from '@/styles/popup.module.css';

interface EditChannelOrderPopupProps {
  serverId: Types.Server['serverId'];
  channels: Types.Channel[];
}

const EditChannelOrderPopup: React.FC<EditChannelOrderPopupProps> = React.memo(({ serverId, channels: channelsData }) => {
  // Hooks
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Refs
  const orderMapRef = useRef<Record<string, number>>(
    channelsData.reduce(
      (acc, channel) => {
        acc[channel.channelId] = channel.order;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
    }),
    shallowEqual,
  );
  const channels = useAppSelector((state) => state.channels.data, shallowEqual);

  // States
  const [selectedChannel, setSelectedChannel] = useState<Types.Channel | Types.Category | null>(null);
  const [categoryChildren, setCategoryChildren] = useState<(Types.Channel | Types.Category)[]>([]);

  // Variables
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
  const editedChannels = useMemo(() => {
    return channels
      .filter((c) => !c.categoryId)
      .reduce(
        (acc, c, index) => {
          if (c.order !== index || c.order !== orderMapRef.current[c.channelId]) {
            acc.push({ order: index, channelId: c.channelId });
          }
          channels
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
  }, [channels]);
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => c.categoryId === null).sort((a, b) => a.order - b.order);
  }, [channels]);
  const canSubmit = editedChannels.length > 0;

  // Functions
  const changeOrder = (currentIndex: number, targetIndex: number) => {
    if (currentIndex === targetIndex) return;
    if (currentIndex < 0 || currentIndex > categoryChildren.length - 1) return;
    if (targetIndex < 0 || targetIndex > categoryChildren.length - 1) return;

    const newChannels = [...channels];
    const newCategoryChildren = [...categoryChildren];

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
        newChannels[index].order = child.order;
      }
    }
    dispatch(setChannels(newChannels.sort((a, b) => a.order - b.order)));
    setCategoryChildren(newCategoryChildren.sort((a, b) => a.order - b.order));
  };

  // Handlers
  const handleAddChannelBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Popup.openCreateChannel(user.userId, serverId, selectedChannel?.channelId ?? '');
  };

  const handleChangeChannelNameBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Popup.openEditChannelName(user.userId, serverId, selectedChannel?.channelId ?? '');
  };

  const handleDeleteChannelBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Popup.deleteChannel(user.userId, serverId, selectedChannel?.channelId ?? '');
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
    setCategoryChildren(channels.filter((c) => c.categoryId === channel.channelId));
  };

  const handleConfirmBtnClick = () => {
    if (!canSubmit) return;
    Popup.editChannels(serverId, editedChannels);
    ipc.window.close();
  };

  const handleCloseBtnClick = () => {
    ipc.window.close();
  };

  // Effects
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`.${serverPage['channel-tab']}`) || target.closest('[class*="Btn"]')) return;
      setSelectedChannel(null);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  return (
    <div className={popupStyles['popup-wrapper']}>
      <div className={styles['header']}>
        <div className={`${styles['add-channel-btn']} ${!canAdd ? 'disabled' : ''}`} onClick={handleAddChannelBtnClick}>
          {t('create')}
        </div>
        <div className={`${styles['change-channel-name-btn']} ${!canRename ? 'disabled' : ''}`} onClick={handleChangeChannelNameBtnClick}>
          {t('change-name')}
        </div>
        <div className={`${styles['delete-channel-btn']} ${!canDelete ? 'disabled' : ''}`} onClick={handleDeleteChannelBtnClick}>
          {t('delete')}
        </div>
        <div className={`${styles['up-channel-order-btn']} ${!canMoveUp ? 'disabled' : ''}`} onClick={handleMoveUpBtnClick}>
          {t('move-up')}
        </div>
        <div className={`${styles['down-channel-order-btn']} ${!canMoveDown ? 'disabled' : ''}`} onClick={handleMoveDownBtnClick}>
          {t('move-down')}
        </div>
        <div className={`${styles['top-channel-order-btn']} ${!canTop ? 'disabled' : ''}`} onClick={handleTopBtnClick}>
          {t('move-top')}
        </div>
        <div className={`${styles['bottom-channel-order-btn']} ${!canBottom ? 'disabled' : ''}`} onClick={handleBottomBtnClick}>
          {t('move-bottom')}
        </div>
      </div>
      <div className={popupStyles['popup-body']}>
        <div className={styles['body']}>
          <div className={serverPage['channel-list']} onClick={(e) => e.stopPropagation()}>
            {filteredChannels.map((c) =>
              c.type === 'category' ? <CategoryTab key={c.channelId} category={c} onSelect={handleSelect} /> : <ChannelTab key={c.channelId} channel={c} onSelect={handleSelect} />,
            )}
          </div>
        </div>
      </div>
      <div className={popupStyles['popup-footer']}>
        <div className={`${popupStyles['button']} ${!canSubmit ? 'disabled' : ''}`} onClick={handleConfirmBtnClick}>
          {t('confirm')}
        </div>
        <div className={popupStyles['button']} onClick={handleCloseBtnClick}>
          {t('cancel')}
        </div>
      </div>
    </div>
  );
});

EditChannelOrderPopup.displayName = 'EditChannelOrderPopup';

export default EditChannelOrderPopup;

interface CategoryTabProps {
  category: Types.Category;
  onSelect: (channel: Types.Channel | Types.Category) => void;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ category, onSelect }) => {
  // Hooks
  const dispatch = useAppDispatch();

  // Selectors
  const channels = useAppSelector((state) => state.channels.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `category-${category.channelId}`, shallowEqual);

  // States
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Variables
  const categoryChildren = channels?.filter((c) => c.categoryId === category.channelId);

  // Handlers
  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`category-${category.channelId}`));
    onSelect(category);
  };

  const handleTabExpandedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div key={category.channelId}>
      <div className={`${serverPage['channel-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
        <div
          className={`${serverPage['tab-icon']} ${isExpanded ? serverPage['expanded'] : ''} ${serverPage[category.visibility]} ${category.isLobby ? serverPage['lobby'] : ''}`}
          onClick={handleTabExpandedClick}
        />
        <div className={serverPage['channel-tab-lable']} style={{ display: 'inline-flex' }}>
          {category.name}
          <div className={styles['channel-tab-index-text']}>{`(${category.order})`}</div>
        </div>
      </div>
      <div className={serverPage['channel-list']} style={isExpanded ? {} : { display: 'none' }}>
        {categoryChildren
          .sort((a, b) => a.order - b.order)
          .filter((c) => c.type === 'channel')
          .map((c) => (
            <ChannelTab key={c.channelId} channel={c} onSelect={onSelect} />
          ))}
      </div>
    </div>
  );
});

CategoryTab.displayName = 'CategoryTab';

interface ChannelTabProps {
  channel: Types.Channel;
  onSelect: (channel: Types.Channel) => void;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel, onSelect }) => {
  // Hooks
  const dispatch = useAppDispatch();

  // Selectors
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `channel-${channel.channelId}`, shallowEqual);

  // States
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Handlers
  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) dispatch(setSelectedItemId(null));
    else dispatch(setSelectedItemId(`channel-${channel.channelId}`));
    onSelect(channel);
  };

  const handleTabExpandedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${serverPage['channel-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
      <div
        className={`${serverPage['tab-icon']} ${isExpanded ? serverPage['expanded'] : ''} ${serverPage[channel.visibility]} ${channel.isLobby ? serverPage['lobby'] : ''}`}
        onClick={handleTabExpandedClick}
      />
      <div className={serverPage['channel-tab-lable']} style={{ display: 'inline-flex' }}>
        {channel.name}
        <div className={styles['channel-tab-index-text']}>{`(${channel.order})`}</div>
      </div>
    </div>
  );
});

ChannelTab.displayName = 'ChannelTab';
