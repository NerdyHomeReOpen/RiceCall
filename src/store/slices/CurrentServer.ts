import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

import { getDefaultServer } from '@/utils/default';

interface CurrentServerState {
  data: Types.Server;
}

const initialState: CurrentServerState = {
  data: getDefaultServer(),
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
      state.data = getDefaultServer();
    },
  },
});

export const { setCurrentServer, updateCurrentServer, clearCurrentServer } = currentServerSlice.actions;
export default currentServerSlice.reducer;
