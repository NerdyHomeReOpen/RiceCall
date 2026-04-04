import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import * as Types from '@/types';

interface MemberInvitationsState {
  data: Types.MemberInvitation[];
}

const initialState: MemberInvitationsState = {
  data: [],
};

export const memberInvitationsSlice = createSlice({
  name: 'memberInvitations',
  initialState,
  reducers: {
    setMemberInvitations: (state, action: PayloadAction<Types.MemberInvitation[]>) => {
      state.data = action.payload;
    },
    addMemberInvitations: (state, action: PayloadAction<{ data: Types.MemberInvitation }[]>) => {
      const add = new Set(action.payload.map((i) => `${i.data.serverId}`));
      state.data = state.data.filter((mi) => !add.has(`${mi.serverId}`)).concat(action.payload.map((i) => i.data));
    },
    updateMemberInvitations: (state, action: PayloadAction<{ serverId: string; update: Partial<Types.MemberInvitation> }[]>) => {
      const update = new Map(action.payload.map((i) => [`${i.serverId}`, i.update] as const));
      state.data = state.data.map((mi) => (update.has(`${mi.serverId}`) ? { ...mi, ...update.get(`${mi.serverId}`) } : mi));
    },
    removeMemberInvitations: (state, action: PayloadAction<{ serverId: string }[]>) => {
      const remove = new Set(action.payload.map((i) => `${i.serverId}`));
      state.data = state.data.filter((mi) => !remove.has(`${mi.serverId}`));
    },
    clearMemberInvitations: (state) => {
      state.data = [];
    },
  },
});

export const { setMemberInvitations, addMemberInvitations, updateMemberInvitations, removeMemberInvitations, clearMemberInvitations } = memberInvitationsSlice.actions;
export default memberInvitationsSlice.reducer;
