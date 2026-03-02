import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface ChannelMessagesState {
  data: (Types.ChannelMessage | Types.PromptMessage)[];
}

const initialState: ChannelMessagesState = {
  data: [],
};

export const channelMessagesSlice = createSlice({
  name: 'channelMessages',
  initialState,
  reducers: {
    setChannelMessages: (state, action: PayloadAction<(Types.ChannelMessage | Types.PromptMessage)[]>) => {
      state.data = action.payload;
    },
    addChannelMessages: (state, action: PayloadAction<(Types.ChannelMessage | Types.PromptMessage)[]>) => {
      state.data = state.data.concat(action.payload);
    },
    clearChannelMessages: (state) => {
      state.data = [];
    },
  },
});

export const { setChannelMessages, addChannelMessages, clearChannelMessages } = channelMessagesSlice.actions;
export default channelMessagesSlice.reducer;
