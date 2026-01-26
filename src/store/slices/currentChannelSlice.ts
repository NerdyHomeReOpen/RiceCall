import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

import * as Default from '@/utils/default';

interface CurrentChannelState {
  data: Types.Channel;
}

const initialState: CurrentChannelState = {
  data: Default.channel(),
};

export const currentChannelSlice = createSlice({
  name: 'currentChannel',
  initialState,
  reducers: {
    setCurrentChannel: (state, action: PayloadAction<Types.Channel>) => {
      state.data = action.payload;
    },
    updateCurrentChannel: (state, action: PayloadAction<Partial<Types.Channel>>) => {
      state.data = { ...state.data, ...action.payload };
    },
    clearCurrentChannel: (state) => {
      state.data = Default.channel();
    },
  },
});

export const { setCurrentChannel, updateCurrentChannel, clearCurrentChannel } = currentChannelSlice.actions;
export default currentChannelSlice.reducer;
