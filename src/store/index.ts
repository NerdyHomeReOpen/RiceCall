import { configureStore, combineReducers } from '@reduxjs/toolkit';

import actionMessagesReducer from './slices/actionMessagesSlice';
import announcementsReducer from './slices/announcementsSlice';
import channelEventsReducer from './slices/channelEventsSlice';
import channelMessagesReducer from './slices/channelMessagesSlice';
import channelsReducer from './slices/channelsSlice';
import currentChannelReducer from './slices/currentChannelSlice';
import currentServerReducer from './slices/currentServerSlice';
import friendActivitiesReducer from './slices/friendActivitiesSlice';
import friendApplicationsReducer from './slices/friendApplicationsSlice';
import friendGroupsReducer from './slices/friendGroupsSlice';
import friendsReducer from './slices/friendsSlice';
import memberApplicationsReducer from './slices/memberApplicationsSlice';
import memberInvitationsReducer from './slices/memberInvitationsSlice';
import notificationsReducer from './slices/notificationsSlice';
import onlineMembersReducer from './slices/onlineMembersSlice';
import queueUsersReducer from './slices/queueUsersSlice';
import recommendServersReducer from './slices/recommendServersSlice';
import serversReducer from './slices/serversSlice';
import socketReducer from './slices/socketSlice';
import systemNotificationsReducer from './slices/systemNotificationsSlice';
import uiReducer from './slices/uiSlice';
import userReducer from './slices/userSlice';
import webrtcReducer from './slices/webrtcSlice';

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
