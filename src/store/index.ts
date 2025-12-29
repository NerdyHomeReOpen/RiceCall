import { configureStore } from '@reduxjs/toolkit';

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
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
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
    user: userReducer,
  },
  // middleware 預設已包含 Thunk，這對處理 IPC/Socket 非同步非常有用
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // 關閉序列化檢查，方便在 Action 裡傳遞一些特殊物件（如果需要）
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
