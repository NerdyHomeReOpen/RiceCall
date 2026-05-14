import { useCallback } from 'react';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import { encodeAudio } from '@/utils/encodeAudio';

import type { SharedRefs } from './useSharedRefs';

interface UseRecordingDeps {
  initAudioContext: () => Promise<void>;
}

export const useRecording = (refs: SharedRefs, { initAudioContext }: UseRecordingDeps) => {
  const {
    audioContextRef,
    recorderDesRef,
    recorderGainRef,
    micNodesRef,
    mixNodesRef,
    masterGainNodeRef,
    recordBuffersRef,
    recordTimerRef,
  } = refs;

  const startRecording = useCallback(
    async () => {
      if (!audioContextRef.current || !recorderDesRef.current) {
        initAudioContext();
        return startRecording();
      }

      Store.store.dispatch(Store.setWebRTC({ recordTime: 0 }));
      recorderGainRef.current = audioContextRef.current.createGain();
      recorderGainRef.current.connect(recorderDesRef.current);

      micNodesRef.current.gain?.connect(recorderGainRef.current);
      mixNodesRef.current.gain?.connect(recorderGainRef.current);
      masterGainNodeRef.current?.connect(recorderGainRef.current);

      const recorderNode = new AudioWorkletNode(audioContextRef.current, 'recorder-processor');
      recorderGainRef.current.connect(recorderNode);

      recorderNode.port.onmessage = (e) => {
        const { left, right } = e.data;
        recordBuffersRef.current.push({ left: left.slice(), right: right.slice() });
      };

      recordTimerRef.current = setInterval(() => {
        Store.store.dispatch(Store.setWebRTC({ recordTime: Store.store.getState().webrtc.recordTime + 1 }));
      }, 1000);

      Store.store.dispatch(Store.setWebRTC({ isRecording: true }));
    },
    [initAudioContext, audioContextRef, recorderDesRef, recorderGainRef, micNodesRef, mixNodesRef, masterGainNodeRef, recordBuffersRef, recordTimerRef],
  );

  const stopRecording = useCallback(
    () => {
      if (!audioContextRef.current) {
        initAudioContext();
        return stopRecording();
      }

      recorderGainRef.current?.disconnect();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);

      const arrayBuffer = encodeAudio(recordBuffersRef.current, audioContextRef.current.sampleRate);
      ipc.record.save(arrayBuffer);

      recordBuffersRef.current = [];
      recordTimerRef.current = null;

      Store.store.dispatch(Store.setWebRTC({ isRecording: false }));
    },
    [initAudioContext, audioContextRef, recorderGainRef, recordTimerRef, recordBuffersRef],
  );

  const toggleRecording = useCallback(() => {
    if (Store.store.getState().webrtc.isRecording) stopRecording();
    else startRecording();
  }, [startRecording, stopRecording]);

  return { startRecording, stopRecording, toggleRecording };
};
