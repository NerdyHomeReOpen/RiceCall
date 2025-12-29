import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

import * as Default from '@/utils/default';

interface CurrentServerState {
  data: Types.Server;
}

const initialState: CurrentServerState = {
  data: Default.server(),
};

export const currentServerSlice = createSlice({
  name: 'currentServer',
  initialState,
  reducers: {
    setCurrentServer: (state, action: PayloadAction<Types.Server>) => {
      state.data = action.payload;
    },
    updateCurrentServer: (state, action: PayloadAction<Partial<Types.Server>>) => {
      state.data = { ...state.data, ...action.payload };
    },
    clearCurrentServer: (state) => {
      state.data = Default.server();
    },
  },
});

export const { setCurrentServer, updateCurrentServer, clearCurrentServer } = currentServerSlice.actions;
export default currentServerSlice.reducer;
