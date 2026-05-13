// src/hooks/WebRTC/useMicAudio.ts
import { useCallback, useEffect } from 'react';
import type * as Types from '@/types';
import type { SharedRefs } from './useSharedRefs';
import { detectSpeaking } from './detectSpeaking';
import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import Logger from '@/utils/logger';

interface UseMicAudioDeps {
  initAudioContext: () => Promise<void>;
  playSound: (sound: 'startSpeaking' | 'stopSpeaking' | 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage', force?: boolean) => void;
}

export const useMicAudio = (refs: SharedRefs, { initAudioContext, playSound }: UseMicAudioDeps) => {
  const {
    audioContextRef,
    inputDesRef,
    inputAnalyserRef,
    micNodesRef,
    rafIdListRef,
    microphoneAmplificationRef,
    inputAudioDeviceRef,
    echoCancellationRef,
    noiseCancellationRef,
    audioProducerRef,
  } = refs;

  const removeMicAudio = useCallback(() => {
    if (rafIdListRef.current['user']) {
      cancelAnimationFrame(rafIdListRef.current['user']);
      delete rafIdListRef.current['user'];
    }
    if (micNodesRef.current) {
      const { stream, source, gain } = micNodesRef.current;
      if (source) source.disconnect();
      if (gain) gain.disconnect();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      micNodesRef.current = { stream: null, source: null, gain: null };
    }
    Store.store.dispatch(Store.setSpeakingId({ id: 'user', value: false }));
  }, [rafIdListRef, micNodesRef]);

  const initMicAudio = useCallback(
    async (stream: MediaStream) => {
      if (!audioContextRef.current || !inputDesRef.current || !inputAnalyserRef.current) {
        new Logger('WebRTC').info('initMicAudio: AudioContext not ready, initializing...');
        await initAudioContext();
        return initMicAudio(stream);
      }

      new Logger('WebRTC').info('initMicAudio: Setting up mic audio nodes');
      removeMicAudio();

      stream.getAudioTracks().forEach((track) => {
        const { speakingMode, isSpeakKeyPressed } = Store.store.getState().webrtc;
        track.enabled = speakingMode === 'key' ? isSpeakKeyPressed : true;
      });

      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value =
        Store.store.getState().webrtc.micVolume / (microphoneAmplificationRef.current ? 20 : 100);

      micNodesRef.current = { stream, source: sourceNode, gain: gainNode };

      sourceNode.connect(gainNode);
      gainNode.connect(inputDesRef.current);
      gainNode.connect(inputAnalyserRef.current);

      new Logger('WebRTC').info('initMicAudio: Starting detectSpeaking for user');
      const dataArray = new Uint8Array(inputAnalyserRef.current.fftSize) as Uint8Array<ArrayBuffer>;
      detectSpeaking('user', inputAnalyserRef.current, dataArray, rafIdListRef, audioProducerRef);

      const newTrack = inputDesRef.current.stream.getAudioTracks()[0];
      if (audioProducerRef.current && newTrack) {
        await audioProducerRef.current.replaceTrack({ track: newTrack });
        audioProducerRef.current.resume();
      }
    },
    [removeMicAudio, initAudioContext, audioContextRef, inputDesRef, inputAnalyserRef, micNodesRef, microphoneAmplificationRef, rafIdListRef, audioProducerRef],
  );

  const startSpeaking = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: 2,
          echoCancellation: echoCancellationRef.current,
          noiseSuppression: noiseCancellationRef.current,
          autoGainControl: false,
          ...(inputAudioDeviceRef.current ? { deviceId: { exact: inputAudioDeviceRef.current } } : {}),
        },
      })
      .then((stream) => {
        initMicAudio(stream);
      })
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
        new Logger('WebRTC').error(`Access input device failed: ${error.message}`);
      });

    Store.store.dispatch(Store.setWebRTC({ isMicTaken: true }));
  }, [initMicAudio, echoCancellationRef, noiseCancellationRef, inputAudioDeviceRef]);

  const stopSpeaking = useCallback(() => {
    removeMicAudio();
    Store.store.dispatch(Store.setWebRTC({ isMicTaken: false }));
  }, [removeMicAudio]);

  const pressSpeakKey = useCallback(() => {
    const { speakingMode, isMicTaken } = Store.store.getState().webrtc;
    if (speakingMode !== 'key' || !isMicTaken) return;
    playSound('startSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    Store.store.dispatch(Store.setWebRTC({ isSpeakKeyPressed: true }));
  }, [playSound, micNodesRef]);

  const releaseSpeakKey = useCallback(() => {
    const { speakingMode, isMicTaken } = Store.store.getState().webrtc;
    if (speakingMode !== 'key' || !isMicTaken) return;
    playSound('stopSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    Store.store.dispatch(Store.setWebRTC({ isSpeakKeyPressed: false }));
  }, [playSound, micNodesRef]);

  const changeMicVolume = useCallback(
    (volume: number) => {
      volume = Math.min(100, Math.max(0, volume));
      if (micNodesRef.current.gain)
        micNodesRef.current.gain.gain.value = volume / (microphoneAmplificationRef.current ? 20 : 100);
      const isMicMuted = volume === 0;
      Store.store.dispatch(Store.setWebRTC({ micVolume: volume, isMicMuted }));
      window.localStorage.setItem('mic-volume', volume.toString());
      window.localStorage.setItem('is-mic-mute', isMicMuted.toString());
    },
    [micNodesRef, microphoneAmplificationRef],
  );

  const toggleMicMuted = useCallback(() => {
    if (Store.store.getState().webrtc.isMicMuted) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      changeMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', Store.store.getState().webrtc.micVolume.toString() || '50');
      changeMicVolume(0);
    }
  }, [changeMicVolume]);

  useEffect(() => {
    const changeInputAudioDevice = (inputAudioDevice: string) => {
      new Logger('WebRTC').info(`Input audio device updated: ${inputAudioDevice}`);
      inputAudioDeviceRef.current = inputAudioDevice;
      if (Store.store.getState().webrtc.isMicTaken) startSpeaking();
    };
    changeInputAudioDevice(ipc.systemSettings.inputAudioDevice.get());
    const unsub = ipc.systemSettings.inputAudioDevice.onUpdate(changeInputAudioDevice);
    return () => unsub();
  }, [startSpeaking, inputAudioDeviceRef]);

  useEffect(() => {
    const changeEchoCancellation = (echoCancellation: boolean) => {
      new Logger('WebRTC').info(`Echo cancellation updated: ${echoCancellation}`);
      echoCancellationRef.current = echoCancellation;
      if (Store.store.getState().webrtc.isMicTaken) startSpeaking();
    };
    changeEchoCancellation(ipc.systemSettings.echoCancellation.get());
    const unsub = ipc.systemSettings.echoCancellation.onUpdate(changeEchoCancellation);
    return () => unsub();
  }, [startSpeaking, echoCancellationRef]);

  useEffect(() => {
    const changeNoiseCancellation = (noiseCancellation: boolean) => {
      new Logger('WebRTC').info(`Noise cancellation updated: ${noiseCancellation}`);
      noiseCancellationRef.current = noiseCancellation;
      if (Store.store.getState().webrtc.isMicTaken) startSpeaking();
    };
    changeNoiseCancellation(ipc.systemSettings.noiseCancellation.get());
    const unsub = ipc.systemSettings.noiseCancellation.onUpdate(changeNoiseCancellation);
    return () => unsub();
  }, [startSpeaking, noiseCancellationRef]);

  useEffect(() => {
    const changeMicrophoneAmplification = (microphoneAmplification: boolean) => {
      new Logger('WebRTC').info(`Microphone amplification updated: ${microphoneAmplification}`);
      microphoneAmplificationRef.current = microphoneAmplification;
      changeMicVolume(Store.store.getState().webrtc.micVolume || 100);
    };
    changeMicrophoneAmplification(ipc.systemSettings.microphoneAmplification.get());
    const unsub = ipc.systemSettings.microphoneAmplification.onUpdate(changeMicrophoneAmplification);
    return () => unsub();
  }, [changeMicVolume, microphoneAmplificationRef]);

  useEffect(() => {
    const changeSpeakingMode = (speakingMode: Types.SpeakingMode) => {
      new Logger('WebRTC').info(`Speaking mode updated: ${speakingMode}`);
      micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
        track.enabled = speakingMode === 'key' ? Store.store.getState().webrtc.isSpeakKeyPressed : true;
      });
      Store.store.dispatch(Store.setWebRTC({ speakingMode }));
    };
    changeSpeakingMode(ipc.systemSettings.speakingMode.get());
    const unsub = ipc.systemSettings.speakingMode.onUpdate(changeSpeakingMode);
    return () => unsub();
  }, [micNodesRef]);

  return {
    initMicAudio,
    removeMicAudio,
    startSpeaking,
    stopSpeaking,
    pressSpeakKey,
    releaseSpeakKey,
    changeMicVolume,
    toggleMicMuted,
  };
};
