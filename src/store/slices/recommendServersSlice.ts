import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface RecommendServersState {
  data: Types.RecommendServer[];
}

const initialState: RecommendServersState = {
  data: [],
};

export const recommendServersSlice = createSlice({
  name: 'recommendServers',
  initialState,
  reducers: {
    setRecommendServers: (state, action: PayloadAction<Types.RecommendServer[]>) => {
      state.data = action.payload;
    },
    addRecommendServers: (state, action: PayloadAction<Types.RecommendServer[]>) => {
      state.data = state.data.concat(action.payload);
    },
    clearRecommendServers: (state) => {
      state.data = [];
    },
  },
});

export const { setRecommendServers, addRecommendServers, clearRecommendServers } = recommendServersSlice.actions;
export default recommendServersSlice.reducer;
