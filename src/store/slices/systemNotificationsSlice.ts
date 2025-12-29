import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SystemNotificationsState {
  data: string[];
}

const initialState: SystemNotificationsState = {
  data: [],
};

export const systemNotificationsSlice = createSlice({
  name: 'systemNotifications',
  initialState,
  reducers: {
    setSystemNotifications: (state, action: PayloadAction<string[]>) => {
      state.data = action.payload;
    },
    addSystemNotifications: (state, action: PayloadAction<string[]>) => {
      state.data = state.data.concat(action.payload);
    },
    clearSystemNotifications: (state) => {
      state.data = [];
    },
  },
});

export const { setSystemNotifications, addSystemNotifications, clearSystemNotifications } = systemNotificationsSlice.actions;
export default systemNotificationsSlice.reducer;
