import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface FriendActivitiesState {
  data: Types.FriendActivity[];
}

const initialState: FriendActivitiesState = {
  data: [],
};

export const friendActivitiesSlice = createSlice({
  name: 'friendActivities',
  initialState,
  reducers: {
    setFriendActivities: (state, action: PayloadAction<Types.FriendActivity[]>) => {
      state.data = action.payload;
    },
    addFriendActivities: (state, action: PayloadAction<Types.FriendActivity[]>) => {
      state.data = state.data.concat(action.payload);
    },
    clearFriendActivities: (state) => {
      state.data = [];
    },
  },
});

export const { setFriendActivities, addFriendActivities, clearFriendActivities } = friendActivitiesSlice.actions;
export default friendActivitiesSlice.reducer;
