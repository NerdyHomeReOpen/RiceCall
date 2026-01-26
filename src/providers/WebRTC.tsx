import React, { useEffect, useRef, useContext, createContext, useCallback, useMemo, useSyncExternalStore } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { useSoundPlayer } from '@/providers/SoundPlayer';

import EncodeAudio from '@/utils/encodeAudio';
import Logger from '@/utils/logger';

const BASE_VOLUME = 4;

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

type WebRTCStateSnapshot = {
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
};

type Key = keyof WebRTCStateSnapshot;
type IdKey = 'speakingById' | 'mutedById';

function createWebRTCStore(initial: WebRTCStateSnapshot) {
  let snap = initial;

  const anyListeners = new Set<() => void>();
  const keyListeners = new Map<Key, Set<() => void>>();

  const idListeners = new Map<string, Set<() => void>>();
  const makeIdTopic = (k: IdKey, id: string) => `${k}:${id}`;

  function emitKeys(keys: Key[]) {
    for (const k of keys) keyListeners.get(k)?.forEach((l) => l());
    anyListeners.forEach((l) => l());
  }

  function emitId(k: IdKey, id: string) {
    idListeners.get(makeIdTopic(k, id))?.forEach((l) => l());
  }

  return {
    getSnapshot: () => snap,

    set: (patch: Partial<WebRTCStateSnapshot>) => {
      const changed: Key[] = [];
      const next: WebRTCStateSnapshot = { ...snap };

      (Object.keys(patch) as Key[]).forEach((k) => {
        const v = patch[k];
        if (v !== undefined && !Object.is(next[k], v)) {
          (next as Record<Key, WebRTCStateSnapshot[Key]>)[k] = v;
          changed.push(k);
        }
      });

      if (changed.length === 0) return;
      snap = next;
      emitKeys(changed);
    },

    getId: (k: IdKey, id: string) => !!snap[k]?.[id],

    setId: (k: IdKey, id: string, value: boolean) => {
      const cur = !!snap[k]?.[id];
      if (cur === value) return;

      const nextMap = { ...(snap[k] ?? {}), [id]: value };
      snap = { ...snap, [k]: nextMap } as WebRTCStateSnapshot;

      emitId(k, id);
    },

    subscribe: (l: () => void) => {
      anyListeners.add(l);
      return () => anyListeners.delete(l);
    },

    subscribeKey: (key: Key, l: () => void) => {
      let set = keyListeners.get(key);
      if (!set) keyListeners.set(key, (set = new Set()));
      set.add(l);
      return () => set!.delete(l);
    },

    subscribeId: (k: IdKey, id: string, l: () => void) => {
      const topic = makeIdTopic(k, id);
      let set = idListeners.get(topic);
      if (!set) idListeners.set(topic, (set = new Set()));
      set.add(l);
      return () => set!.delete(l);
    },
  };
}

type WebRTCStore = ReturnType<typeof createWebRTCStore>;

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
const WebRTCStoreContext = createContext<WebRTCStore | null>(null);

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) throw new Error('useWebRTC must be used within a WebRTCProvider');
  return context;
};

export function useWebRTCStore<K extends keyof WebRTCStateSnapshot>(key: K): WebRTCStateSnapshot[K] {
  const store = useContext(WebRTCStoreContext);
  if (!store) throw new Error('useWebRTCStore must be used within WebRTCProvider');

  return useSyncExternalStore(
    (cb) => store.subscribeKey(key, cb),
    () => store.getSnapshot()[key],
  );
}

export function useWebRTCIsSpeaking(userId: string) {
  const store = useContext(WebRTCStoreContext);
  if (!store) throw new Error('useWebRTCIsSpeaking must be used within WebRTCProvider');

  return useSyncExternalStore(
    (cb) => store.subscribeId('speakingById', userId, cb),
    () => store.getId('speakingById', userId),
  );
}

export function useWebRTCIsMuted(userId: string) {
  const store = useContext(WebRTCStoreContext);
  if (!store) throw new Error('useWebRTCIsMuted must be used within WebRTCProvider');

  return useSyncExternalStore(
    (cb) => store.subscribeId('mutedById', userId, cb),
    () => store.getId('mutedById', userId),
  );
}

interface WebRTCProviderProps {
  children: React.ReactNode;
}

