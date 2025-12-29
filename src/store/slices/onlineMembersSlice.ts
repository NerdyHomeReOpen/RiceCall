import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface OnlineMembersState {
  data: Types.OnlineMember[];
}

const initialState: OnlineMembersState = {
  data: [],
};

export const onlineMembersSlice = createSlice({
  name: 'onlineMembers',
  initialState,
  reducers: {
    setOnlineMembers: (state, action: PayloadAction<Types.OnlineMember[]>) => {
      state.data = action.payload;
    },
    addOnlineMembers: (state, action: PayloadAction<{ data: Types.OnlineMember }[]>) => {
      const add = new Set(action.payload.map((i) => `${i.data.userId}#${i.data.serverId}`));
      state.data = state.data.filter((om) => !add.has(`${om.userId}#${om.serverId}`)).concat(action.payload.map((i) => i.data));
    },
    updateOnlineMembers: (state, action: PayloadAction<{ userId: string; serverId: string; update: Partial<Types.OnlineMember> }[]>) => {
      const update = new Map(action.payload.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
      state.data = state.data.map((om) => (update.has(`${om.userId}#${om.serverId}`) ? { ...om, ...update.get(`${om.userId}#${om.serverId}`) } : om));
    },
    removeOnlineMembers: (state, action: PayloadAction<{ userId: string; serverId: string }[]>) => {
      const remove = new Set(action.payload.map((i) => `${i.userId}#${i.serverId}`));
      state.data = state.data.filter((om) => !remove.has(`${om.userId}#${om.serverId}`));
    },
    clearOnlineMembers: (state) => {
      state.data = [];
    },
  },
});

export const { setOnlineMembers, addOnlineMembers, updateOnlineMembers, removeOnlineMembers, clearOnlineMembers } = onlineMembersSlice.actions;
export default onlineMembersSlice.reducer;
