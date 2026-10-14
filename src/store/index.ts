import { configureStore, combineReducers } from '@reduxjs/toolkit';

import actionMessagesReducer from './slices/action-messages';
import announcementsReducer from './slices/announcements';
import channelEventsReducer from './slices/channel-events';
import channelMessagesReducer from './slices/channel-messages';
import channelsReducer from './slices/channels';
import currentChannelReducer from './slices/current-channel';
import currentServerReducer from './slices/current-server';
import friendActivitiesReducer from './slices/friend-activities';
import friendApplicationsReducer from './slices/friend-applications';
import friendGroupsReducer from './slices/friend-groups';
import friendsReducer from './slices/friends';
import memberApplicationsReducer from './slices/member-applications';
import memberInvitationsReducer from './slices/member-invitations';
import notificationsReducer from './slices/notifications';
import onlineMembersReducer from './slices/online-members';
import queueUsersReducer from './slices/queue-users';
import recommendServersReducer from './slices/recommend-servers';
import serversReducer from './slices/servers';
import socketReducer from './slices/socket';
import systemNotificationsReducer from './slices/system-notifications';
import uiReducer from './slices/ui';
import userReducer from './slices/user';
import webrtcReducer from './slices/web-rtc';

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

export * from './slices/action-messages';
export * from './slices/announcements';
export * from './slices/channel-events';
export * from './slices/channel-messages';
export * from './slices/channels';
export * from './slices/current-channel';
export * from './slices/current-server';
export * from './slices/friend-activities';
export * from './slices/friend-applications';
export * from './slices/friend-groups';
export * from './slices/friends';
export * from './slices/member-applications';
export * from './slices/member-invitations';
export * from './slices/notifications';
export * from './slices/online-members';
export * from './slices/queue-users';
export * from './slices/recommend-servers';
export * from './slices/servers';
export * from './slices/socket';
export * from './slices/system-notifications';
export * from './slices/ui';
export * from './slices/user';
export * from './slices/web-rtc';
