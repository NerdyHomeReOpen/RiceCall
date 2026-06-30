import Image from 'next/image';
import React, { useEffect, useState, useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import { useTranslation } from 'react-i18next';

import * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { blockUser, editFriend, deleteFriend, openApplyFriend, deleteFriendApplication, openDirectMessage, openEditFriendNote, openUserInfo, unblockUser } from '@/services';

import { useContextMenu } from '@/providers/ContextMenu';
import { useLoading } from '@/providers/Loading';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import ContextMenu from '@/utils/contextMenu';
import { getDefaultFriendGroup } from '@/utils/default';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

import styles from './Friend.module.css';

interface FriendTabProps {
  friend: Types.Friend;
}

const FriendTab: React.FC<FriendTabProps> = React.memo(({ friend }) => {
  const { t } = useTranslation();
  const { showContextMenu } = useContextMenu();
  const { getIsLoading, loadServer } = useLoading();
  const dispatch = useAppDispatch();

  const userId = useAppSelector((state) => state.user.data.userId);
  const currentServerId = useAppSelector((state) => state.user.data.currentServerId);
  const friendGroups = useAppSelector((state) => state.friendGroups.data, shallowEqual);
  const isSelected = useAppSelector((state) => state.ui.selectedItemId === `friend-${friend.targetId}`);

  const [friendCurrentServer, setFriendCurrentServer] = useState<Types.Server | null>(null);

  const defaultFriendGroup = useMemo(() => getDefaultFriendGroup({ name: t('my-friends'), order: -1, userId }), [t, userId]);
  const isFriendSelf = friend.targetId === userId;
  const isFriendOnline = friend.status === 'online';
  const isFriendOffline = friend.status === 'offline';
  const isFriendPending = friend.relationStatus === Types.RelationStatus.Pending;
  const isFriendFriend = friend.relationStatus === Types.RelationStatus.Friend;
  const isFriendStranger = friend.relationStatus === Types.RelationStatus.Stranger;
  const friendHasVip = friend.vip > 0;
  const friendHasNote = !!friend.note;

  const handleServerNameClick = () => {
    if (getIsLoading() || !friendCurrentServer || currentServerId === friendCurrentServer.serverId) return;
    loadServer(friendCurrentServer.specialId || friendCurrentServer.displayId);
    ipc.socket.send('connectServer', { serverId: friendCurrentServer.serverId });
  };

  const handleTabClick = () => {
    if (isSelected) {
      dispatch(Store.setSelectedItemId(null));
    } else {
      dispatch(Store.setSelectedItemId(`friend-${friend.targetId}`));
    }
  };

  const handleTabDoubleClick = () => {
    openDirectMessage(userId, friend.targetId);
  };

  const handleTabContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { clientX: x, clientY: y } = e;

    const contextMenu = new ContextMenu()
      .addDirectMessageOption({ isTargetSelf: isFriendSelf }, () => {
        openDirectMessage(userId, friend.targetId);
      })
      .addViewProfileOption(() => {
        openUserInfo(userId, friend.targetId);
      })
      .addAddFriendOption({ isTargetSelf: isFriendSelf, isTargetFriend: isFriendFriend }, () => {
        openApplyFriend(userId, friend.targetId);
      })
      .addEditNoteOption({ isTargetSelf: isFriendSelf, isTargetFriend: isFriendFriend }, () => {
        openEditFriendNote(userId, friend.targetId);
      })
      .addSeparator()
      .addPermissionSettingOption({ isTargetSelf: isFriendSelf, isTargetFriend: isFriendFriend, onHideOrShowOnlineClick: () => {}, onNotifyFriendOnlineClick: () => {} }, () => {
        // TODO: Implement permission setting
      })
      .addEditFriendFriendGroupOption(
        { isTargetSelf: isFriendSelf, isTargetStranger: isFriendStranger, isTargetBlocked: friend.isBlocked },
        () => {},
        new ContextMenu()
          .addFriendGroupOption({ friendGroupId: friend.friendGroupId, friendGroups: [defaultFriendGroup, ...friendGroups] }, (friendGroupId) => {
            editFriend(friend.targetId, { friendGroupId });
          })
          .build(),
      )
      .addBlockUserOption({ isTargetSelf: isFriendSelf, isTargetBlocked: friend.isBlocked }, () => {
        if (friend.isBlocked) {
          unblockUser(friend.targetId, friend.name);
        } else {
          blockUser(friend.targetId, friend.name);
        }
      })
      .addDeleteFriendOption({ isTargetSelf: isFriendSelf, isTargetFriend: isFriendFriend }, () => {
        deleteFriend(friend.targetId, friend.name);
      })
      .addDeleteFriendApplicationOption({ isTargetSelf: isFriendSelf, isTargetPending: isFriendPending }, () => {
        deleteFriendApplication(friend.targetId);
      })
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  useEffect(() => {
    if (!friend.targetId || friend.isBlocked || !friend.shareCurrentServer || !friend.currentServerId || !isFriendFriend) {
      setFriendCurrentServer(null);
      return;
    }

    ipc.api.fetchServer({ userId: friend.targetId, serverId: friend.currentServerId }).then((server) => {
      if (server) setFriendCurrentServer(server);
    });
  }, [friend.targetId, friend.isBlocked, friend.shareCurrentServer, friend.currentServerId, isFriendFriend]);

  return (
    <div className={`${styles['friend-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick} onDoubleClick={handleTabDoubleClick} onContextMenu={handleTabContextMenu}>
      <div
        className={styles['friend-tab-avatar']}
        style={{ filter: isFriendFriend && !isFriendOffline && !friend.isBlocked ? '' : 'grayscale(100%)' }}
        datatype={isFriendFriend && !isFriendOnline && !isFriendOffline && !friend.isBlocked ? friend.status : ''}
      >
        <Image src={friend.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="friend_avatar" width={40} height={40} loading="lazy" draggable="false" />
      </div>
      <div className={styles['base-info']}>
        <div className={styles['detail-row']}>
          {friendHasVip && <div className={`vip-icon vip-${friend.vip}`} />}
          <div className={`${styles['friend-tab-name-text']} ${friendHasVip ? styles['vip'] : ''}`}>
            {friend.note || friend.name} {friendHasNote ? `(${friend.name})` : ''}
          </div>
          <LevelIcon level={friend.level} xp={friend.xp} requiredXp={friend.requiredXp} showTitle={false} />
          <BadgeList badges={JSON.parse(friend.badges)} position="left-bottom" direction="right-bottom" maxDisplay={5} />
        </div>
        {isFriendPending ? (
          <div className={styles['signature-text']}>{`(${t('pending')})`}</div>
        ) : friendCurrentServer ? (
          <div className={`${styles['detail-row']} ${styles['has-server']}`} onClick={handleServerNameClick}>
            <div className={styles['location-icon']} />
            <div className={styles['server-name-text']}>{friendCurrentServer.name}</div>
          </div>
        ) : (
          <div className={styles['signature-text']}>{friend.signature}</div>
        )}
      </div>
    </div>
  );
});

FriendTab.displayName = 'FriendTab';

export default FriendTab;
