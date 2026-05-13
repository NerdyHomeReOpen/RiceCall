# WebRTC Provider Refactor + Reconnection Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 1133-line `src/providers/WebRTC.tsx` into focused domain hooks under `src/hooks/WebRTC/`, keeping the provider entry point unchanged, and add automatic transport reconnection on network failure.

**Architecture:** Extract a `useSharedRefs` hook that centralizes all ~25 refs, then create 6 domain hooks (`useAudioContext`, `useMicAudio`, `useSpeakerAudio`, `useMixAudio`, `useRecording`, `useSFUTransport`) that each receive refs as params. `src/providers/WebRTC.tsx` becomes a thin orchestrator (~100 lines). Reconnection is handled inside `useSFUTransport` via per-transport retry counters and `currentChannelIdRef`.

**Tech Stack:** React hooks, mediasoup-client, Web Audio API, TypeScript strict mode, Next.js (Electron hybrid)

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/hooks/WebRTC/detectSpeaking.ts` |
| Create | `src/hooks/WebRTC/useSharedRefs.ts` |
| Create | `src/hooks/WebRTC/useAudioContext.ts` |
| Create | `src/hooks/WebRTC/useMicAudio.ts` |
| Create | `src/hooks/WebRTC/useSpeakerAudio.ts` |
| Create | `src/hooks/WebRTC/useMixAudio.ts` |
| Create | `src/hooks/WebRTC/useRecording.ts` |
| Create | `src/hooks/WebRTC/useSFUTransport.ts` |
| Rewrite | `src/providers/WebRTC.tsx` |

No other files are modified. Consumers of `useWebRTC` import from the same path and are unaffected.

---

## Task 1: Create `detectSpeaking` utility

This pure function is used by both `useMicAudio` (target `'user'`) and `useSpeakerAudio` (target = remote userId). Extracted from the `detectSpeaking` `useCallback` in the original provider.

**Files:**
- Create: `src/hooks/WebRTC/detectSpeaking.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors related to this file.

---

## Task 2: Create `useSharedRefs`

Centralizes all ref declarations. The `SharedRefs` type is used as the parameter type for all domain hooks.

**Files:**
- Create: `src/hooks/WebRTC/useSharedRefs.ts`

- [ ] **Step 1: Create the file**

```ts
// src/hooks/WebRTC/useSharedRefs.ts
import { useRef } from 'react';
import * as mediasoupClient from 'mediasoup-client';

export const useSharedRefs = () => {
  const rafIdListRef = useRef<{ [userId: string]: number }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const speakerRef = useRef<HTMLAudioElement | null>(null);
  const micNodesRef = useRef<{
    stream: MediaStream | null;
    source: MediaStreamAudioSourceNode | null;
    gain: GainNode | null;
  }>({ stream: null, source: null, gain: null });
  const mixNodesRef = useRef<{
    stream: MediaStream | null;
    source: MediaStreamAudioSourceNode | null;
    gain: GainNode | null;
  }>({ stream: null, source: null, gain: null });
  const speakerNodesRef = useRef<{
    [id: string]: {
      stream: MediaStream | null;
      source: MediaStreamAudioSourceNode | null;
      gain: GainNode | null;
      analyser: AnalyserNode | null;
    };
  }>({});
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const outputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderGainRef = useRef<GainNode | null>(null);
  const bitrateRef = useRef<number>(64000);
  const deviceRef = useRef<mediasoupClient.Device>(new mediasoupClient.Device());
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const consumersRef = useRef<{ [producerId: string]: mediasoupClient.types.Consumer }>({});
  const microphoneAmplificationRef = useRef<boolean>(false);
  const inputAudioDeviceRef = useRef<string | null>(null);
  const echoCancellationRef = useRef<boolean>(false);
  const noiseCancellationRef = useRef<boolean>(false);
  const recordBuffersRef = useRef<{
    left: Float32Array<ArrayBufferLike>;
    right: Float32Array<ArrayBufferLike>;
  }[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  return {
    rafIdListRef,
    audioContextRef,
    audioProducerRef,
    speakerRef,
    micNodesRef,
    mixNodesRef,
    speakerNodesRef,
    masterGainNodeRef,
    inputAnalyserRef,
    inputDesRef,
    outputDesRef,
    recorderDesRef,
    recorderGainRef,
    bitrateRef,
    deviceRef,
    sendTransportRef,
    recvTransportRef,
    consumersRef,
    microphoneAmplificationRef,
    inputAudioDeviceRef,
    echoCancellationRef,
    noiseCancellationRef,
    recordBuffersRef,
    recordTimerRef,
  };
};

export type SharedRefs = ReturnType<typeof useSharedRefs>;
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 3: Create `useAudioContext`

Owns AudioContext creation, all shared audio nodes, the speaker `<audio>` element, and the AudioWorklet module. Also contains the click/keydown resume effect.

The `workletCode` string moves here from the original provider.

**Files:**
- Create: `src/hooks/WebRTC/useAudioContext.ts`

- [ ] **Step 1: Create the file**

```ts
// src/hooks/WebRTC/useAudioContext.ts
import { useCallback, useEffect } from 'react';
import type { SharedRefs } from './useSharedRefs';
import * as Store from '@/store';

const workletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffers = [];
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const left = input[0];
    const right = input[1] || input[0];
    this.port.postMessage({ left, right });
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);
`;

export const useAudioContext = (refs: SharedRefs) => {
  const {
    audioContextRef,
    inputDesRef,
    outputDesRef,
    recorderDesRef,
    inputAnalyserRef,
    masterGainNodeRef,
    speakerRef,
  } = refs;

  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    const audioContext = new AudioContext();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    await audioContext.audioWorklet.addModule(
      URL.createObjectURL(new Blob([workletCode], { type: 'text/javascript' })),
    );
    audioContextRef.current = audioContext;

    if (inputDesRef.current) inputDesRef.current.disconnect();
    inputDesRef.current = audioContext.createMediaStreamDestination();

    if (outputDesRef.current) outputDesRef.current.disconnect();
    outputDesRef.current = audioContext.createMediaStreamDestination();

    if (recorderDesRef.current) recorderDesRef.current.disconnect();
    recorderDesRef.current = audioContext.createMediaStreamDestination();

    if (inputAnalyserRef.current) inputAnalyserRef.current.disconnect();
    const inputAnalyser = audioContext.createAnalyser();
    inputAnalyserRef.current = inputAnalyser;
    inputAnalyser.fftSize = 2048;

    if (masterGainNodeRef.current) masterGainNodeRef.current.disconnect();
    const masterGainNode = audioContext.createGain();
    masterGainNodeRef.current = masterGainNode;
    masterGainNode.gain.value = Store.store.getState().webrtc.speakerVolume / 100;
    masterGainNode.connect(outputDesRef.current!);

    if (speakerRef.current) {
      speakerRef.current.srcObject = null;
      speakerRef.current.pause();
      speakerRef.current.remove();
    }
    const speaker = new Audio();
    speaker.srcObject = outputDesRef.current.stream;
    speaker.volume = 1;
    speaker.autoplay = true;
    speaker.style.display = 'none';
    speaker.play().catch(() => {});
    speakerRef.current = speaker;
    document.body.appendChild(speaker);
  }, [audioContextRef, inputDesRef, outputDesRef, recorderDesRef, inputAnalyserRef, masterGainNodeRef, speakerRef]);

  useEffect(() => {
    const initAudioOnInteraction = async () => {
      if (!audioContextRef.current) await initAudioContext();
      else if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    };
    document.addEventListener('click', initAudioOnInteraction, { once: true });
    document.addEventListener('keydown', initAudioOnInteraction, { once: true });
    return () => {
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };
  }, [initAudioContext, audioContextRef]);

  return { initAudioContext };
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 4: Create `useMicAudio`

Owns mic input pipeline, volume control, mute toggle, PTT (press-to-talk), and all mic-related system settings effects.

**Files:**
- Create: `src/hooks/WebRTC/useMicAudio.ts`

- [ ] **Step 1: Create the file**

```ts
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
  playSound: (soundName: string) => void;
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 5: Create `useSpeakerAudio`

Owns per-user remote audio pipeline, speaker volume controls, and the output device settings effect.

**Files:**
- Create: `src/hooks/WebRTC/useSpeakerAudio.ts`

- [ ] **Step 1: Create the file**

