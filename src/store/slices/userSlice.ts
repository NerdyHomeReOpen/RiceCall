import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

import * as Default from '@/utils/default';

interface UserState {
  data: Types.User;
}

const initialState: UserState = {
  data: Default.user(),
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Types.User>) => {
      state.data = action.payload;
    },
    updateUser: (state, action: PayloadAction<Partial<Types.User>>) => {
      state.data = { ...state.data, ...action.payload };
    },
    clearUser: (state) => {
      state.data = Default.user();
    },
  },
});

export const { setUser, updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
