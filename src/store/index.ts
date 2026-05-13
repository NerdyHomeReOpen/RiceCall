import { configureStore, combineReducers } from '@reduxjs/toolkit';

import actionMessagesReducer from './slices/ActionMessages';
import announcementsReducer from './slices/Announcements';
import channelEventsReducer from './slices/ChannelEvents';
import channelMessagesReducer from './slices/ChannelMessages';
import channelsReducer from './slices/Channels';
import currentChannelReducer from './slices/CurrentChannel';
import currentServerReducer from './slices/CurrentServer';
import friendActivitiesReducer from './slices/FriendActivities';
import friendApplicationsReducer from './slices/FriendApplications';
import friendGroupsReducer from './slices/FriendGroups';
import friendsReducer from './slices/Friends';
import memberApplicationsReducer from './slices/MemberApplications';
import memberInvitationsReducer from './slices/MemberInvitations';
import notificationsReducer from './slices/Notifications';
import onlineMembersReducer from './slices/OnlineMembers';
import queueUsersReducer from './slices/QueueUsers';
import recommendServersReducer from './slices/RecommendServers';
import serversReducer from './slices/Servers';
import socketReducer from './slices/Socket';
import systemNotificationsReducer from './slices/SystemNotifications';
import uiReducer from './slices/UI';
import userReducer from './slices/User';
import webrtcReducer from './slices/WebRTC';

export const rootReducer = combineReducers({
  actionMessages: actionMessagesReducer,
  announcements: announcementsReducer,
  channelEvents: channelEventsReducer,
  channelMessages: channelMessagesReducer,
  channels: channelsReducer,
  currentChannel: currentChannelReducer,
  currentServer: currentServerReducer,
  friendActivities: friendActivitiesReducer,
  friendApplications: friendApplicationsReducer,
  friendGroups: friendGroupsReducer,
  friends: friendsReducer,
  memberApplications: memberApplicationsReducer,
  memberInvitations: memberInvitationsReducer,
  notifications: notificationsReducer,
  onlineMembers: onlineMembersReducer,
  queueUsers: queueUsersReducer,
  recommendServers: recommendServersReducer,
  servers: serversReducer,
  socket: socketReducer,
  systemNotifications: systemNotificationsReducer,
  ui: uiReducer,
  user: userReducer,
  webrtc: webrtcReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export * from './slices/ActionMessages';
export * from './slices/Announcements';
export * from './slices/ChannelEvents';
export * from './slices/ChannelMessages';
export * from './slices/Channels';
export * from './slices/CurrentChannel';
export * from './slices/CurrentServer';
export * from './slices/FriendActivities';
export * from './slices/FriendApplications';
export * from './slices/FriendGroups';
export * from './slices/Friends';
export * from './slices/MemberApplications';
export * from './slices/MemberInvitations';
export * from './slices/Notifications';
export * from './slices/OnlineMembers';
export * from './slices/QueueUsers';
export * from './slices/RecommendServers';
export * from './slices/Servers';
export * from './slices/Socket';
export * from './slices/SystemNotifications';
export * from './slices/UI';
export * from './slices/User';
export * from './slices/WebRTC';