```ts
// src/hooks/WebRTC/useSpeakerAudio.ts
import { useCallback, useEffect } from 'react';
import type { SharedRefs } from './useSharedRefs';
import { detectSpeaking } from './detectSpeaking';
import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import Logger from '@/utils/logger';

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
      speaker.play().catch(() => {});
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 6: Create `useMixAudio`

Owns system audio capture pipeline and mix volume control.

**Files:**
- Create: `src/hooks/WebRTC/useMixAudio.ts`

- [ ] **Step 1: Create the file**

```ts
// src/hooks/WebRTC/useMixAudio.ts
import { useCallback } from 'react';
import type { SharedRefs } from './useSharedRefs';
import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import Logger from '@/utils/logger';

interface UseMixAudioDeps {
  initAudioContext: () => Promise<void>;
}

export const useMixAudio = (refs: SharedRefs, { initAudioContext }: UseMixAudioDeps) => {
  const { audioContextRef, inputDesRef, inputAnalyserRef, mixNodesRef, recorderGainRef } = refs;

  const removeMixAudio = useCallback(() => {
    if (mixNodesRef.current) {
      const { stream, source, gain } = mixNodesRef.current;
      if (source) source.disconnect();
      if (gain) gain.disconnect();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      mixNodesRef.current = { stream: null, source: null, gain: null };
    }
  }, [mixNodesRef]);

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
    },
    [initAudioContext, removeMixAudio, audioContextRef, inputDesRef, inputAnalyserRef, mixNodesRef, recorderGainRef],
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 7: Create `useRecording`

Owns AudioWorklet recording, PCM buffer accumulation, encode-and-save on stop.

**Files:**
- Create: `src/hooks/WebRTC/useRecording.ts`

- [ ] **Step 1: Create the file**

```ts
// src/hooks/WebRTC/useRecording.ts
import { useCallback } from 'react';
import type { SharedRefs } from './useSharedRefs';
import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import { encodeAudio } from '@/utils/encodeAudio';

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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 8: Create `useSFUTransport`

Owns mediasoup send/recv transports, consumer lifecycle, socket event subscriptions, status polling, and **reconnection logic**. Two new refs — `currentChannelIdRef` and `sendRetryCountRef`/`recvRetryCountRef` — enable retry without leaking into `SharedRefs`.

**Files:**
- Create: `src/hooks/WebRTC/useSFUTransport.ts`

- [ ] **Step 1: Create the file**

```ts
// src/hooks/WebRTC/useSFUTransport.ts
import { useCallback, useEffect, useRef } from 'react';
import type { SharedRefs } from './useSharedRefs';
import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import Logger from '@/utils/logger';

interface UseSFUTransportDeps {
  initSpeakerAudio: (userId: string, stream: MediaStream) => Promise<void>;
  removeSpeakerAudio: (userId: string) => void;
  startSpeaking: () => void;
  stopSpeaking: () => void;
}

