import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type * as Types from '@/types';

import { getDefaultUser } from '@/utils/default';

interface UserState {
  data: Types.User;
}

const initialState: UserState = {
  data: getDefaultUser(),
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
      state.data = getDefaultUser();
    },
  },
});

export const { setUser, updateUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
