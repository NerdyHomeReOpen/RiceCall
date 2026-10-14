import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import type * as Types from '@/types';

export interface WebRTCState {
  isMicTaken: boolean;
  isSpeakKeyPressed: boolean;
  isMixModeActive: boolean;
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  isRecording: boolean;
  volumePercent: number;
  volumeLevel: number;
  micVolume: number;
  mixVolume: number;
  speakerVolume: number;
  voiceThreshold: number;
  speakingMode: Types.SpeakingMode;
  recordTime: number;
  speakingById: Record<string, boolean>;
  mutedById: Record<string, boolean>;
  latency: number;
  status: Types.RTCStatus;
}

const initialState: WebRTCState = {
  isMicTaken: false,
  isSpeakKeyPressed: false,
  isMixModeActive: false,
  isMicMuted: false,
  isSpeakerMuted: false,
  isRecording: false,
  volumePercent: 0,
  volumeLevel: 0,
  micVolume: 100,
  mixVolume: 100,
  speakerVolume: 100,
  voiceThreshold: 1,
  speakingMode: 'key',
  recordTime: 0,
  speakingById: {},
  mutedById: {},
  latency: 0,
  status: 'disconnected',
};

export const webrtcSlice = createSlice({
  name: 'webrtc',
  initialState,
  reducers: {
    setWebRTC: (state, action: PayloadAction<Partial<WebRTCState>>) => {
      return { ...state, ...action.payload };
    },

    setSpeakingId: (state, action: PayloadAction<{ id: string; value: boolean }>) => {
      const { id, value } = action.payload;
      if (value) {
        state.speakingById[id] = true;
      } else {
        delete state.speakingById[id];
      }
    },

    setMutedId: (state, action: PayloadAction<{ id: string; value: boolean }>) => {
      const { id, value } = action.payload;
      if (value) {
        state.mutedById[id] = true;
      } else {
        delete state.mutedById[id];
      }
    },
  },
});

export const { setWebRTC, setSpeakingId, setMutedId } = webrtcSlice.actions;
export default webrtcSlice.reducer;