export const useSFUTransport = (
  refs: SharedRefs,
  { initSpeakerAudio, removeSpeakerAudio, startSpeaking, stopSpeaking }: UseSFUTransportDeps,
) => {
  const { audioProducerRef, inputDesRef, bitrateRef, deviceRef, sendTransportRef, recvTransportRef, consumersRef } = refs;

  const currentChannelIdRef = useRef<string | null>(null);
  const sendRetryCountRef = useRef<number>(0);
  const recvRetryCountRef = useRef<number>(0);

  const consumeOne = useCallback(
    async (producerId: string, channelId: string) => {
      const consumerInfo = await ipc.socket
        .emit('SFUCreateConsumer', {
          transportId: recvTransportRef.current!.id,
          producerId,
          rtpCapabilities: deviceRef.current.rtpCapabilities,
          channelId,
        })
        .catch((e) => {
          new Logger('WebRTC').error(`Error creating consumer: ${e}`);
          return null;
        });
      if (!consumerInfo) return;

      const consumer = await recvTransportRef.current!.consume({
        id: consumerInfo.id,
        kind: consumerInfo.kind,
        producerId: consumerInfo.producerId,
        appData: { userId: consumerInfo.userId },
        rtpParameters: consumerInfo.rtpParameters,
      });
      consumersRef.current[producerId] = consumer;

      const userId = consumer.appData.userId;
      if (!userId || typeof userId !== 'string') return;

      const stream = new MediaStream([consumer.track]);
      initSpeakerAudio(userId, stream);

      new Logger('WebRTC').info(`Consumed producer: ${userId}`);
    },
    [initSpeakerAudio, recvTransportRef, deviceRef, consumersRef],
  );

  const unconsumeOne = useCallback(
    async (producerId: string) => {
      const consumer = consumersRef.current[producerId];
      if (!consumer) return;

      const userId = consumer.appData.userId;
      if (!userId || typeof userId !== 'string') return;

      consumer.close();
      delete consumersRef.current[producerId];
      removeSpeakerAudio(userId);

      new Logger('WebRTC').info(`Unconsumed producer: ${userId}`);
    },
    [removeSpeakerAudio, consumersRef],
  );

  const setupSend = useCallback(
    async (channelId: string) => {
      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }

      const transport = await ipc.socket
        .emit('SFUCreateTransport', { direction: 'send', channelId })
        .catch((e) => {
          new Logger('WebRTC').error(`Error creating send transport: ${e}`);
          return null;
        });
      if (!transport) return;

      if (!deviceRef.current.loaded)
        await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

      sendTransportRef.current = deviceRef.current.createSendTransport(transport);

      sendTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
        ipc.socket
          .emit('SFUConnectTransport', { transportId: sendTransportRef.current!.id, dtlsParameters })
          .then(() => {
            new Logger('WebRTC').info('SendTransport connected to SFU');
            cb();
          })
          .catch(eb);
      });

      sendTransportRef.current.on('produce', ({ kind, rtpParameters }, cb, eb) => {
        ipc.socket
          .emit('SFUCreateProducer', { transportId: sendTransportRef.current!.id, kind, rtpParameters, channelId })
          .then(({ id }) => {
            new Logger('WebRTC').info('SendTransport produced to SFU');
            cb({ id });
          })
          .catch(eb);
      });

      sendTransportRef.current.on('connectionstatechange', async (s) => {
        new Logger('WebRTC').info(`SendTransport connection state = ${s}`);

        if (s === 'connected') {
          sendRetryCountRef.current = 0;
        }

        if (s === 'failed' || s === 'disconnected') {
          let info;
          const stats = await sendTransportRef.current?.getStats();
          stats?.forEach((report) => {
            if (report.type === 'candidate-pair') {
              info = {
                state: report.state,
                currentRoundTripTime: report.currentRoundTripTime,
                requestsSent: report.requestsSent,
                responsesReceived: report.responsesReceived,
                localCandidateId: report.localCandidateId,
                remoteCandidateId: report.remoteCandidateId,
              };
            }
          });

          ipc.webrtc.signalStateChange({
            signalState: s,
            userId: localStorage.getItem('userId') || 'unknown-user',
            channelId,
            info,
          });

          new Logger('WebRTC').error(`SendTransport connection stats: ${JSON.stringify(info)}`);

          const retryChannelId = currentChannelIdRef.current;
          if (retryChannelId && sendRetryCountRef.current < 3) {
            sendRetryCountRef.current++;
            const delay = 2000 * sendRetryCountRef.current;
            new Logger('WebRTC').info(`Retrying send transport in ${delay}ms (attempt ${sendRetryCountRef.current})`);
            setTimeout(() => setupSend(retryChannelId), delay);
          }
        }
      });

      const track = inputDesRef.current?.stream.getAudioTracks()[0];
      audioProducerRef.current = await sendTransportRef.current.produce({
        track,
        encodings: [{ maxBitrate: bitrateRef.current }],
        codecOptions: {
          opusStereo: true,
          opusDtx: false,
          opusFec: true,
          opusMaxPlaybackRate: 48000,
          opusMaxAverageBitrate: bitrateRef.current,
        },
        stopTracks: false,
      });
      audioProducerRef.current.on('transportclose', () => {
        new Logger('WebRTC').info('Producer transport closed');
        audioProducerRef.current?.close();
      });
      audioProducerRef.current.on('trackended', () => {
        new Logger('WebRTC').info('Producer track ended');
        audioProducerRef.current?.close();
      });
    },
    [audioProducerRef, inputDesRef, bitrateRef, deviceRef, sendTransportRef],
  );

  const setupRecv = useCallback(
    async (channelId: string) => {
      if (recvTransportRef.current) {
        recvTransportRef.current.close();
        recvTransportRef.current = null;
      }

      const transport = await ipc.socket
        .emit('SFUCreateTransport', { direction: 'recv', channelId })
        .catch((e) => {
          new Logger('WebRTC').error(`Error creating recv transport: ${e}`);
          return null;
        });
      if (!transport) return;

      if (!deviceRef.current.loaded)
        await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

      recvTransportRef.current = deviceRef.current.createRecvTransport(transport);

      recvTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
        ipc.socket
          .emit('SFUConnectTransport', { transportId: recvTransportRef.current!.id, dtlsParameters })
          .then(() => {
            new Logger('WebRTC').info('RecvTransport connected to SFU');
            cb();
          })
          .catch(eb);
      });

      recvTransportRef.current.on('connectionstatechange', (s) => {
        new Logger('WebRTC').info(`RecvTransport connection state = ${s}`);

        if (s === 'connected') {
          recvRetryCountRef.current = 0;
        }

        if (s === 'failed' || s === 'disconnected') {
          const retryChannelId = currentChannelIdRef.current;
          if (retryChannelId && recvRetryCountRef.current < 3) {
            recvRetryCountRef.current++;
            const delay = 2000 * recvRetryCountRef.current;
            new Logger('WebRTC').info(`Retrying recv transport in ${delay}ms (attempt ${recvRetryCountRef.current})`);
            setTimeout(() => setupRecv(retryChannelId), delay);
          }
        }
      });

      for (const producer of transport.producers ?? []) {
        consumeOne(producer.id, channelId).catch((e) => {
          new Logger('WebRTC').error(`Error consuming producer: ${e}`);
        });
      }
    },
    [consumeOne, deviceRef, recvTransportRef],
  );

  const closeSend = useCallback(
    async () => {
      currentChannelIdRef.current = null;
      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }
    },
    [sendTransportRef],
  );

  const closeRecv = useCallback(() => {
    currentChannelIdRef.current = null;
    if (recvTransportRef.current) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }
  }, [recvTransportRef]);

  const takeMic = useCallback(
    async (channelId: string) => {
      if (Store.store.getState().webrtc.isMicTaken) return;
      currentChannelIdRef.current = channelId;
      await setupSend(channelId);
      startSpeaking();
    },
    [setupSend, startSpeaking],
  );

  const releaseMic = useCallback(() => {
    if (!Store.store.getState().webrtc.isMicTaken) return;
    currentChannelIdRef.current = null;
    closeSend();
    stopSpeaking();
  }, [closeSend, stopSpeaking]);

  const muteUser = useCallback(
    (userId: string) => {
      Object.values(consumersRef.current).forEach((consumer) => {
        if (consumer.appData.userId === userId) consumer.pause();
      });
      Store.store.dispatch(Store.setMutedId({ id: userId, value: true }));
      window.localStorage.setItem('muted-by-id', JSON.stringify(Store.store.getState().webrtc.mutedById));
    },
    [consumersRef],
  );

  const unmuteUser = useCallback(
    (userId: string) => {
      Object.values(consumersRef.current).forEach((consumer) => {
        if (consumer.appData.userId === userId) consumer.resume();
      });
      Store.store.dispatch(Store.setMutedId({ id: userId, value: false }));
      window.localStorage.setItem('muted-by-id', JSON.stringify(Store.store.getState().webrtc.mutedById));
    },
    [consumersRef],
  );

  const changeBitrate = useCallback(
    (bitrate: number) => {
      audioProducerRef.current?.setRtpEncodingParameters({ maxBitrate: bitrate });
      bitrateRef.current = bitrate;
    },
    [audioProducerRef, bitrateRef],
  );

  useEffect(() => {
    const unsub = ipc.socket.on('SFUJoined', ({ channelId }: { channelId: string }) => {
      currentChannelIdRef.current = channelId;
      setupRecv(channelId);
    });
    return () => unsub();
  }, [setupRecv]);

  useEffect(() => {
    const unsub = ipc.socket.on('SFULeft', () => {
      closeRecv();
    });
    return () => unsub();
  }, [closeRecv]);

  useEffect(() => {
    const unsub = ipc.socket.on(
      'SFUNewProducer',
      ({ userId, producerId, channelId }: { userId: string; producerId: string; channelId: string }) => {
        new Logger('WebRTC').info(`New producer: ${userId}`);
        consumeOne(producerId, channelId).catch((e) => {
          new Logger('WebRTC').error(`Error consuming producer: ${e}`);
        });
      },
    );
    return () => unsub();
  }, [consumeOne]);

  useEffect(() => {
    const unsub = ipc.socket.on(
      'SFUProducerClosed',
      ({ userId, producerId }: { userId: string; producerId: string }) => {
        new Logger('WebRTC').info(`Producer closed: ${userId}`);
        unconsumeOne(producerId).catch((e) => {
          new Logger('WebRTC').error(`Error unconsuming producer: ${e}`);
        });
      },
    );
    return () => unsub();
  }, [unconsumeOne]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const sendTransport = sendTransportRef.current;
      const recvTransport = recvTransportRef.current;
      const transport = sendTransport || recvTransport;

      if (transport) {
        const s = transport.connectionState;
        if (s === 'connected') Store.store.dispatch(Store.setWebRTC({ status: 'connected' }));
        else if (s === 'failed') Store.store.dispatch(Store.setWebRTC({ status: 'failed' }));
        else if (s === 'new' || s === 'connecting') Store.store.dispatch(Store.setWebRTC({ status: 'connecting' }));
        else Store.store.dispatch(Store.setWebRTC({ status: 'disconnected' }));

        const activeTransport =
          sendTransport && sendTransport.connectionState === 'connected'
            ? sendTransport
            : recvTransport && recvTransport.connectionState === 'connected'
            ? recvTransport
            : null;

        if (activeTransport) {
          const stats = await activeTransport.getStats();
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime) {
                Store.store.dispatch(Store.setWebRTC({ latency: Math.round(report.currentRoundTripTime * 1000) }));
              }
            }
          });
        } else {
          Store.store.dispatch(Store.setWebRTC({ latency: 0 }));
        }
      } else {
        Store.store.dispatch(Store.setWebRTC({ status: 'disconnected', latency: 0 }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sendTransportRef, recvTransportRef]);

  return {
    setupSend,
    setupRecv,
    closeSend,
    closeRecv,
    consumeOne,
    unconsumeOne,
    takeMic,
    releaseMic,
    muteUser,
    unmuteUser,
    changeBitrate,
  };
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

## Task 9: Rewrite `src/providers/WebRTC.tsx`

Replace the file contents entirely. The public API (`useWebRTC`, `WebRTCContextType`, `WebRTCProvider`) is preserved unchanged. The `sfuDiagnosis` effect stays here because it needs `loadServer` from `useLoading`.

**Files:**
- Rewrite: `src/providers/WebRTC.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
// src/providers/WebRTC.tsx
import React, { useCallback, useContext, createContext, useMemo, useEffect } from 'react';

import type * as Types from '@/types';

import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import Logger from '@/utils/logger';

import { useSoundPlayer } from '@/providers/SoundPlayer';
import { useLoading } from '@/providers/Loading';

import { useSharedRefs } from '@/hooks/WebRTC/useSharedRefs';
import { useAudioContext } from '@/hooks/WebRTC/useAudioContext';
import { useMicAudio } from '@/hooks/WebRTC/useMicAudio';
import { useSpeakerAudio } from '@/hooks/WebRTC/useSpeakerAudio';
import { useMixAudio } from '@/hooks/WebRTC/useMixAudio';
import { useRecording } from '@/hooks/WebRTC/useRecording';
import { useSFUTransport } from '@/hooks/WebRTC/useSFUTransport';

interface WebRTCContextType {
  startSpeaking: () => void;
  stopSpeaking: () => void;
  startMixing: () => void;
  stopMixing: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;
  pressSpeakKey: () => void;
  releaseSpeakKey: () => void;
  takeMic: (channelId: string) => void;
  releaseMic: () => void;
  toggleMixMode: () => void;
  toggleRecording: () => void;
  toggleSpeakerMuted: () => void;
  toggleMicMuted: () => void;
  changeBitrate: (bitrate: number) => void;
  changeMicVolume: (volume: number) => void;
  changeMixVolume: (volume: number) => void;
  changeSpeakerVolume: (volume: number) => void;
  addSpeakerVolume: (value?: number) => void;
  subtractSpeakerVolume: (value?: number) => void;
  changeVoiceThreshold: (voiceThreshold: number) => void;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) throw new Error('useWebRTC must be used within a WebRTCProvider');
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
}

const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  const { playSound } = useSoundPlayer();
  const { loadServer } = useLoading();

  const refs = useSharedRefs();
  const { initAudioContext } = useAudioContext(refs);
  const { startSpeaking, stopSpeaking, pressSpeakKey, releaseSpeakKey, changeMicVolume, toggleMicMuted } =
    useMicAudio(refs, { initAudioContext, playSound });
  const { initSpeakerAudio, removeSpeakerAudio, changeSpeakerVolume, addSpeakerVolume, subtractSpeakerVolume, toggleSpeakerMuted } =
    useSpeakerAudio(refs, { initAudioContext });
  const { startMixing, stopMixing, toggleMixMode, changeMixVolume } = useMixAudio(refs, { initAudioContext });
  const { startRecording, stopRecording, toggleRecording } = useRecording(refs, { initAudioContext });
  const { takeMic, releaseMic, muteUser, unmuteUser, changeBitrate } = useSFUTransport(refs, {
    initSpeakerAudio,
    removeSpeakerAudio,
    startSpeaking,
    stopSpeaking,
  });

  const initLocalStorage = useCallback(() => {
    const localMicVolume = window.localStorage.getItem('mic-volume') ?? '100';
    const localSpeakerVolume = window.localStorage.getItem('speaker-volume') ?? '100';
    const localIsMicMuted = window.localStorage.getItem('is-mic-mute') ?? 'false';
    const localIsSpeakerMuted = window.localStorage.getItem('is-speaker-mute') ?? 'false';
    const localMutedById = window.localStorage.getItem('muted-by-id') ?? '{}';
    const localVoiceThreshold = window.localStorage.getItem('voice-threshold') ?? '1';

    Store.store.dispatch(
      Store.setWebRTC({
        micVolume: parseInt(localMicVolume),
        speakerVolume: parseInt(localSpeakerVolume),
        isMicMuted: localIsMicMuted === 'true',
        isSpeakerMuted: localIsSpeakerMuted === 'true',
        mutedById: JSON.parse(localMutedById),
        voiceThreshold: parseInt(localVoiceThreshold),
      }),
    );
  }, []);

  const changeVoiceThreshold = useCallback((voiceThreshold: number) => {
    Store.store.dispatch(Store.setWebRTC({ voiceThreshold }));
    window.localStorage.setItem('voice-threshold', voiceThreshold.toString());
  }, []);

  useEffect(() => {
    initLocalStorage();
    initAudioContext();
  }, [initLocalStorage, initAudioContext]);

  useEffect(() => {
    const unsub = ipc.sfuDiagnosis.onRequest(async () => {
      let info: { transportId?: string; ip?: string; port?: string } | null = null;

      try {
        if (!refs.recvTransportRef.current) {
          new Logger('WebRTC').info('Not in a channel, attempting to join one for diagnosis using standard logic...');

          let targetServer = null;

          const searchResults = await ipc.api.searchServer({ query: '10' });
          targetServer = searchResults.find((s) => s.displayId === '10' || s.serverId === '10');

          if (!targetServer) {
            const userId = window.localStorage.getItem('userId');
            if (userId) {
              const servers = await ipc.api.fetchServers({ userId });
              if (servers && servers.length > 0) {
                targetServer = servers[0];
              }
            }
          }

          if (targetServer) {
            new Logger('WebRTC').info(`Standard joining server: ${targetServer.name} (${targetServer.displayId})`);

            loadServer(targetServer.specialId || targetServer.displayId);
            ipc.socket.send('connectServer', { serverId: targetServer.serverId });

            await new Promise<void>((resolve, reject) => {
              let unsub: () => void = () => {};
              const timeout = setTimeout(() => {
                if (unsub) unsub();
                reject(new Error('Timeout waiting for SFUJoined after standard join'));
              }, 10000);
              unsub = ipc.socket.on('SFUJoined', () => {
                clearTimeout(timeout);
                if (unsub) unsub();
                resolve();
              });
            }).catch((e) => new Logger('WebRTC').error(e.message));

            for (let i = 0; i < 5; i++) {
              if (refs.recvTransportRef.current) break;
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        } else {
          new Logger('WebRTC').info('Already in an SFU session, reusing existing transport for diagnosis.');
        }

        if (refs.recvTransportRef.current) {
          for (let retry = 0; retry < 10; retry++) {
            const stats = await refs.recvTransportRef.current.getStats();
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                info = {
                  transportId: refs.recvTransportRef.current?.id,
                  ip: report.remoteCandidateId ? stats.get(report.remoteCandidateId)?.ip : 'unknown',
                  port: report.remoteCandidateId ? stats.get(report.remoteCandidateId)?.port : 'unknown',
                };
                if (!info.ip || info.ip === 'unknown') {
                  const remoteCandidate = stats.get(report.remoteCandidateId);
                  if (remoteCandidate) {
                    info.ip = remoteCandidate.ip || remoteCandidate.address;
                    info.port = remoteCandidate.port;
                  }
                }
              }
            });

            // if (info && info.ip && info.ip !== 'unknown') break;
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      } catch (e) {
        new Logger('WebRTC').error(`Error getting stats or joining channel: ${e}`);
      }

      ipc.sfuDiagnosis.response(info);
    });
    return () => unsub();
  }, [loadServer, refs.recvTransportRef]);

  const contextValue = useMemo(
    () => ({
      startSpeaking,
      stopSpeaking,
      startMixing,
      stopMixing,
      startRecording,
      stopRecording,
      muteUser,
      unmuteUser,
      pressSpeakKey,
      releaseSpeakKey,
      takeMic,
      releaseMic,
      toggleMixMode,
      toggleRecording,
      toggleSpeakerMuted,
      toggleMicMuted,
      changeBitrate,
      changeMicVolume,
      changeMixVolume,
      changeSpeakerVolume,
      addSpeakerVolume,
      subtractSpeakerVolume,
      changeVoiceThreshold,
    }),
    [
      startSpeaking,
      stopSpeaking,
      startMixing,
      stopMixing,
      startRecording,
      stopRecording,
      muteUser,
      unmuteUser,
      pressSpeakKey,
      releaseSpeakKey,
      takeMic,
      releaseMic,
      toggleMixMode,
      toggleRecording,
      toggleSpeakerMuted,
      toggleMicMuted,
      changeBitrate,
      changeMicVolume,
      changeMixVolume,
      changeSpeakerVolume,
      addSpeakerVolume,
      subtractSpeakerVolume,
      changeVoiceThreshold,
    ],
  );

  return <WebRTCContext.Provider value={contextValue}>{children}</WebRTCContext.Provider>;
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any type errors before proceeding.

---

## Task 10: Commit

- [ ] **Step 1: Stage and verify diff**

```bash
git diff --stat HEAD
```

Expected: shows `src/providers/WebRTC.tsx` modified, 8 new files in `src/hooks/WebRTC/`.

- [ ] **Step 2: Commit**

```bash
git add src/providers/WebRTC.tsx src/hooks/WebRTC/
git commit -m "refactor(WebRTC): split provider into domain hooks + add transport reconnection

- Extract useSharedRefs, useAudioContext, useMicAudio, useSpeakerAudio,
  useMixAudio, useRecording, useSFUTransport into src/hooks/WebRTC/
- detectSpeaking extracted as shared utility function
- providers/WebRTC.tsx reduced to ~110 line orchestrator
- useSFUTransport: auto-retry send/recv transport on failed/disconnected
  (up to 3 attempts, 2s/4s/6s backoff)
- currentChannelIdRef guards against retry after intentional disconnect"
```

---

## Self-Review Notes

- **Spec coverage:** All sections covered — file structure ✓, 6 domain hooks ✓, reconnection ✓, sfuDiagnosis stays in provider ✓
- **Placeholders:** None
- **Type consistency:** `SharedRefs` type flows correctly through all hooks; `UseSFUTransportDeps` adds `stopSpeaking` vs spec (spec didn't specify deps interface explicitly — needed for `releaseMic`)
- **detectSpeaking:** correctly not exported from any hook; both `useMicAudio` and `useSpeakerAudio` import directly from `./detectSpeaking`
