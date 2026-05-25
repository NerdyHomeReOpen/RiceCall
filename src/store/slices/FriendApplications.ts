import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface FriendApplicationsState {
  data: Types.FriendApplication[];
}

const initialState: FriendApplicationsState = {
  data: [],
};

export const friendApplicationsSlice = createSlice({
  name: 'friendApplications',
  initialState,
  reducers: {
    setFriendApplications: (state, action: PayloadAction<Types.FriendApplication[]>) => {
      state.data = action.payload;
    },
    addFriendApplications: (state, action: PayloadAction<{ data: Types.FriendApplication }[]>) => {
      const add = new Set(action.payload.map((i) => `${i.data.senderId}`));
      state.data = state.data.filter((fa) => !add.has(`${fa.senderId}`)).concat(action.payload.map((i) => i.data));
    },
    updateFriendApplications: (state, action: PayloadAction<{ senderId: string; update: Partial<Types.FriendApplication> }[]>) => {
      const update = new Map(action.payload.map((i) => [`${i.senderId}`, i.update] as const));
      state.data = state.data.map((fa) => (update.has(`${fa.senderId}`) ? { ...fa, ...update.get(`${fa.senderId}`) } : fa));
    },
    removeFriendApplications: (state, action: PayloadAction<{ senderId: string }[]>) => {
      const remove = new Set(action.payload.map((i) => `${i.senderId}`));
      state.data = state.data.filter((fa) => !remove.has(`${fa.senderId}`));
    },
    clearFriendApplications: (state) => {
      state.data = [];
    },
  },
});

export const { setFriendApplications, addFriendApplications, updateFriendApplications, removeFriendApplications, clearFriendApplications } = friendApplicationsSlice.actions;
export default friendApplicationsSlice.reducer;
