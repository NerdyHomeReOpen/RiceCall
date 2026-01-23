import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface FriendsState {
  data: Types.Friend[];
}

const initialState: FriendsState = {
  data: [],
};

export const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    setFriends: (state, action: PayloadAction<Types.Friend[]>) => {
      state.data = action.payload;
    },
    addFriends: (state, action: PayloadAction<{ data: Types.Friend }[]>) => {
      const add = new Set(action.payload.map((i) => `${i.data.targetId}`));
      state.data = state.data.filter((f) => !add.has(`${f.targetId}`)).concat(action.payload.map((i) => i.data));
    },
    updateFriends: (state, action: PayloadAction<{ targetId: string; update: Partial<Types.Friend> }[]>) => {
      const update = new Map(action.payload.map((i) => [`${i.targetId}`, i.update] as const));
      state.data = state.data.map((f) => (update.has(`${f.targetId}`) ? { ...f, ...update.get(`${f.targetId}`) } : f));
    },
    removeFriends: (state, action: PayloadAction<{ targetId: string }[]>) => {
      const remove = new Set(action.payload.map((i) => `${i.targetId}`));
      state.data = state.data.filter((f) => !remove.has(`${f.targetId}`));
    },
    clearFriends: (state) => {
      state.data = [];
    },
  },
});

export const { setFriends, addFriends, updateFriends, removeFriends, clearFriends } = friendsSlice.actions;
export default friendsSlice.reducer;
