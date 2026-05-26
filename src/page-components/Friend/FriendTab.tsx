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
  const friendIsSelf = friend.targetId === userId;
  const friendIsOnline = friend.status === 'online';
  const friendIsOffline = friend.status === 'offline';
  const friendIsPending = friend.relationStatus === Types.RelationStatus.Pending;
  const friendIsFriend = friend.relationStatus === Types.RelationStatus.Friend;
  const friendIsStranger = friend.relationStatus === Types.RelationStatus.Stranger;
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
      .addDirectMessageOption({ targetIsSelf: friendIsSelf }, () => {
        openDirectMessage(userId, friend.targetId);
      })
      .addViewProfileOption(() => {
        openUserInfo(userId, friend.targetId);
      })
      .addAddFriendOption({ targetIsSelf: friendIsSelf, targetIsFriend: friendIsFriend }, () => {
        openApplyFriend(userId, friend.targetId);
      })
      .addEditNoteOption({ targetIsSelf: friendIsSelf, targetIsFriend: friendIsFriend }, () => {
        openEditFriendNote(userId, friend.targetId);
      })
      .addSeparator()
      .addPermissionSettingOption({ targetIsSelf: friendIsSelf, targetIsFriend: friendIsFriend, onHideOrShowOnlineClick: () => {}, onNotifyFriendOnlineClick: () => {} }, () => {
        // TODO: Implement permission setting
      })
      .addEditFriendFriendGroupOption(
        { targetIsSelf: friendIsSelf, targetIsStranger: friendIsStranger, targetIsBlocked: friend.isBlocked },
        () => {},
        new ContextMenu()
          .addFriendGroupOption({ friendGroupId: friend.friendGroupId, friendGroups: [defaultFriendGroup, ...friendGroups] }, (friendGroupId) => {
            editFriend(friend.targetId, { friendGroupId });
          })
          .build(),
      )
      .addBlockUserOption({ targetIsSelf: friendIsSelf, targetIsBlocked: friend.isBlocked }, () => {
        if (friend.isBlocked) {
          unblockUser(friend.targetId, friend.name);
        } else {
          blockUser(friend.targetId, friend.name);
        }
      })
      .addDeleteFriendOption({ targetIsSelf: friendIsSelf, targetIsFriend: friendIsFriend }, () => {
        deleteFriend(friend.targetId, friend.name);
      })
      .addDeleteFriendApplicationOption({ targetIsSelf: friendIsSelf, targetIsPending: friendIsPending }, () => {
        deleteFriendApplication(friend.targetId);
      })
      .build();

    showContextMenu(x, y, 'right-bottom', contextMenu);
  };

  useEffect(() => {
    if (!friend.targetId || friend.isBlocked || !friend.shareCurrentServer || !friend.currentServerId || !friendIsFriend) {
      setFriendCurrentServer(null);
      return;
    }
    ipc.api.fetchServer({ userId: friend.targetId, serverId: friend.currentServerId }).then((server) => {
      if (server) setFriendCurrentServer(server);
    });
  }, [friend.targetId, friend.isBlocked, friend.shareCurrentServer, friend.currentServerId, friendIsFriend]);

  return (
    <div className={`${styles['friend-tab']} ${isSelected ? styles['selected'] : ''}`} onClick={handleTabClick} onDoubleClick={handleTabDoubleClick} onContextMenu={handleTabContextMenu}>
      <div
        className={styles['friend-tab-avatar']}
        style={{ filter: friendIsFriend && !friendIsOffline && !friend.isBlocked ? '' : 'grayscale(100%)' }}
        datatype={friendIsFriend && !friendIsOnline && !friendIsOffline && !friend.isBlocked ? friend.status : ''}
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
        {friendIsPending ? (
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