const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  // Hooks
  const { playSound } = useSoundPlayer();

  // Refs
  const rafIdListRef = useRef<{ [userId: string]: number }>({}); // userId -> rAF id
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const speakerRef = useRef<HTMLAudioElement | null>(null);
  const playSoundRef = useRef(playSound);
  const storeRef = useRef<WebRTCStore>(
    createWebRTCStore({
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
      mutedById: {},
      speakingById: {},
    }),
  );
  const micNodesRef = useRef<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null }>({ stream: null, source: null, gain: null });
  const mixNodesRef = useRef<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null }>({ stream: null, source: null, gain: null });
  const speakerNodesRef = useRef<{ [id: string]: { stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null } }>({});
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
  const consumersRef = useRef<{ [producerId: string]: mediasoupClient.types.Consumer }>({}); // producerId -> consumer
  const microphoneAmplificationRef = useRef<boolean>(false);
  const inputAudioDeviceRef = useRef<string | null>(null);
  const echoCancellationRef = useRef<boolean>(false);
  const noiseCancellationRef = useRef<boolean>(false);
  const recordBuffersRef = useRef<{ left: Float32Array<ArrayBufferLike>; right: Float32Array<ArrayBufferLike> }[]>([]);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Functions
  const detectSpeaking = useCallback((targetId: string | 'user', analyserNode: AnalyserNode, dataArray: Uint8Array<ArrayBuffer>) => {
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

      if (volumePercent > storeRef.current.getSnapshot().voiceThreshold) {
        storeRef.current.set({ volumePercent: volumePercent, volumeLevel: volumeLevel });
        audioProducerRef.current?.resume();
        const speakingById = storeRef.current.getSnapshot().speakingById;
        if (!speakingById[targetId]) {
          speakingById[targetId] = true;
          storeRef.current.set({ speakingById });
        }
      } else {
        storeRef.current.set({ volumePercent: 0, volumeLevel: 0 });
        audioProducerRef.current?.pause();
        const speakingById = storeRef.current.getSnapshot().speakingById;
        if (speakingById[targetId]) {
          delete speakingById[targetId];
          storeRef.current.set({ speakingById });
        }
      }
    } else {
      const speakingById = storeRef.current.getSnapshot().speakingById;
      if (volume > 0 && !speakingById[targetId]) {
        speakingById[targetId] = true;
        storeRef.current.set({ speakingById });
      } else if (volume === 0 && speakingById[targetId]) {
        delete speakingById[targetId];
        storeRef.current.set({ speakingById });
      }
    }

    rafIdListRef.current[targetId] = requestAnimationFrame(() => detectSpeaking(targetId, analyserNode, dataArray));
  }, []);

  const initLocalStorage = useCallback(() => {
    const localMicVolume = window.localStorage.getItem('mic-volume') ?? '100';
    const localSpeakerVolume = window.localStorage.getItem('speaker-volume') ?? '100';
    const localIsMicMuted = window.localStorage.getItem('is-mic-mute') ?? 'false';
    const localIsSpeakerMuted = window.localStorage.getItem('is-speaker-mute') ?? 'false';
    const localMutedById = window.localStorage.getItem('muted-by-id') ?? '{}';
    const localVoiceThreshold = window.localStorage.getItem('voice-threshold') ?? '1';

    storeRef.current.set({ micVolume: parseInt(localMicVolume) });
    storeRef.current.set({ speakerVolume: parseInt(localSpeakerVolume) });
    storeRef.current.set({ isMicMuted: localIsMicMuted === 'true' });
    storeRef.current.set({ isSpeakerMuted: localIsSpeakerMuted === 'true' });
    storeRef.current.set({ mutedById: JSON.parse(localMutedById) });
    storeRef.current.set({ voiceThreshold: parseInt(localVoiceThreshold) });
  }, []);

  const initAudioContext = useCallback(async () => {
    // Create audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    const audioContext = new AudioContext();
    // Resume AudioContext if suspended (required for browsers after user interaction policy)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    await audioContext.audioWorklet.addModule(URL.createObjectURL(new Blob([workletCode], { type: 'text/javascript' })));
    audioContextRef.current = audioContext;

    // Create input destination node
    if (inputDesRef.current) {
      inputDesRef.current.disconnect();
    }
    const inputDestination = audioContextRef.current.createMediaStreamDestination();
    inputDesRef.current = inputDestination;

    // Create output destination node
    if (outputDesRef.current) {
      outputDesRef.current.disconnect();
    }
    const outputDestination = audioContextRef.current.createMediaStreamDestination();
    outputDesRef.current = outputDestination;

    // Create record destination node
    if (recorderDesRef.current) {
      recorderDesRef.current.disconnect();
    }
    const recordDestination = audioContextRef.current.createMediaStreamDestination();
    recorderDesRef.current = recordDestination;

    // Create input analyser node
    if (inputAnalyserRef.current) {
      inputAnalyserRef.current.disconnect();
    }
    const inputAnalyser = audioContextRef.current.createAnalyser();
    inputAnalyserRef.current = inputAnalyser;
    inputAnalyser.fftSize = 2048;

    // Create master gain node
    if (masterGainNodeRef.current) {
      masterGainNodeRef.current.disconnect();
    }
    const masterGainNode = audioContextRef.current.createGain();
    masterGainNodeRef.current = masterGainNode;
    masterGainNode.gain.value = storeRef.current.getSnapshot().speakerVolume / 100;
    masterGainNode.connect(outputDesRef.current!);

    // Create audio element
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
  }, []);

  const removeSpeakerAudio = useCallback((userId: string) => {
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

    const speakingById = storeRef.current.getSnapshot().speakingById;
    delete speakingById[userId];
    storeRef.current.set({ speakingById });
  }, []);

  const initSpeakerAudio = useCallback(
    async (userId: string, stream: MediaStream) => {
      if (!audioContextRef.current || !outputDesRef.current || !masterGainNodeRef.current) {
        initAudioContext();
        return initSpeakerAudio(userId, stream);
      }

      // Remove existing speaker audio
      removeSpeakerAudio(userId);

      // Disable tracks if muted
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !storeRef.current.getSnapshot().mutedById[userId];
      });

      // Create nodes
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 1;
      const analyserNode = audioContextRef.current.createAnalyser();

      speakerNodesRef.current[userId] = { stream, source: sourceNode, gain: gainNode, analyser: analyserNode };

      // Connect nodes
      sourceNode.connect(gainNode);
      gainNode.connect(analyserNode);
      gainNode.connect(masterGainNodeRef.current);

      // Initialize analyser
      analyserNode.fftSize = 2048;
      const dataArray = new Uint8Array(analyserNode.fftSize) as Uint8Array<ArrayBuffer>;
      detectSpeaking(userId, analyserNode, dataArray);

      // Create audio element to force stream to play
      const speaker = new Audio();
      speaker.srcObject = stream;
      speaker.volume = 0;
      speaker.autoplay = true;
      speaker.style.display = 'none';
      speaker.play().catch(() => {});
      speaker.remove();
    },
    [detectSpeaking, removeSpeakerAudio, initAudioContext],
  );

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

    const speakingById = storeRef.current.getSnapshot().speakingById;
    delete speakingById['user'];
    storeRef.current.set({ speakingById });
  }, []);

  const initMicAudio = useCallback(
    async (stream: MediaStream) => {
      if (!audioContextRef.current || !inputDesRef.current || !inputAnalyserRef.current) {
        new Logger('WebRTC').info('initMicAudio: AudioContext not ready, initializing...');
        await initAudioContext();
        return initMicAudio(stream);
      }

      new Logger('WebRTC').info('initMicAudio: Setting up mic audio nodes');

      // Remove existing mic audio
      removeMicAudio();

      // Disable tracks if muted
      stream.getAudioTracks().forEach((track) => {
        track.enabled = storeRef.current.getSnapshot().speakingMode === 'key' ? storeRef.current.getSnapshot().isSpeakKeyPressed : true;
      });

      // Create nodes
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = storeRef.current.getSnapshot().micVolume / (microphoneAmplificationRef.current ? 20 : 100);

      micNodesRef.current = { stream, source: sourceNode, gain: gainNode };

      // Connect nodes
      sourceNode.connect(gainNode);
      gainNode.connect(inputDesRef.current);
      gainNode.connect(inputAnalyserRef.current);

      // Start speaking detection
      new Logger('WebRTC').info('initMicAudio: Starting detectSpeaking for user');
      const dataArray = new Uint8Array(inputAnalyserRef.current.fftSize) as Uint8Array<ArrayBuffer>;
      detectSpeaking('user', inputAnalyserRef.current, dataArray);

      // Replace track
      const newTrack = inputDesRef.current.stream.getAudioTracks()[0];
      if (audioProducerRef.current && newTrack) {
        await audioProducerRef.current.replaceTrack({ track: newTrack });
        audioProducerRef.current.resume();
      }
    },
    [removeMicAudio, initAudioContext, detectSpeaking],
  );

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
  }, []);

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
      gainNode.gain.value = storeRef.current.getSnapshot().mixVolume / 100;

      mixNodesRef.current = { stream: systemStream, source: sourceNode, gain: gainNode };

      sourceNode.connect(gainNode);
      gainNode.connect(inputDesRef.current);
      gainNode.connect(inputAnalyserRef.current);
      if (storeRef.current.getSnapshot().isRecording) gainNode.connect(recorderGainRef.current!);

      // Start speaking detection
      const dataArray = new Uint8Array(inputAnalyserRef.current.fftSize) as Uint8Array<ArrayBuffer>;
      detectSpeaking('system', inputAnalyserRef.current, dataArray);
    },
    [initAudioContext, removeMixAudio, detectSpeaking],
  );

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
    [initSpeakerAudio],
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
    [removeSpeakerAudio],
  );

  const setupSend = useCallback(async (channelId: string) => {
    if (sendTransportRef.current) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }

    const transport = await ipc.socket
      .emit('SFUCreateTransport', {
        direction: 'send',
        channelId,
      })
      .catch((e) => {
        new Logger('WebRTC').error(`Error creating send transport: ${e}`);
        return null;
      });
    if (!transport) return;

    if (!deviceRef.current.loaded) await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

    sendTransportRef.current = deviceRef.current.createSendTransport(transport);
    sendTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
      ipc.socket
        .emit('SFUConnectTransport', {
          transportId: sendTransportRef.current!.id,
          dtlsParameters,
        })
        .then(() => {
          new Logger('WebRTC').info('SendTransport connected to SFU');
          cb();
        })
        .catch(eb);
    });
    sendTransportRef.current.on('produce', ({ kind, rtpParameters }, cb, eb) => {
      ipc.socket
        .emit('SFUCreateProducer', {
          transportId: sendTransportRef.current!.id,
          kind,
          rtpParameters,
          channelId,
        })
        .then(({ id }) => {
          new Logger('WebRTC').info('SendTransport produced to SFU');
          cb({ id });
        })
        .catch(eb);
    });
    sendTransportRef.current.on('connectionstatechange', (s) => {
      new Logger('WebRTC').info(`SendTransport connection state = ${s}`);
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
  }, []);

  const setupRecv = useCallback(
    async (channelId: string) => {
      if (recvTransportRef.current) {
        recvTransportRef.current.close();
        recvTransportRef.current = null;
      }

      const transport = await ipc.socket
        .emit('SFUCreateTransport', {
          direction: 'recv',
          channelId,
        })
        .catch((e) => {
          new Logger('WebRTC').error(`Error creating recv transport: ${e}`);
          return null;
        });
      if (!transport) return;

      if (!deviceRef.current.loaded) await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

      recvTransportRef.current = deviceRef.current.createRecvTransport(transport);
      recvTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
        ipc.socket
          .emit('SFUConnectTransport', {
            transportId: recvTransportRef.current!.id,
            dtlsParameters,
          })
          .then(() => {
            new Logger('WebRTC').info('RecvTransport connected to SFU');
            cb();
          })
          .catch(eb);
      });
      recvTransportRef.current.on('connectionstatechange', (s) => {
        new Logger('WebRTC').info(`RecvTransport connection state = ${s}`);
      });

      // consume existing producers
      for (const producer of transport.producers ?? []) {
        consumeOne(producer.id, channelId).catch((e) => {
          new Logger('WebRTC').error(`Error consuming producer: ${e}`);
        });
      }
    },
    [consumeOne],
  );

  const closeSend = useCallback(async () => {
    if (sendTransportRef.current) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }
  }, []);

  const closeRecv = useCallback(() => {
    if (recvTransportRef.current) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }
  }, []);

  const changeBitrate = useCallback((bitrate: number) => {
    audioProducerRef.current?.setRtpEncodingParameters({ maxBitrate: bitrate });
    bitrateRef.current = bitrate;
  }, []);

  const changeMicVolume = useCallback((volume: number) => {
    volume = Math.min(100, Math.max(0, volume));
    if (micNodesRef.current.gain) micNodesRef.current.gain.gain.value = volume / (microphoneAmplificationRef.current ? 20 : 100);
    storeRef.current.set({ micVolume: volume });
    window.localStorage.setItem('mic-volume', volume.toString());
    const isMicMuted = volume === 0;
    storeRef.current.set({ isMicMuted: isMicMuted });
    window.localStorage.setItem('is-mic-mute', isMicMuted.toString());
  }, []);

  const changeMixVolume = useCallback((volume: number) => {
    volume = Math.min(100, Math.max(0, volume));
    if (mixNodesRef.current.gain) mixNodesRef.current.gain.gain.value = volume / 100;
    storeRef.current.set({ mixVolume: volume });
    window.localStorage.setItem('mix-volume', volume.toString());
  }, []);

  const changeSpeakerVolume = useCallback((volume: number) => {
    volume = Math.min(100, Math.max(0, volume));
    if (masterGainNodeRef.current) masterGainNodeRef.current.gain.value = volume / 100;
    storeRef.current.set({ speakerVolume: volume });
    window.localStorage.setItem('speaker-volume', volume.toString());
    const isSpeakerMuted = volume === 0;
    storeRef.current.set({ isSpeakerMuted: isSpeakerMuted });
    window.localStorage.setItem('is-speaker-mute', isSpeakerMuted.toString());
  }, []);

  const addSpeakerVolume = useCallback(
    (value: number = BASE_VOLUME) => {
      changeSpeakerVolume(storeRef.current.getSnapshot().speakerVolume + value);
    },
    [changeSpeakerVolume],
  );

  const subtractSpeakerVolume = useCallback(
    (value: number = BASE_VOLUME) => {
      changeSpeakerVolume(storeRef.current.getSnapshot().speakerVolume - value);
    },
    [changeSpeakerVolume],
  );

  const changeVoiceThreshold = useCallback((voiceThreshold: number) => {
    storeRef.current.set({ voiceThreshold: voiceThreshold });
    window.localStorage.setItem('voice-threshold', voiceThreshold.toString());
  }, []);

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
      .catch((err) => {
        new Logger('WebRTC').error(`Access input device failed: ${err}`);
      });

    storeRef.current.set({ isMicTaken: true });
  }, [initMicAudio]);

  const stopSpeaking = useCallback(() => {
    removeMicAudio();
    storeRef.current.set({ isMicTaken: false });
  }, [removeMicAudio]);

  const startMixing = useCallback(async () => {
    if (!storeRef.current.getSnapshot().isMicTaken) return;

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
        // TODO: Add video support
        for (const track of stream.getVideoTracks()) {
          track.stop();
          stream.removeTrack(track);
        }
        initMixAudio(stream);
      })
      .catch((err) => {
        new Logger('WebRTC').error(`Error capturing audio from system: ${err}`);
      });

    storeRef.current.set({ isMixModeActive: true });
  }, [initMixAudio]);

  const stopMixing = useCallback(() => {
    ipc.loopbackAudio.disable();
    removeMixAudio();
    storeRef.current.set({ isMixModeActive: false });
  }, [removeMixAudio]);

  const startRecording = useCallback(async () => {
    if (!audioContextRef.current || !recorderDesRef.current) {
      initAudioContext();
      return startRecording();
    }

    storeRef.current.set({ recordTime: 0 });
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
      storeRef.current.set({ recordTime: storeRef.current.getSnapshot().recordTime + 1 });
    }, 1000);

    storeRef.current.set({ isRecording: true });
  }, [initAudioContext]);

  const stopRecording = useCallback(() => {
    if (!audioContextRef.current) {
      initAudioContext();
      return stopRecording();
    }

    recorderGainRef.current?.disconnect();
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);

    const arrayBuffer = EncodeAudio(recordBuffersRef.current, audioContextRef.current.sampleRate);
    ipc.record.save(arrayBuffer);

    recordBuffersRef.current = [];

    recordTimerRef.current = null;

    storeRef.current.set({ isRecording: false });
  }, [initAudioContext]);

  const muteUser = useCallback((userId: string) => {
    Object.values(consumersRef.current).forEach((consumer) => {
      if (consumer.appData.userId === userId) consumer.pause();
    });
    const mutedById = storeRef.current.getSnapshot().mutedById;
    mutedById[userId] = true;
    storeRef.current.set({ mutedById });
    window.localStorage.setItem('muted-by-id', JSON.stringify(mutedById));
  }, []);

  const unmuteUser = useCallback((userId: string) => {
    Object.values(consumersRef.current).forEach((consumer) => {
      if (consumer.appData.userId === userId) consumer.resume();
    });
    const mutedById = storeRef.current.getSnapshot().mutedById;
    delete mutedById[userId];
    storeRef.current.set({ mutedById });
    window.localStorage.setItem('muted-by-id', JSON.stringify(mutedById));
  }, []);

  const pressSpeakKey = useCallback(() => {
    if (storeRef.current.getSnapshot().speakingMode !== 'key' || !storeRef.current.getSnapshot().isMicTaken) return;
    playSoundRef.current?.('startSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    storeRef.current.set({ isSpeakKeyPressed: true });
  }, []);

  const releaseSpeakKey = useCallback(() => {
    if (storeRef.current.getSnapshot().speakingMode !== 'key' || !storeRef.current.getSnapshot().isMicTaken) return;
    playSoundRef.current?.('stopSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    storeRef.current.set({ isSpeakKeyPressed: false });
  }, []);

  const takeMic = useCallback(
    async (channelId: string) => {
      if (storeRef.current.getSnapshot().isMicTaken) return;
      await setupSend(channelId);
      startSpeaking();
    },
    [setupSend, startSpeaking],
  );

  const releaseMic = useCallback(() => {
    if (!storeRef.current.getSnapshot().isMicTaken) return;
    closeSend();
    stopSpeaking();
  }, [closeSend, stopSpeaking]);

  const toggleMixMode = useCallback(() => {
    if (storeRef.current.getSnapshot().isMixModeActive) stopMixing();
    else startMixing();
  }, [startMixing, stopMixing]);

  const toggleRecording = useCallback(() => {
    if (storeRef.current.getSnapshot().isRecording) stopRecording();
    else startRecording();
  }, [startRecording, stopRecording]);

  const toggleMicMuted = useCallback(() => {
    if (storeRef.current.getSnapshot().isMicMuted) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      changeMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', storeRef.current.getSnapshot().micVolume.toString() || '50');
      changeMicVolume(0);
    }
  }, [changeMicVolume]);

  const toggleSpeakerMuted = useCallback(() => {
    if (storeRef.current.getSnapshot().isSpeakerMuted) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      changeSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', storeRef.current.getSnapshot().speakerVolume.toString() || '50');
      changeSpeakerVolume(0);
    }
  }, [changeSpeakerVolume]);

  // Effects
  useEffect(() => {
    initLocalStorage();
    // Note: initAudioContext is called on first user interaction, not on mount
    // This is required by browser autoplay policy
  }, [initLocalStorage]);

  // Initialize AudioContext on user interaction (required for browsers)
  useEffect(() => {
    const initAudioOnInteraction = async () => {
      if (!audioContextRef.current) {
        await initAudioContext();
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    };
    document.addEventListener('click', initAudioOnInteraction, { once: true });
    document.addEventListener('keydown', initAudioOnInteraction, { once: true });
    return () => {
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect for handling device/settings changes when mic is already taken
  // Note: Initial mic setup is handled by takeMic()
  // const prevMicSettingsRef = useRef<{ inputAudioDevice: string | null; echoCancellation: boolean; noiseCancellation: boolean } | null>(null);
  useEffect(() => {
    const changeInputAudioDevice = (inputAudioDevice: string) => {
      new Logger('WebRTC').info(`Input audio device updated: ${inputAudioDevice}`);
      inputAudioDeviceRef.current = inputAudioDevice;
      if (storeRef.current.getSnapshot().isMicTaken) startSpeaking();
    };
    changeInputAudioDevice(ipc.systemSettings.inputAudioDevice.get());
    const unsub = ipc.systemSettings.inputAudioDevice.onUpdate(changeInputAudioDevice);
    return () => unsub();
  }, [startSpeaking]);

  useEffect(() => {
    const changeOutputAudioDevice = (outputAudioDevice: string) => {
      new Logger('WebRTC').info(`Output audio device updated: ${outputAudioDevice}`);
      const el = speakerRef.current;
      if (el && typeof el.setSinkId === 'function') {
        el.setSinkId(outputAudioDevice).catch((err) => {
          new Logger('WebRTC').warn(`Set output device failed: ${err}`);
        });
      }
    };
    changeOutputAudioDevice(ipc.systemSettings.outputAudioDevice.get());
    const unsub = ipc.systemSettings.outputAudioDevice.onUpdate(changeOutputAudioDevice);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeEchoCancellation = (echoCancellation: boolean) => {
      new Logger('WebRTC').info(`Echo cancellation updated: ${echoCancellation}`);
      echoCancellationRef.current = echoCancellation;
      if (storeRef.current.getSnapshot().isMicTaken) startSpeaking();
    };
    changeEchoCancellation(ipc.systemSettings.echoCancellation.get());
    const unsub = ipc.systemSettings.echoCancellation.onUpdate(changeEchoCancellation);
    return () => unsub();
  }, [startSpeaking]);

  useEffect(() => {
    const changeNoiseCancellation = (noiseCancellation: boolean) => {
      new Logger('WebRTC').info(`Noise cancellation updated: ${noiseCancellation}`);
      noiseCancellationRef.current = noiseCancellation;
      if (storeRef.current.getSnapshot().isMicTaken) startSpeaking();
    };
    changeNoiseCancellation(ipc.systemSettings.noiseCancellation.get());
    const unsub = ipc.systemSettings.noiseCancellation.onUpdate(changeNoiseCancellation);
    return () => unsub();
  }, [startSpeaking]);

  useEffect(() => {
    const changeMicrophoneAmplification = (microphoneAmplification: boolean) => {
      new Logger('WebRTC').info(`Microphone amplification updated: ${microphoneAmplification}`);
      microphoneAmplificationRef.current = microphoneAmplification;
      changeMicVolume(storeRef.current.getSnapshot().micVolume || 100);
    };
    changeMicrophoneAmplification(ipc.systemSettings.microphoneAmplification.get());
    const unsub = ipc.systemSettings.microphoneAmplification.onUpdate(changeMicrophoneAmplification);
    return () => unsub();
  }, [changeMicVolume]);

  useEffect(() => {
    const changeSpeakingMode = (speakingMode: Types.SpeakingMode) => {
      new Logger('WebRTC').info(`Speaking mode updated: ${speakingMode}`);
      micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
        track.enabled = speakingMode === 'key' ? storeRef.current.getSnapshot().isSpeakKeyPressed : true;
      });
      storeRef.current.set({ speakingMode: speakingMode });
    };
    changeSpeakingMode(ipc.systemSettings.speakingMode.get());
    const unsub = ipc.systemSettings.speakingMode.onUpdate(changeSpeakingMode);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = ipc.socket.on('SFUJoined', ({ channelId }: { channelId: string }) => {
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
    const unsub = ipc.socket.on('SFUNewProducer', ({ userId, producerId, channelId }: { userId: string; producerId: string; channelId: string }) => {
      new Logger('WebRTC').info(`New producer: ${userId}`);
      consumeOne(producerId, channelId).catch((e) => {
        new Logger('WebRTC').error(`Error consuming producer: ${e}`);
      });
    });
    return () => unsub();
  }, [consumeOne]);

  useEffect(() => {
    const unsub = ipc.socket.on('SFUProducerClosed', ({ userId, producerId }: { userId: string; producerId: string }) => {
      new Logger('WebRTC').info(`Producer closed: ${userId}`);
      unconsumeOne(producerId).catch((e) => {
        new Logger('WebRTC').error(`Error unconsuming producer: ${e}`);
      });
    });
    return () => unsub();
  }, [unconsumeOne]);

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

  return (
    <WebRTCContext.Provider value={contextValue}>
      <WebRTCStoreContext.Provider value={storeRef.current}>{children}</WebRTCStoreContext.Provider>
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
