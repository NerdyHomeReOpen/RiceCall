// src/hooks/WebRTC/detectSpeaking.ts
import type { MutableRefObject } from 'react';
import type * as mediasoupClient from 'mediasoup-client';
import * as Store from '@/store';

export const detectSpeaking = (
  targetId: string,
  analyserNode: AnalyserNode,
  dataArray: Uint8Array<ArrayBuffer>,
  rafIdListRef: MutableRefObject<{ [userId: string]: number }>,
  audioProducerRef: MutableRefObject<mediasoupClient.types.Producer | null>,
): void => {
  analyserNode.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = (dataArray[i] - 128) / 128;
    sum += v * v;
  }
  const volume = Math.sqrt(sum / dataArray.length);

  if (targetId === 'user') {
    const volumePercent = Math.min(100, Math.round((volume / 0.5) * 100) - 1);
    const volumeLevel = Math.ceil(volumePercent / 10) - 1;

    if (volumePercent > Store.store.getState().webrtc.voiceThreshold) {
      Store.store.dispatch(Store.setWebRTC({ volumePercent, volumeLevel }));
      audioProducerRef.current?.resume();
      if (!Store.store.getState().webrtc.speakingById[targetId]) {
        Store.store.dispatch(Store.setSpeakingId({ id: targetId, value: true }));
      }
    } else {
      Store.store.dispatch(Store.setWebRTC({ volumePercent: 0, volumeLevel: 0 }));
      audioProducerRef.current?.pause();
      if (Store.store.getState().webrtc.speakingById[targetId]) {
        Store.store.dispatch(Store.setSpeakingId({ id: targetId, value: false }));
      }
    }
  } else {
    if (volume > 0 && !Store.store.getState().webrtc.speakingById[targetId]) {
      Store.store.dispatch(Store.setSpeakingId({ id: targetId, value: true }));
    } else if (volume === 0 && Store.store.getState().webrtc.speakingById[targetId]) {
      Store.store.dispatch(Store.setSpeakingId({ id: targetId, value: false }));
    }
  }

  rafIdListRef.current[targetId] = requestAnimationFrame(() =>
    detectSpeaking(targetId, analyserNode, dataArray, rafIdListRef, audioProducerRef),
  );
};
