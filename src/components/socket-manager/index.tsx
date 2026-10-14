import React, { useEffect, useRef } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { openErrorDialog } from '@/services';

import { REFRESH_REGION_INFO_INTERVAL } from '@/constants';

import { useSoundPlayer } from '@/providers/SoundPlayer';

import { useAppDispatch, useAppSelector } from '@/hooks/useStore';

import { getRegion, getDefaultFriendActivity } from '@/utils';

const SocketManager: React.FC = React.memo(() => {
  const { playSound } = useSoundPlayer();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.user.data, shallowEqual);
  const friends = useAppSelector((state) => state.friends.data, shallowEqual);
  const server = useAppSelector((state) => state.currentServer.data, shallowEqual);
  const onlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const channel = useAppSelector((state) => state.currentChannel.data, shallowEqual);

  const userRef = useRef(user);
  const friendsRef = useRef(friends);
  const serverRef = useRef(server);
  const onlineMembersRef = useRef(onlineMembers);
  const channelRef = useRef(channel);
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const popupOffSubmitRef = useRef<() => void>(() => {});

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    friendsRef.current = friends;
  }, [friends]);

  useEffect(() => {
    serverRef.current = server;
  }, [server]);

  useEffect(() => {
    onlineMembersRef.current = onlineMembers;
  }, [onlineMembers]);

  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  useEffect(() => {
    if (user.userId) return;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    ipc.api.fetchUserHotReload({ userId }).then((user) => {
      if (user) {
        dispatch(Store.setUser(user));
        dispatch(Store.setIsSocketConnected(true));
      }
    });
  }, [user.userId, dispatch]);

  useEffect(() => {
    if (!user.userId) return;

    const refresh = async () => {
      ipc.api.fetchServers({ userId: user.userId }).then((servers) => {
        if (servers) dispatch(Store.setServers(servers));
      });
      ipc.api.fetchFriends({ userId: user.userId }).then((friends) => {
        if (friends) dispatch(Store.setFriends(friends));
      });
      ipc.api.fetchFriendActivities({ userId: user.userId }).then((friendActivities) => {
        if (friendActivities) dispatch(Store.setFriendActivities(friendActivities));
      });
      ipc.api.fetchFriendGroups({ userId: user.userId }).then((friendGroups) => {
        if (friendGroups) dispatch(Store.setFriendGroups(friendGroups));
      });
      ipc.api.fetchFriendApplications({ receiverId: user.userId }).then((friendApplications) => {
        if (friendApplications) dispatch(Store.setFriendApplications(friendApplications));
      });
      ipc.api.fetchMemberInvitations({ receiverId: user.userId }).then((memberInvitations) => {
        if (memberInvitations) dispatch(Store.setMemberInvitations(memberInvitations));
      });
    };
    refresh();
  }, [user.userId, dispatch]);

  useEffect(() => {
    if (!user.userId) return;

    const refresh = async () => {
      const region = getRegion();
      ipc.api.fetchAnnouncements({ region }).then((announcements) => {
        if (announcements) dispatch(Store.setAnnouncements(announcements));
      });
      ipc.api.fetchNotifications({ region }).then((notifications) => {
        if (notifications) dispatch(Store.setNotifications(notifications));
      });
      ipc.api.fetchRecommendServers({ region }).then((recommendServerList) => {
        if (recommendServerList) dispatch(Store.setRecommendServers(recommendServerList));
      });
    };
    refresh();

    const interval = setInterval(() => refresh(), REFRESH_REGION_INFO_INTERVAL);

    return () => clearInterval(interval);
  }, [user.userId, dispatch]);

  useEffect(() => {
    if (!user.userId) return;
    if (!user.currentServerId) {
      dispatch(Store.clearCurrentServer());
      dispatch(Store.clearChannels());
      dispatch(Store.clearOnlineMembers());
      dispatch(Store.clearMemberApplications());
      dispatch(Store.clearActionMessages());
      dispatch(Store.clearChannelMessages());
      dispatch(Store.clearQueueUsers());
      dispatch(Store.clearChannelEvents());
      return;
    }

    const refresh = async () => {
      if (!user.currentServerId) return;
      ipc.api.fetchServer({ userId: user.userId, serverId: user.currentServerId }).then((server) => {
        if (server) dispatch(Store.setCurrentServer(server));
      });
      ipc.api.fetchChannels({ userId: user.userId, serverId: user.currentServerId }).then((channels) => {
        if (channels) dispatch(Store.setChannels(channels));
      });
      ipc.api.fetchServerOnlineMembers({ serverId: user.currentServerId }).then((serverOnlineMembers) => {
        if (serverOnlineMembers) dispatch(Store.setOnlineMembers(serverOnlineMembers));
      });
      ipc.api.fetchMemberApplications({ serverId: user.currentServerId }).then((serverMemberApplications) => {
        if (serverMemberApplications) dispatch(Store.setMemberApplications(serverMemberApplications));
      });
    };
    refresh();
  }, [user.userId, user.currentServerId, dispatch]);

  useEffect(() => {
    if (!user.userId) return;
    if (!user.currentServerId || !user.currentChannelId) {
      dispatch(Store.clearCurrentChannel());
      return;
    }

    const refresh = async () => {
      if (!user.currentServerId || !user.currentChannelId) return;
      ipc.api.fetchChannel({ userId: user.userId, serverId: user.currentServerId, channelId: user.currentChannelId }).then((channel) => {
        if (channel) dispatch(Store.setCurrentChannel(channel));
      });
    };
    refresh();
  }, [user.userId, user.currentServerId, user.currentChannelId, dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('connect', () => {
      ipc.popup.close('errorDialog');
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      dispatch(Store.setIsSocketConnected(true));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('disconnect', () => {
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = setTimeout(() => dispatch(Store.setIsSocketConnected(false)), 30000);
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('heartbeat', (...args) => {
      dispatch(Store.setLatency(args[0].latency));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('userUpdate', (...args) => {
      const newActives = args.reduce<Types.FriendActivity[]>((acc, curr) => {
        if (curr.update.signature && userRef.current.signature !== curr.update.signature) {
          acc.push(getDefaultFriendActivity({ ...userRef.current, content: curr.update.signature, timestamp: Date.now() }));
        }
        return acc;
      }, []);
      dispatch(Store.addFriendActivities(newActives));

      const newCurrentServerId = args[0].update.currentServerId;
      if (newCurrentServerId !== undefined && newCurrentServerId !== userRef.current.currentServerId) {
        dispatch(Store.clearChannels());
        dispatch(Store.clearOnlineMembers());
        dispatch(Store.clearMemberApplications());
        dispatch(Store.clearActionMessages());
        dispatch(Store.clearChannelMessages());
        dispatch(Store.clearQueueUsers());
        dispatch(Store.clearChannelEvents());
      }
      dispatch(Store.updateUser(args[0].update));
      if (args[0].update.userId) localStorage.setItem('userId', args[0].update.userId);
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendAdd', (...args) => {
      dispatch(Store.addFriends(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendUpdate', (...args) => {
      const newActivities = args.reduce<Types.FriendActivity[]>((acc, curr) => {
        const targetFriend = friendsRef.current.find((f) => f.targetId === curr.targetId && f.relationStatus === 2);
        if (targetFriend && curr.update.signature && targetFriend.signature !== curr.update.signature) {
          acc.push(getDefaultFriendActivity({ ...targetFriend, content: curr.update.signature, timestamp: Date.now() }));
        }
        return acc;
      }, []);
      dispatch(Store.addFriendActivities(newActivities));
      dispatch(Store.updateFriends(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendRemove', (...args) => {
      dispatch(Store.removeFriends(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupAdd', (...args) => {
      dispatch(Store.addFriendGroups(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupUpdate', (...args) => {
      dispatch(Store.updateFriendGroups(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupRemove', (...args) => {
      dispatch(Store.removeFriendGroups(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationAdd', (...args) => {
      dispatch(Store.addFriendApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationUpdate', (...args) => {
      dispatch(Store.updateFriendApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationRemove', (...args) => {
      dispatch(Store.removeFriendApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverAdd', (...args) => {
      dispatch(Store.addServers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverUpdate', (...args) => {
      const currentServerUpdate = args.filter((i) => i.serverId === serverRef.current.serverId).reduce<Partial<Types.Server>>((acc, curr) => ({ ...acc, ...curr.update }), {});
      dispatch(Store.updateCurrentServer(currentServerUpdate));
      dispatch(Store.updateServers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverRemove', (...args) => {
      dispatch(Store.removeServers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberAdd', (...args) => {
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = onlineMembersRef.current.find((om) => om.userId === curr.data.userId && om.serverId === curr.data.serverId);
        if (!originMember) {
          acc.push({ ...curr.data, type: 'join' as Types.ChannelEvent['type'], prevChannelId: null, nextChannelId: curr.data.currentChannelId, timestamp: Date.now() });
        }
        return acc;
      }, []);
      dispatch(Store.addChannelEvents(newChannelEvents));
      dispatch(Store.addOnlineMembers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberUpdate', (...args) => {
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = onlineMembersRef.current.find((om) => om.userId === curr.userId && om.serverId === curr.serverId);
        if (originMember && curr.update.currentChannelId) {
          acc.push({ ...originMember, type: 'move' as Types.ChannelEvent['type'], prevChannelId: originMember.currentChannelId, nextChannelId: curr.update.currentChannelId, timestamp: Date.now() });
        }
        return acc;
      }, []);
      dispatch(Store.addChannelEvents(newChannelEvents));
      dispatch(Store.updateOnlineMembers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberRemove', (...args) => {
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = onlineMembersRef.current.find((om) => om.userId === curr.userId && om.serverId === curr.serverId);
        if (originMember) {
          acc.push({ ...originMember, type: 'leave' as Types.ChannelEvent['type'], prevChannelId: originMember.currentChannelId, nextChannelId: null, timestamp: Date.now() });
        }
        return acc;
      }, []);
      dispatch(Store.addChannelEvents(newChannelEvents));
      dispatch(Store.removeOnlineMembers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationAdd', (...args) => {
      dispatch(Store.addMemberApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationRemove', (...args) => {
      dispatch(Store.removeMemberApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelAdd', (...args) => {
      dispatch(Store.addChannels(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args) => {
      const currentChannelUpdate = args.filter((i) => i.channelId === channelRef.current.channelId).reduce<Partial<Types.Channel>>((acc, curr) => ({ ...acc, ...curr.update }), {});
      dispatch(Store.updateCurrentChannel(currentChannelUpdate));
      dispatch(Store.updateChannels(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelRemove', (...args) => {
      dispatch(Store.removeChannels(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationAdd', (...args) => {
      dispatch(Store.addMemberInvitations(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationUpdate', (...args) => {
      dispatch(Store.updateMemberInvitations(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationRemove', (...args) => {
      dispatch(Store.removeMemberInvitations(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelMessage', (...args) => {
      dispatch(Store.addChannelMessages(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('actionMessage', (...args) => {
      dispatch(Store.addActionMessages(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('queueMembersSet', (...args) => {
      dispatch(Store.setQueueUsers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('playSound', (...args) => {
      args.forEach((s) => playSound(s));
    });
    return () => unsub();
  }, [playSound]);

  useEffect(() => {
    const unsub = ipc.socket.on('openPopup', (...args) => {
      args.forEach((p) => {
        ipc.popup.open(p.type, p.id, p.initialData, p.force);
        popupOffSubmitRef.current?.();
        popupOffSubmitRef.current = ipc.popup.onSubmit(p.id, () => {
          if (p.id === 'logout') {
            ipc.auth.logout();
          }
        });
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('error', (error) => {
      openErrorDialog(new Error(error.message), () => {});
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('shakeWindow', (...args) => {
      args.forEach((item) => {
        if (!item) return;
        const initialData: unknown | undefined = item.initialData;
        if (!initialData || typeof initialData !== 'object' || !('targetId' in initialData)) return;
        ipc.popup.open('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event: 'shakeWindow', message: item }, false);
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('directMessage', (...args) => {
      const initialData: unknown | undefined = args[0].initialData;
      if (!initialData || typeof initialData !== 'object' || !('targetId' in initialData)) return;
      ipc.popup.open('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event: 'directMessage', message: args[0] }, false);
    });
    return () => unsub();
  }, []);

  return null;
});

SocketManager.displayName = 'SocketManager';

export default SocketManager;
