import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface ServersState {
  data: Types.Server[];
}

const initialState: ServersState = {
  data: [],
};

export const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    setServers: (state, action: PayloadAction<Types.Server[]>) => {
      state.data = action.payload;
    },
    addServers: (state, action: PayloadAction<{ data: Types.Server }[]>) => {
      const add = new Set(action.payload.map((i) => `${i.data.serverId}`));
      state.data = state.data.filter((s) => !add.has(`${s.serverId}`)).concat(action.payload.map((i) => i.data));
    },
    updateServers: (state, action: PayloadAction<{ serverId: string; update: Partial<Types.Server> }[]>) => {
      const update = new Map(action.payload.map((i) => [`${i.serverId}`, i.update] as const));
      state.data = state.data.map((s) => (update.has(`${s.serverId}`) ? { ...s, ...update.get(`${s.serverId}`) } : s));
    },
    removeServers: (state, action: PayloadAction<{ serverId: string }[]>) => {
      const remove = new Set(action.payload.map((i) => `${i.serverId}`));
      state.data = state.data.filter((s) => !remove.has(`${s.serverId}`));
    },
    clearServers: (state) => {
      state.data = [];
    },
  },
});

export const { setServers, addServers, updateServers, removeServers, clearServers } = serversSlice.actions;
export default serversSlice.reducer;
