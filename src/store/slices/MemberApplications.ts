import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface MemberApplicationsState {
  data: Types.MemberApplication[];
}

const initialState: MemberApplicationsState = {
  data: [],
};

export const memberApplicationsSlice = createSlice({
  name: 'memberApplications',
  initialState,
  reducers: {
    setMemberApplications: (state, action: PayloadAction<Types.MemberApplication[]>) => {
      state.data = action.payload;
    },
    addMemberApplications: (state, action: PayloadAction<{ data: Types.MemberApplication }[]>) => {
      const add = new Set(action.payload.map((i) => `${i.data.userId}#${i.data.serverId}`));
      state.data = state.data.filter((ma) => !add.has(`${ma.userId}#${ma.serverId}`)).concat(action.payload.map((i) => i.data));
    },
    updateMemberApplications: (state, action: PayloadAction<{ userId: string; serverId: string; update: Partial<Types.MemberApplication> }[]>) => {
      const update = new Map(action.payload.map((i) => [`${i.userId}#${i.serverId}`, i.update] as const));
      state.data = state.data.map((ma) => (update.has(`${ma.userId}#${ma.serverId}`) ? { ...ma, ...update.get(`${ma.userId}#${ma.serverId}`) } : ma));
    },
    removeMemberApplications: (state, action: PayloadAction<{ userId: string; serverId: string }[]>) => {
      const remove = new Set(action.payload.map((i) => `${i.userId}#${i.serverId}`));
      state.data = state.data.filter((ma) => !remove.has(`${ma.userId}#${ma.serverId}`));
    },
    clearMemberApplications: (state) => {
      state.data = [];
    },
  },
});

export const { setMemberApplications, addMemberApplications, updateMemberApplications, removeMemberApplications, clearMemberApplications } = memberApplicationsSlice.actions;
export default memberApplicationsSlice.reducer;
