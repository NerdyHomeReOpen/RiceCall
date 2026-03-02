import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  selectedItemId: string | null;
}

const initialState: UiState = {
  selectedItemId: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedItemId: (state, action: PayloadAction<string | null>) => {
      state.selectedItemId = action.payload;
    },
  },
});

export const { setSelectedItemId } = uiSlice.actions;
export default uiSlice.reducer;
