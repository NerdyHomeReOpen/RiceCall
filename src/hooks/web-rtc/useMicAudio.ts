import { useCallback, useEffect } from 'react';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';

import * as Store from '@/store';

import Logger from '@/utils/logger';

import type { SharedRefs } from './useSharedRefs';
import { detectSpeaking } from './detect-speaking';

interface UseMicAudioDeps {
  initAudioContext: () => Promise<void>;
  playSound: (sound: 'startSpeaking' | 'stopSpeaking' | 'enterVoiceChannel' | 'leaveVoiceChannel' | 'receiveChannelMessage' | 'receiveDirectMessage', force?: boolean) => void;
}

export type UseMicAudioResult = {
  initMicAudio: (stream: MediaStream) => Promise<void>;
  removeMicAudio: () => void;
  startSpeaking: () => void;
  stopSpeaking: () => void;
  pressSpeakKey: () => void;
  releaseSpeakKey: () => void;
  changeMicVolume: (volume: number) => void;
  toggleMicMuted: () => void;
};

export const useMicAudio = (refs: SharedRefs, { initAudioContext, playSound }: UseMicAudioDeps): UseMicAudioResult => {
  const {
    audioContextRef,
    inputDesRef,
    inputAnalyserRef,
    micNodesRef,
    rafIdListRef,
    isMicrophoneAmplificationEnabledRef,
    inputAudioDeviceRef,
    isEchoCancellationEnabledRef,
    isNoiseCancellationEnabledRef,
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
        initAudioContext().then(() => initMicAudio(stream));
        return;
      }

      removeMicAudio();

      stream.getAudioTracks().forEach((track) => {
        const { speakingMode, isSpeakKeyPressed } = Store.store.getState().webrtc;
        track.enabled = speakingMode === 'key' ? isSpeakKeyPressed : true;
      });

      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = Store.store.getState().webrtc.micVolume / (isMicrophoneAmplificationEnabledRef.current ? 20 : 100);

      micNodesRef.current = { stream, source: sourceNode, gain: gainNode };

      sourceNode.connect(gainNode);
      gainNode.connect(inputDesRef.current);
      gainNode.connect(inputAnalyserRef.current);

      const dataArray = new Uint8Array(inputAnalyserRef.current.fftSize) as Uint8Array<ArrayBuffer>;

      detectSpeaking('user', inputAnalyserRef.current, dataArray, rafIdListRef, audioProducerRef);

      const newTrack = inputDesRef.current.stream.getAudioTracks()[0];

      if (audioProducerRef.current && !audioProducerRef.current.closed && newTrack) {
        try {
          await audioProducerRef.current.replaceTrack({ track: newTrack });
          audioProducerRef.current.resume();
        } catch (e) {
          new Logger('WEB_RTC').warn(`replaceTrack failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    },
    [removeMicAudio, initAudioContext, audioContextRef, inputDesRef, inputAnalyserRef, micNodesRef, isMicrophoneAmplificationEnabledRef, rafIdListRef, audioProducerRef],
  );

  const startSpeaking = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: 2,
          echoCancellation: isEchoCancellationEnabledRef.current,
          noiseSuppression: isNoiseCancellationEnabledRef.current,
          autoGainControl: false,
          ...(inputAudioDeviceRef.current ? { deviceId: { exact: inputAudioDeviceRef.current } } : {}),
        },
      })
      .then((stream) => {
        initMicAudio(stream);
      })
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
        new Logger('WEB_RTC').error(`Access input device failed: ${error.message}`);
      });

    Store.store.dispatch(Store.setWebRTC({ isMicTaken: true }));
  }, [initMicAudio, isEchoCancellationEnabledRef, isNoiseCancellationEnabledRef, inputAudioDeviceRef]);

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

      if (micNodesRef.current.gain) {
        micNodesRef.current.gain.gain.value = volume / (isMicrophoneAmplificationEnabledRef.current ? 20 : 100);
      }

      const isMicMuted = volume === 0;

      Store.store.dispatch(Store.setWebRTC({ micVolume: volume, isMicMuted }));
      window.localStorage.setItem('mic-volume', volume.toString());
      window.localStorage.setItem('is-mic-mute', isMicMuted.toString());
    },
    [micNodesRef, isMicrophoneAmplificationEnabledRef],
  );

  const toggleMicMuted = useCallback(() => {
    const { isMicMuted } = Store.store.getState().webrtc;
    if (isMicMuted) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      changeMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', Store.store.getState().webrtc.micVolume.toString() || '50');
      changeMicVolume(0);
    }
  }, [changeMicVolume]);

  useEffect(() => {
    const changeInputAudioDevice = (inputAudioDevice: string) => {
      new Logger('WEB_RTC').info(`Input audio device updated: ${inputAudioDevice}`);
      inputAudioDeviceRef.current = inputAudioDevice;
      if (Store.store.getState().webrtc.isMicTaken) startSpeaking();
    };
    changeInputAudioDevice(ipc.systemSettings.inputAudioDevice.get());
    const unsub = ipc.systemSettings.inputAudioDevice.onUpdate(changeInputAudioDevice);
    return () => unsub();
  }, [startSpeaking, inputAudioDeviceRef]);

  useEffect(() => {
    const changeIsEchoCancellationEnabled = (isEchoCancellationEnabled: boolean) => {
      new Logger('WEB_RTC').info(`Echo cancellation updated: ${isEchoCancellationEnabled}`);
      isEchoCancellationEnabledRef.current = isEchoCancellationEnabled;
      if (Store.store.getState().webrtc.isMicTaken) startSpeaking();
    };
    changeIsEchoCancellationEnabled(ipc.systemSettings.isEchoCancellationEnabled.get());
    const unsub = ipc.systemSettings.isEchoCancellationEnabled.onUpdate(changeIsEchoCancellationEnabled);
    return () => unsub();
  }, [startSpeaking, isEchoCancellationEnabledRef]);

  useEffect(() => {
    const changeIsNoiseCancellationEnabled = (isNoiseCancellationEnabled: boolean) => {
      new Logger('WEB_RTC').info(`Noise cancellation updated: ${isNoiseCancellationEnabled}`);
      isNoiseCancellationEnabledRef.current = isNoiseCancellationEnabled;
      if (Store.store.getState().webrtc.isMicTaken) startSpeaking();
    };
    changeIsNoiseCancellationEnabled(ipc.systemSettings.isNoiseCancellationEnabled.get());
    const unsub = ipc.systemSettings.isNoiseCancellationEnabled.onUpdate(changeIsNoiseCancellationEnabled);
    return () => unsub();
  }, [startSpeaking, isNoiseCancellationEnabledRef]);

  useEffect(() => {
    const changeIsMicrophoneAmplificationEnabled = (isMicrophoneAmplificationEnabled: boolean) => {
      new Logger('WEB_RTC').info(`Microphone amplification updated: ${isMicrophoneAmplificationEnabled}`);
      isMicrophoneAmplificationEnabledRef.current = isMicrophoneAmplificationEnabled;
      changeMicVolume(Store.store.getState().webrtc.micVolume || 100);
    };
    changeIsMicrophoneAmplificationEnabled(ipc.systemSettings.isMicrophoneAmplificationEnabled.get());
    const unsub = ipc.systemSettings.isMicrophoneAmplificationEnabled.onUpdate(changeIsMicrophoneAmplificationEnabled);
    return () => unsub();
  }, [changeMicVolume, isMicrophoneAmplificationEnabledRef]);

  useEffect(() => {
    const changeSpeakingMode = (speakingMode: Types.SpeakingMode) => {
      new Logger('WEB_RTC').info(`Speaking mode updated: ${speakingMode}`);
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
