import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface FriendGroupsState {
  data: Types.FriendGroup[];
}

const initialState: FriendGroupsState = {
  data: [],
};

export const friendGroupsSlice = createSlice({
  name: 'friendGroups',
  initialState,
  reducers: {
    setFriendGroups: (state, action: PayloadAction<Types.FriendGroup[]>) => {
      state.data = action.payload;
    },
    addFriendGroups: (state, action: PayloadAction<{ data: Types.FriendGroup }[]>) => {
      const add = new Set(action.payload.map((i) => `${i.data.friendGroupId}`));
      state.data = state.data.filter((fg) => !add.has(`${fg.friendGroupId}`)).concat(action.payload.map((i) => i.data));
    },
    updateFriendGroups: (state, action: PayloadAction<{ friendGroupId: string; update: Partial<Types.FriendGroup> }[]>) => {
      const update = new Map(action.payload.map((i) => [`${i.friendGroupId}`, i.update] as const));
      state.data = state.data.map((fg) => (update.has(`${fg.friendGroupId}`) ? { ...fg, ...update.get(`${fg.friendGroupId}`) } : fg));
    },
    removeFriendGroups: (state, action: PayloadAction<{ friendGroupId: string }[]>) => {
      const remove = new Set(action.payload.map((i) => `${i.friendGroupId}`));
      state.data = state.data.filter((fg) => !remove.has(`${fg.friendGroupId}`));
    },
    clearFriendGroups: (state) => {
      state.data = [];
    },
  },
});

export const { setFriendGroups, addFriendGroups, updateFriendGroups, removeFriendGroups, clearFriendGroups } = friendGroupsSlice.actions;
export default friendGroupsSlice.reducer;
