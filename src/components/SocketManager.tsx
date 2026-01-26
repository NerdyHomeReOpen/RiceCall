import React, { useEffect, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import ipc from '@/ipc';

import * as Types from '@/types';

import { addActionMessages, clearActionMessages } from '@/store/slices/actionMessagesSlice';
import { setAnnouncements } from '@/store/slices/announcementsSlice';
import { addChannelEvents, clearChannelEvents } from '@/store/slices/channelEventsSlice';
import { addChannelMessages, clearChannelMessages } from '@/store/slices/channelMessagesSlice';
import { setChannels, addChannels, updateChannels, removeChannels, clearChannels } from '@/store/slices/channelsSlice';
import { setCurrentChannel, updateCurrentChannel, clearCurrentChannel } from '@/store/slices/currentChannelSlice';
import { setCurrentServer, updateCurrentServer, clearCurrentServer } from '@/store/slices/currentServerSlice';
import { setFriendActivities, addFriendActivities } from '@/store/slices/friendActivitiesSlice';
import { setFriendApplications, addFriendApplications, updateFriendApplications, removeFriendApplications } from '@/store/slices/friendApplicationsSlice';
import { setFriendGroups, addFriendGroups, updateFriendGroups, removeFriendGroups } from '@/store/slices/friendGroupsSlice';
import { setFriends, addFriends, updateFriends, removeFriends } from '@/store/slices/friendsSlice';
import { setMemberApplications, addMemberApplications, removeMemberApplications, clearMemberApplications } from '@/store/slices/memberApplicationsSlice';
import { setMemberInvitations, addMemberInvitations, updateMemberInvitations, removeMemberInvitations } from '@/store/slices/memberInvitationsSlice';
import { setNotifications } from '@/store/slices/notificationsSlice';
import { setOnlineMembers, addOnlineMembers, updateOnlineMembers, removeOnlineMembers, clearOnlineMembers } from '@/store/slices/onlineMembersSlice';
import { setQueueUsers, clearQueueUsers } from '@/store/slices/queueUsersSlice';
import { setRecommendServers } from '@/store/slices/recommendServersSlice';
import { setServers, addServers, updateServers, removeServers } from '@/store/slices/serversSlice';
import { setLatency, setIsSocketConnected } from '@/store/slices/socketSlice';
import { setUser, updateUser } from '@/store/slices/userSlice';

import { useSoundPlayer } from '@/providers/SoundPlayer';

import * as Default from '@/utils/default';
import * as Popup from '@/utils/popup';

import { LANGUAGES, REFRESH_REGION_INFO_INTERVAL } from '@/constant';

const SocketManager: React.FC = React.memo(() => {
  // Hooks
  const { playSound } = useSoundPlayer();
  const dispatch = useAppDispatch();

  const [region, setRegion] = useState<Types.LanguageKey>('en-US');

  // Selectors
  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      currentServerId: state.user.data.currentServerId,
      currentChannelId: state.user.data.currentChannelId,
      signature: state.user.data.signature,
    }),
    shallowEqual,
  );

  const currentFriends = useAppSelector((state) => state.friends.data, shallowEqual);
  const currentServer = useAppSelector((state) => state.currentServer.data, shallowEqual);
  const currentOnlineMembers = useAppSelector((state) => state.onlineMembers.data, shallowEqual);
  const currentChannel = useAppSelector((state) => state.currentChannel.data, shallowEqual);

  // Refs
  const disconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const popupOffSubmitRef = useRef<() => void>(() => {});
  const userRef = useRef(user);
  const currentFriendsRef = useRef(currentFriends);
  const currentServerRef = useRef(currentServer);
  const currentOnlineMembersRef = useRef(currentOnlineMembers);
  const currentChannelRef = useRef(currentChannel);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    currentFriendsRef.current = currentFriends;
  }, [currentFriends]);

  useEffect(() => {
    currentServerRef.current = currentServer;
  }, [currentServer]);

  useEffect(() => {
    currentOnlineMembersRef.current = currentOnlineMembers;
  }, [currentOnlineMembers]);

  useEffect(() => {
    currentChannelRef.current = currentChannel;
  }, [currentChannel]);

  // Effects
  useEffect(() => {
    if (user.userId) return;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    ipc.data.userHotReload({ userId }).then((user) => {
      if (user) {
        dispatch(setUser(user));
        dispatch(setIsSocketConnected(true));
      }
    });
  }, [user.userId, dispatch]);

  useEffect(() => {
    const language = navigator.language;
    const match = LANGUAGES.find(({ code }) => code.includes(language));
    if (!match) return setRegion('en-US');
    setRegion(match.code);
  }, []);

  useEffect(() => {
    if (!user.userId) return;
    const refresh = async () => {
      ipc.data.servers({ userId: user.userId }).then((servers) => {
        if (servers) dispatch(setServers(servers));
      });
      ipc.data.friends({ userId: user.userId }).then((friends) => {
        if (friends) dispatch(setFriends(friends));
      });
      ipc.data.friendActivities({ userId: user.userId }).then((friendActivities) => {
        if (friendActivities) dispatch(setFriendActivities(friendActivities));
      });
      ipc.data.friendGroups({ userId: user.userId }).then((friendGroups) => {
        if (friendGroups) dispatch(setFriendGroups(friendGroups));
      });
      ipc.data.friendApplications({ receiverId: user.userId }).then((friendApplications) => {
        if (friendApplications) dispatch(setFriendApplications(friendApplications));
      });
      ipc.data.memberInvitations({ receiverId: user.userId }).then((memberInvitations) => {
        if (memberInvitations) dispatch(setMemberInvitations(memberInvitations));
      });
    };
    refresh();
  }, [user.userId, dispatch]);

  useEffect(() => {
    if (!user.userId) return;
    const refresh = async () => {
      ipc.data.announcements({ region }).then((announcements) => {
        if (announcements) dispatch(setAnnouncements(announcements));
      });
      ipc.data.notifications({ region }).then((notifications) => {
        if (notifications) dispatch(setNotifications(notifications));
      });
      ipc.data.recommendServers({ region }).then((recommendServerList) => {
        if (recommendServerList) dispatch(setRecommendServers(recommendServerList));
      });
    };
    const interval = setInterval(() => refresh(), REFRESH_REGION_INFO_INTERVAL);
    refresh();
    return () => clearInterval(interval);
  }, [region, user.userId, dispatch]);

  useEffect(() => {
    if (!user.userId) return;
    if (!user.currentServerId) {
      dispatch(clearCurrentServer());
      dispatch(clearChannels());
      dispatch(clearOnlineMembers());
      dispatch(clearMemberApplications());
      dispatch(clearActionMessages());
      dispatch(clearChannelMessages());
      dispatch(clearQueueUsers());
      dispatch(clearChannelEvents());
      return;
    }
    const refresh = async () => {
      if (!user.currentServerId) return;
      ipc.data.server({ userId: user.userId, serverId: user.currentServerId }).then((server) => {
        if (server) dispatch(setCurrentServer(server));
      });
      ipc.data.channels({ userId: user.userId, serverId: user.currentServerId }).then((channels) => {
        if (channels) dispatch(setChannels(channels));
      });
      ipc.data.serverOnlineMembers({ serverId: user.currentServerId }).then((serverOnlineMembers) => {
        if (serverOnlineMembers) dispatch(setOnlineMembers(serverOnlineMembers));
      });
      ipc.data.memberApplications({ serverId: user.currentServerId }).then((serverMemberApplications) => {
        if (serverMemberApplications) dispatch(setMemberApplications(serverMemberApplications));
      });
    };
    refresh();
  }, [user.userId, user.currentServerId, dispatch]);

  useEffect(() => {
    if (!user.userId) return;
    if (!user.currentServerId || !user.currentChannelId) {
      dispatch(clearCurrentChannel());
      return;
    }
    const refresh = async () => {
      if (!user.currentServerId || !user.currentChannelId) return;
      ipc.data.channel({ userId: user.userId, serverId: user.currentServerId, channelId: user.currentChannelId }).then((channel) => {
        if (channel) dispatch(setCurrentChannel(channel));
      });
    };
    refresh();
  }, [user.userId, user.currentServerId, user.currentChannelId, dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('connect', () => {
      ipc.popup.close('errorDialog');
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      dispatch(setIsSocketConnected(true));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('disconnect', () => {
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = setTimeout(() => dispatch(setIsSocketConnected(false)), 30000);
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('heartbeat', (...args: { seq: number; latency: number }[]) => {
      dispatch(setLatency(args[0].latency));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('userUpdate', (...args: { update: Partial<Types.User> }[]) => {
      // Add activity when signature is updated
      const newActives = args.reduce<Types.FriendActivity[]>((acc, curr) => {
        if (curr.update.signature && userRef.current.signature !== curr.update.signature) {
          acc.push(Default.friendActivity({ ...userRef.current, content: curr.update.signature, timestamp: Date.now() }));
        }
        return acc;
      }, []);
      dispatch(addFriendActivities(newActives));
      // Clear state when current server is changed
      const newCurrentServerId = args[0].update.currentServerId;
      if (newCurrentServerId !== undefined && newCurrentServerId !== userRef.current.currentServerId) {
        dispatch(clearChannels());
        dispatch(clearOnlineMembers());
        dispatch(clearMemberApplications());
        dispatch(clearActionMessages());
        dispatch(clearChannelMessages());
        dispatch(clearQueueUsers());
        dispatch(clearChannelEvents());
      }
      dispatch(updateUser(args[0].update));
      if (args[0].update.userId) localStorage.setItem('userId', args[0].update.userId); // For hot reload
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendAdd', (...args: { data: Types.Friend }[]) => {
      dispatch(addFriends(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendUpdate', (...args: { targetId: string; update: Partial<Types.Friend> }[]) => {
      // Add activity when signature is updated
      const newActivities = args.reduce<Types.FriendActivity[]>((acc, curr) => {
        const targetFriend = currentFriendsRef.current.find((f) => f.targetId === curr.targetId && f.relationStatus === 2);
        if (targetFriend && curr.update.signature && targetFriend.signature !== curr.update.signature) {
          acc.push(Default.friendActivity({ ...targetFriend, content: curr.update.signature, timestamp: Date.now() }));
        }
        return acc;
      }, []);
      dispatch(addFriendActivities(newActivities));
      dispatch(updateFriends(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendRemove', (...args: { targetId: string }[]) => {
      dispatch(removeFriends(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupAdd', (...args: { data: Types.FriendGroup }[]) => {
      dispatch(addFriendGroups(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupUpdate', (...args: { friendGroupId: string; update: Partial<Types.FriendGroup> }[]) => {
      dispatch(updateFriendGroups(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendGroupRemove', (...args: { friendGroupId: string }[]) => {
      dispatch(removeFriendGroups(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationAdd', (...args: { data: Types.FriendApplication }[]) => {
      dispatch(addFriendApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationUpdate', (...args: { senderId: string; update: Partial<Types.FriendApplication> }[]) => {
      dispatch(updateFriendApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('friendApplicationRemove', (...args: { senderId: string }[]) => {
      dispatch(removeFriendApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverAdd', (...args: { data: Types.Server }[]) => {
      dispatch(addServers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverUpdate', (...args: { serverId: string; update: Partial<Types.Server> }[]) => {
      // Update current server
      const currentServerUpdate = args.filter((i) => i.serverId === currentServerRef.current.serverId).reduce<Partial<Types.Server>>((acc, curr) => ({ ...acc, ...curr.update }), {});
      dispatch(updateCurrentServer(currentServerUpdate));
      dispatch(updateServers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverRemove', (...args: { serverId: string }[]) => {
      dispatch(removeServers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberAdd', (...args: { data: Types.OnlineMember }[]) => {
      // Add channel events
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = currentOnlineMembersRef.current.find((om) => om.userId === curr.data.userId && om.serverId === curr.data.serverId);
        if (!originMember) {
          acc.push({ ...curr.data, type: 'join' as Types.ChannelEvent['type'], prevChannelId: null, nextChannelId: curr.data.currentChannelId, timestamp: Date.now() });
        }
        return acc;
      }, []);
      dispatch(addChannelEvents(newChannelEvents));
      dispatch(addOnlineMembers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberUpdate', (...args: { userId: string; serverId: string; update: Partial<Types.OnlineMember> }[]) => {
      // Add channel events
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = currentOnlineMembersRef.current.find((om) => om.userId === curr.userId && om.serverId === curr.serverId);
        if (originMember && curr.update.currentChannelId) {
          acc.push({ ...originMember, type: 'move' as Types.ChannelEvent['type'], prevChannelId: originMember.currentChannelId, nextChannelId: curr.update.currentChannelId, timestamp: Date.now() });
        }
        return acc;
      }, []);
      dispatch(addChannelEvents(newChannelEvents));
      dispatch(updateOnlineMembers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverOnlineMemberRemove', (...args: { userId: string; serverId: string }[]) => {
      // Add channel events
      const newChannelEvents = args.reduce<Types.ChannelEvent[]>((acc, curr) => {
        const originMember = currentOnlineMembersRef.current.find((om) => om.userId === curr.userId && om.serverId === curr.serverId);
        if (originMember) {
          acc.push({ ...originMember, type: 'leave' as Types.ChannelEvent['type'], prevChannelId: originMember.currentChannelId, nextChannelId: null, timestamp: Date.now() });
        }
        return acc;
      }, []);
      dispatch(addChannelEvents(newChannelEvents));
      dispatch(removeOnlineMembers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationAdd', (...args: { data: Types.MemberApplication }[]) => {
      dispatch(addMemberApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('serverMemberApplicationRemove', (...args: { userId: string; serverId: string }[]) => {
      dispatch(removeMemberApplications(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelAdd', (...args: { data: Types.Channel }[]) => {
      dispatch(addChannels(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelUpdate', (...args: { channelId: string; update: Partial<Types.Channel> }[]) => {
      // Update current channel
      const currentChannelUpdate = args.filter((i) => i.channelId === currentChannelRef.current.channelId).reduce<Partial<Types.Channel>>((acc, curr) => ({ ...acc, ...curr.update }), {});
      dispatch(updateCurrentChannel(currentChannelUpdate));
      dispatch(updateChannels(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelRemove', (...args: { channelId: string }[]) => {
      dispatch(removeChannels(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationAdd', (...args: { data: Types.MemberInvitation }[]) => {
      dispatch(addMemberInvitations(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationUpdate', (...args: { serverId: string; update: Partial<Types.MemberInvitation> }[]) => {
      dispatch(updateMemberInvitations(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('memberInvitationRemove', (...args: { serverId: string }[]) => {
      dispatch(removeMemberInvitations(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('channelMessage', (...args: Types.ChannelMessage[]) => {
      dispatch(addChannelMessages(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('actionMessage', (...args: Types.PromptMessage[]) => {
      dispatch(addActionMessages(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('queueMembersSet', (...args: Types.QueueUser[]) => {
      dispatch(setQueueUsers(args));
    });
    return () => unsub();
  }, [dispatch]);

  useEffect(() => {
    const unsub = ipc.socket.on('playSound', (...args: ('enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage' | 'startSpeaking' | 'stopSpeaking')[]) => {
      args.forEach((s) => playSound(s));
    });
    return () => unsub();
  }, [playSound]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = ipc.socket.on('openPopup', (...args: { type: Types.PopupType; id: string; initialData?: any; force?: boolean }[]) => {
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
    const unsub = ipc.socket.on('error', (error: Error) => {
      // General error handling only, logout is handled via openPopup
      Popup.openErrorDialog(error.message, () => {});
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('shakeWindow', (...args: (Types.DirectMessage & { initialData?: Record<string, unknown> })[]) => {
      args.forEach((item) => {
        if (!item) return;
        const initialData: Record<string, unknown> | undefined = item.initialData;
        if (!initialData) return;
        ipc.popup.open('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event: 'shakeWindow', message: item }, false);
      });
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('directMessage', (...args: (Types.DirectMessage & { initialData?: Record<string, unknown> })[]) => {
      const initialData: Record<string, unknown> | undefined = args[0].initialData;
      if (!initialData) return;
      ipc.popup.open('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event: 'directMessage', message: args[0] }, false);
    });
    return () => unsub();
  }, []);

  return null;
});

SocketManager.displayName = 'SocketManager';

export default SocketManager;
