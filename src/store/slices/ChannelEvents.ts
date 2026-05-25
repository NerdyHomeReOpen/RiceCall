import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface ChannelEventsState {
  data: Types.ChannelEvent[];
}

const initialState: ChannelEventsState = {
  data: [],
};

export const channelEventsSlice = createSlice({
  name: 'channelEvents',
  initialState,
  reducers: {
    setChannelEvents: (state, action: PayloadAction<Types.ChannelEvent[]>) => {
      state.data = action.payload;
    },
    addChannelEvents: (state, action: PayloadAction<Types.ChannelEvent[]>) => {
      state.data = state.data.concat(action.payload);
    },
    clearChannelEvents: (state) => {
      state.data = [];
    },
  },
});

export const { setChannelEvents, addChannelEvents, clearChannelEvents } = channelEventsSlice.actions;
export default channelEventsSlice.reducer;
