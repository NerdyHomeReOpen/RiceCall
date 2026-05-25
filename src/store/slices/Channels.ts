import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface ChannelsState {
  data: (Types.Channel | Types.Category)[];
}

const initialState: ChannelsState = {
  data: [],
};

export const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannels: (state, action: PayloadAction<(Types.Channel | Types.Category)[]>) => {
      state.data = action.payload;
    },
    addChannels: (state, action: PayloadAction<{ data: Types.Channel | Types.Category }[]>) => {
      const add = new Set(action.payload.map((i) => `${i.data.channelId}`));
      state.data = state.data.filter((c) => !add.has(`${c.channelId}`)).concat(action.payload.map((i) => i.data));
    },
    updateChannels: (state, action: PayloadAction<{ channelId: string; update: Partial<Types.Channel | Types.Category> }[]>) => {
      const update = new Map(action.payload.map((i) => [`${i.channelId}`, i.update] as const));
      state.data = state.data.map((c) => (update.has(`${c.channelId}`) ? { ...c, ...update.get(`${c.channelId}`) } : c));
    },
    removeChannels: (state, action: PayloadAction<{ channelId: string }[]>) => {
      const remove = new Set(action.payload.map((i) => `${i.channelId}`));
      state.data = state.data.filter((c) => !remove.has(`${c.channelId}`));
    },
    clearChannels: (state) => {
      state.data = [];
    },
  },
});

export const { setChannels, addChannels, updateChannels, removeChannels, clearChannels } = channelsSlice.actions;
export default channelsSlice.reducer;
