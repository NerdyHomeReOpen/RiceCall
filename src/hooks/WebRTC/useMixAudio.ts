// src/hooks/WebRTC/useMixAudio.ts
import { useCallback } from 'react';
import type { SharedRefs } from './useSharedRefs';
import { detectSpeaking } from './detectSpeaking';
import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import Logger from '@/utils/logger';

interface UseMixAudioDeps {
  initAudioContext: () => Promise<void>;
}

export const useMixAudio = (refs: SharedRefs, { initAudioContext }: UseMixAudioDeps) => {
  const { audioContextRef, inputDesRef, inputAnalyserRef, mixNodesRef, recorderGainRef, rafIdListRef, audioProducerRef } = refs;

  const removeMixAudio = useCallback(() => {
    if (rafIdListRef.current['system']) {
      cancelAnimationFrame(rafIdListRef.current['system']);
      delete rafIdListRef.current['system'];
    }
    if (mixNodesRef.current) {
      const { stream, source, gain } = mixNodesRef.current;
      if (source) source.disconnect();
      if (gain) gain.disconnect();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      mixNodesRef.current = { stream: null, source: null, gain: null };
    }
  }, [mixNodesRef, rafIdListRef]);

  const initMixAudio = useCallback(
    async (systemStream: MediaStream) => {
      if (!audioContextRef.current || !inputDesRef.current || !inputAnalyserRef.current) {
        initAudioContext();
        return initMixAudio(systemStream);
      }

      removeMixAudio();

      systemStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });

      const sourceNode = audioContextRef.current.createMediaStreamSource(systemStream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = Store.store.getState().webrtc.mixVolume / 100;

      mixNodesRef.current = { stream: systemStream, source: sourceNode, gain: gainNode };

      sourceNode.connect(gainNode);
      gainNode.connect(inputDesRef.current);
      gainNode.connect(inputAnalyserRef.current);
      if (Store.store.getState().webrtc.isRecording) gainNode.connect(recorderGainRef.current!);

      const dataArray = new Uint8Array(inputAnalyserRef.current.fftSize) as Uint8Array<ArrayBuffer>;
      detectSpeaking('system', inputAnalyserRef.current, dataArray, rafIdListRef, audioProducerRef);
    },
    [initAudioContext, removeMixAudio, audioContextRef, inputDesRef, inputAnalyserRef, mixNodesRef, recorderGainRef, rafIdListRef, audioProducerRef],
  );

  const startMixing = useCallback(
    async () => {
      if (!Store.store.getState().webrtc.isMicTaken) return;

      ipc.loopbackAudio.enable();
      navigator.mediaDevices
        .getDisplayMedia({
          video: true,
          audio: {
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
        .then((stream) => {
          for (const track of stream.getVideoTracks()) {
            track.stop();
            stream.removeTrack(track);
          }
          initMixAudio(stream);
        })
        .catch((e) => {
          const error = e instanceof Error ? e : new Error('Unknown error');
          new Logger('WebRTC').error(`Error capturing audio from system: ${error.message}`);
        });

      Store.store.dispatch(Store.setWebRTC({ isMixModeActive: true }));
    },
    [initMixAudio],
  );

  const stopMixing = useCallback(() => {
    ipc.loopbackAudio.disable();
    removeMixAudio();
    Store.store.dispatch(Store.setWebRTC({ isMixModeActive: false }));
  }, [removeMixAudio]);

  const toggleMixMode = useCallback(() => {
    if (Store.store.getState().webrtc.isMixModeActive) stopMixing();
    else startMixing();
  }, [startMixing, stopMixing]);

  const changeMixVolume = useCallback(
    (volume: number) => {
      volume = Math.min(100, Math.max(0, volume));
      if (mixNodesRef.current.gain) mixNodesRef.current.gain.gain.value = volume / 100;
      Store.store.dispatch(Store.setWebRTC({ mixVolume: volume }));
      window.localStorage.setItem('mix-volume', volume.toString());
    },
    [mixNodesRef],
  );

  return { initMixAudio, removeMixAudio, startMixing, stopMixing, toggleMixMode, changeMixVolume };
};
