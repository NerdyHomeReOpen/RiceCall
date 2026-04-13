import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface NotificationsState {
  data: Types.Notification[];
}

const initialState: NotificationsState = {
  data: [],
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Types.Notification[]>) => {
      state.data = action.payload;
    },
    addNotifications: (state, action: PayloadAction<Types.Notification[]>) => {
      state.data = state.data.concat(action.payload);
    },
    clearNotifications: (state) => {
      state.data = [];
    },
  },
});

export const { setNotifications, addNotifications, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
