import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface ActionMessagesState {
  data: (Types.ChannelMessage | Types.PromptMessage)[];
}

const initialState: ActionMessagesState = {
  data: [],
};

export const actionMessagesSlice = createSlice({
  name: 'actionMessages',
  initialState,
  reducers: {
    setActionMessages: (state, action: PayloadAction<(Types.ChannelMessage | Types.PromptMessage)[]>) => {
      state.data = action.payload;
    },
    addActionMessages: (state, action: PayloadAction<(Types.ChannelMessage | Types.PromptMessage)[]>) => {
      state.data = state.data.concat(action.payload);
    },
    clearActionMessages: (state) => {
      state.data = [];
    },
  },
});

export const { setActionMessages, addActionMessages, clearActionMessages } = actionMessagesSlice.actions;
export default actionMessagesSlice.reducer;
