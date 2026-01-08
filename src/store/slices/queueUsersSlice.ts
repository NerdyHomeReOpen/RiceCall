import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface QueueUsersState {
  data: Types.QueueUser[];
}

const initialState: QueueUsersState = {
  data: [],
};

export const queueUsersSlice = createSlice({
  name: 'queueUsers',
  initialState,
  reducers: {
    setQueueUsers: (state, action: PayloadAction<Types.QueueUser[]>) => {
      state.data = action.payload;
    },
    clearQueueUsers: (state) => {
      state.data = [];
    },
  },
});

export const { setQueueUsers, clearQueueUsers } = queueUsersSlice.actions;
export default queueUsersSlice.reducer;
