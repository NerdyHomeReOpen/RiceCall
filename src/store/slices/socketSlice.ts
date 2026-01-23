import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SocketState {
  isSocketConnected: boolean;
  latency: number;
}

const initialState: SocketState = {
  isSocketConnected: false,
  latency: 0,
};

export const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setIsSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.isSocketConnected = action.payload;
    },
    setLatency: (state, action: PayloadAction<number>) => {
      state.latency = action.payload;
    },
  },
});

export const { setIsSocketConnected, setLatency } = socketSlice.actions;
export default socketSlice.reducer;
