import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface AnnouncementsState {
  data: Types.Announcement[];
}

const initialState: AnnouncementsState = {
  data: [],
};

export const announcementsSlice = createSlice({
  name: 'announcements',
  initialState,
  reducers: {
    setAnnouncements: (state, action: PayloadAction<Types.Announcement[]>) => {
      state.data = action.payload;
    },
    addAnnouncements: (state, action: PayloadAction<Types.Announcement[]>) => {
      state.data = state.data.concat(action.payload);
    },
    clearAnnouncements: (state) => {
      state.data = [];
    },
  },
});

export const { setAnnouncements, addAnnouncements, clearAnnouncements } = announcementsSlice.actions;
export default announcementsSlice.reducer;
