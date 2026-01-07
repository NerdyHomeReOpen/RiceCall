import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import type * as Types from '@/types';

import * as Popup from '@/utils/popup';
import * as Default from '@/utils/default';

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

  // Selectors
  const user = useAppSelector((state) => state.user.data);

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

  // States
  const [channels, setChannels] = useState<(Types.Channel | Types.Category)[]>(channelsData.filter((c) => !c.isLobby));
  const [selectedChannel, setSelectedChannel] = useState<Types.Channel | Types.Category | null>(null);
  const [categoryChildren, setCategoryChildren] = useState<(Types.Channel | Types.Category)[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Variables
  const { userId } = user;
  const { channelId: selectedChannelId, isLobby: isSelectedChannelLobby } = selectedChannel ?? Default.channel();
  const currentIndex = categoryChildren.findIndex((c) => c.channelId === selectedChannelId);
  const firstChannel = categoryChildren[0];
  const lastChannel = categoryChildren[categoryChildren.length - 1];
  const isSelected = !!selectedChannel;
  const isFirst = firstChannel?.channelId === selectedChannelId;
  const isLast = lastChannel?.channelId === selectedChannelId;
  const canRename = isSelected && !isSelectedChannelLobby;
  const canDelete = isSelected && !isSelectedChannelLobby;
  const canMoveUp = isSelected && !isFirst && !isSelectedChannelLobby && currentIndex > 0;
  const canMoveDown = isSelected && !isLast && !isSelectedChannelLobby && currentIndex < categoryChildren.length - 1;
  const canTop = isSelected && !isFirst && !isSelectedChannelLobby;
  const canBottom = isSelected && !isLast && !isSelectedChannelLobby;
  const canAdd = !isSelectedChannelLobby && !selectedChannel?.categoryId;
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
    setChannels(newChannels.sort((a, b) => a.order - b.order));
    setCategoryChildren(newCategoryChildren.sort((a, b) => a.order - b.order));
  };

  // Handlers
  const handleAddChannelBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Popup.openCreateChannel(userId, serverId, selectedChannelId);
  };

  const handleChangeChannelNameBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Popup.openEditChannelName(userId, serverId, selectedChannelId);
  };

  const handleDeleteChannelBtnClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Popup.deleteChannel(userId, serverId, selectedChannelId);
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
    if (channels.length === 0) return;
    setExpanded((prev) => {
      const next: Record<string, boolean> = { ...prev };
      for (const channel of channels) {
        if (next[channel.channelId] === undefined) next[channel.channelId] = true;
      }
      return next;
    });
  }, [channels]);

  useEffect(() => {
    const onClick = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`.${serverPage['channel-tab']}`) || target.closest('[class*="Btn"]')) return;
      setSelectedChannel(null);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelAdd', (...args: { data: Types.Channel }[]) => {
      const add = new Set(args.map((i) => `${i.data.channelId}`));
      setChannels((prev) => prev.filter((c) => !add.has(`${c.channelId}`)).concat(args.map((i) => i.data)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Types.Channel> }[]) => {
      const update = new Map(args.map((i) => [`${i.channelId}`, i.update] as const));
      setChannels((prev) => prev.map((c) => (update.has(`${c.channelId}`) ? { ...c, ...update.get(`${c.channelId}`) } : c)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('channelRemove', (...args: { channelId: string }[]) => {
      const remove = new Set(args.map((i) => `${i.channelId}`));
      setChannels((prev) => prev.filter((c) => !remove.has(`${c.channelId}`)));
    });
    return () => unsub();
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
              c.type === 'category' ? (
                <CategoryTab
                  key={c.channelId}
                  category={c}
                  selectedChannel={selectedChannel}
                  setSelectedChannel={setSelectedChannel}
                  channels={channels}
                  setCategoryChildren={setCategoryChildren}
                  expanded={expanded}
                  setExpanded={setExpanded}
                />
              ) : (
                <ChannelTab key={c.channelId} channel={c} selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel} channels={channels} setCategoryChildren={setCategoryChildren} />
              ),
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
  channels: (Types.Channel | Types.Category)[];
  setCategoryChildren: React.Dispatch<React.SetStateAction<(Types.Channel | Types.Category)[]>>;
  selectedChannel: Types.Channel | Types.Category | null;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Types.Channel | Types.Category | null>>;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const CategoryTab: React.FC<CategoryTabProps> = React.memo(({ category, channels, selectedChannel, setSelectedChannel, setCategoryChildren, expanded, setExpanded }) => {
  // Variables
  const { channelId: categoryId, name: categoryName, visibility: categoryVisibility, isLobby: isCategoryLobby, order: categoryOrder } = category;
  const categoryChildren = channels?.filter((c) => c.categoryId === categoryId);
  const isSelected = selectedChannel?.channelId === categoryId;

  // Handlers
  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChannel(selectedChannel?.channelId === categoryId ? null : category);
    setCategoryChildren(categoryChildren.sort((a, b) => a.order - b.order));
  };

  const handleTabExpandedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <div key={categoryId}>
      <div className={`${serverPage['channel-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
        <div
          className={`${serverPage['tab-icon']} ${expanded[categoryId] ? serverPage['expanded'] : ''} ${serverPage[categoryVisibility]} ${isCategoryLobby ? serverPage['lobby'] : ''}`}
          onClick={handleTabExpandedClick}
        />
        <div className={serverPage['channel-tab-lable']} style={{ display: 'inline-flex' }}>
          {categoryName}
          <div className={styles['channel-tab-index-text']}>{`(${categoryOrder})`}</div>
        </div>
      </div>
      <div className={serverPage['channel-list']} style={expanded[categoryId] ? {} : { display: 'none' }}>
        {categoryChildren
          .sort((a, b) => a.order - b.order)
          .filter((c) => c.type === 'channel')
          .map((c) => (
            <ChannelTab key={c.channelId} channel={c} channels={channels} selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel} setCategoryChildren={setCategoryChildren} />
          ))}
      </div>
    </div>
  );
});

CategoryTab.displayName = 'CategoryTab';

interface ChannelTabProps {
  channel: Types.Channel;
  channels: (Types.Channel | Types.Category)[];
  setCategoryChildren: React.Dispatch<React.SetStateAction<(Types.Channel | Types.Category)[]>>;
  selectedChannel: Types.Channel | Types.Category | null;
  setSelectedChannel: React.Dispatch<React.SetStateAction<Types.Channel | Types.Category | null>>;
}

const ChannelTab: React.FC<ChannelTabProps> = React.memo(({ channel, channels, selectedChannel, setSelectedChannel, setCategoryChildren }) => {
  // Variables
  const { channelId, name: channelName, visibility: channelVisibility, isLobby: isChannelLobby, order: channelOrder, categoryId: channelCategoryId } = channel;
  const categoryChildren = channels?.filter((c) => c.categoryId === channelCategoryId);
  const isSelected = selectedChannel?.channelId === channelId;

  // Handlers
  const handleTabClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChannel(selectedChannel?.channelId === channelId ? null : channel);
    setCategoryChildren(categoryChildren.sort((a, b) => a.order - b.order));
  };

  return (
    <div key={channelId} className={`${serverPage['channel-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick}>
      <div className={`${serverPage['tab-icon']} ${serverPage[channelVisibility]} ${isChannelLobby ? serverPage['lobby'] : ''}`} />
      <div className={serverPage['channel-tab-lable']} style={{ display: 'inline-flex' }}>
        {channelName}
        <div className={styles['channel-tab-index-text']}>{`(${channelOrder})`}</div>
      </div>
    </div>
  );
});

ChannelTab.displayName = 'ChannelTab';
