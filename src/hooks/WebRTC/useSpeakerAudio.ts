import { useCallback, useEffect } from 'react';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import Logger from '@/utils/logger';

import type { SharedRefs } from './useSharedRefs';
import { detectSpeaking } from './detectSpeaking';

const BASE_VOLUME = 4;

interface UseSpeakerAudioDeps {
  initAudioContext: () => Promise<void>;
}

export const useSpeakerAudio = (refs: SharedRefs, { initAudioContext }: UseSpeakerAudioDeps) => {
  const {
    audioContextRef,
    outputDesRef,
    masterGainNodeRef,
    speakerNodesRef,
    rafIdListRef,
    speakerRef,
    audioProducerRef,
  } = refs;

  const removeSpeakerAudio = useCallback(
    (userId: string) => {
      if (rafIdListRef.current[userId]) {
        cancelAnimationFrame(rafIdListRef.current[userId]);
        delete rafIdListRef.current[userId];
      }
      if (speakerNodesRef.current[userId]) {
        const { stream, source, gain, analyser } = speakerNodesRef.current[userId];
        if (source) source.disconnect();
        if (gain) gain.disconnect();
        if (analyser) analyser.disconnect();
        if (stream) stream.getTracks().forEach((t) => t.stop());
        delete speakerNodesRef.current[userId];
      }
      Store.store.dispatch(Store.setSpeakingId({ id: userId, value: false }));
    },
    [rafIdListRef, speakerNodesRef],
  );

  const initSpeakerAudio = useCallback(
    async (userId: string, stream: MediaStream) => {
      if (!audioContextRef.current || !outputDesRef.current || !masterGainNodeRef.current) {
        initAudioContext();
        return initSpeakerAudio(userId, stream);
      }

      removeSpeakerAudio(userId);

      stream.getAudioTracks().forEach((track) => {
        track.enabled = !Store.store.getState().webrtc.mutedById[userId];
      });

      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 1;
      const analyserNode = audioContextRef.current.createAnalyser();

      speakerNodesRef.current[userId] = { stream, source: sourceNode, gain: gainNode, analyser: analyserNode };

      sourceNode.connect(gainNode);
      gainNode.connect(analyserNode);
      gainNode.connect(masterGainNodeRef.current);

      analyserNode.fftSize = 2048;
      const dataArray = new Uint8Array(analyserNode.fftSize) as Uint8Array<ArrayBuffer>;
      detectSpeaking(userId, analyserNode, dataArray, rafIdListRef, audioProducerRef);

      const speaker = new Audio();
      speaker.srcObject = stream;
      speaker.volume = 0;
      speaker.autoplay = true;
      speaker.style.display = 'none';
      speaker.play().catch(() => { });
      speaker.remove();
    },
    [removeSpeakerAudio, initAudioContext, audioContextRef, outputDesRef, masterGainNodeRef, speakerNodesRef, rafIdListRef, audioProducerRef],
  );

  const changeSpeakerVolume = useCallback(
    (volume: number) => {
      volume = Math.min(100, Math.max(0, volume));
      if (masterGainNodeRef.current) masterGainNodeRef.current.gain.value = volume / 100;
      const isSpeakerMuted = volume === 0;
      Store.store.dispatch(Store.setWebRTC({ speakerVolume: volume, isSpeakerMuted }));
      window.localStorage.setItem('speaker-volume', volume.toString());
      window.localStorage.setItem('is-speaker-mute', isSpeakerMuted.toString());
    },
    [masterGainNodeRef],
  );

  const addSpeakerVolume = useCallback(
    (value: number = BASE_VOLUME) => {
      changeSpeakerVolume(Store.store.getState().webrtc.speakerVolume + value);
    },
    [changeSpeakerVolume],
  );

  const subtractSpeakerVolume = useCallback(
    (value: number = BASE_VOLUME) => {
      changeSpeakerVolume(Store.store.getState().webrtc.speakerVolume - value);
    },
    [changeSpeakerVolume],
  );

  const toggleSpeakerMuted = useCallback(() => {
    if (Store.store.getState().webrtc.isSpeakerMuted) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      changeSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', Store.store.getState().webrtc.speakerVolume.toString() || '50');
      changeSpeakerVolume(0);
    }
  }, [changeSpeakerVolume]);

  useEffect(() => {
    const changeOutputAudioDevice = (outputAudioDevice: string) => {
      new Logger('WebRTC').info(`Output audio device updated: ${outputAudioDevice}`);
      const el = speakerRef.current;
      if (el && typeof el.setSinkId === 'function') {
        el.setSinkId(outputAudioDevice).catch((e) => {
          const error = e instanceof Error ? e : new Error('Unknown error');
          new Logger('WebRTC').warn(`Set output device failed: ${error.message}`);
        });
      }
    };
    changeOutputAudioDevice(ipc.systemSettings.outputAudioDevice.get());
    const unsub = ipc.systemSettings.outputAudioDevice.onUpdate(changeOutputAudioDevice);
    return () => unsub();
  }, [speakerRef]);

  return {
    initSpeakerAudio,
    removeSpeakerAudio,
    changeSpeakerVolume,
    addSpeakerVolume,
    subtractSpeakerVolume,
    toggleSpeakerMuted,
  };
};
