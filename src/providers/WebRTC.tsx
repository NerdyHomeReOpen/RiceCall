import React, { useEffect, useRef, useContext, createContext, useCallback, useMemo } from 'react';
import * as mediasoupClient from 'mediasoup-client';

import { store } from '@/store';
import ipc from '@/ipc';

import type * as Types from '@/types';

import { setWebRTC, setSpeakingId, setMutedId } from '@/store/slices/webrtcSlice';

import { useSoundPlayer } from '@/providers/SoundPlayer';
import { useLoading } from '@/providers/Loading';

import EncodeAudio from '@/utils/encodeAudio';
import Logger from '@/logger';

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
  // Hooks
  const { playSound } = useSoundPlayer();
  const { loadServer } = useLoading();

  // Refs
  const rafIdListRef = useRef<{ [userId: string]: number }>({}); // userId -> rAF id
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const speakerRef = useRef<HTMLAudioElement | null>(null);
  const playSoundRef = useRef(playSound);
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

      if (volumePercent > store.getState().webrtc.voiceThreshold) {
        store.dispatch(setWebRTC({ volumePercent, volumeLevel }));
        audioProducerRef.current?.resume();
        if (!store.getState().webrtc.speakingById[targetId]) {
          store.dispatch(setSpeakingId({ id: targetId, value: true }));
        }
      } else {
        store.dispatch(setWebRTC({ volumePercent: 0, volumeLevel: 0 }));
        audioProducerRef.current?.pause();
        if (store.getState().webrtc.speakingById[targetId]) {
          store.dispatch(setSpeakingId({ id: targetId, value: false }));
        }
      }
    } else {
      if (volume > 0 && !store.getState().webrtc.speakingById[targetId]) {
        store.dispatch(setSpeakingId({ id: targetId, value: true }));
      } else if (volume === 0 && store.getState().webrtc.speakingById[targetId]) {
        store.dispatch(setSpeakingId({ id: targetId, value: false }));
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

    store.dispatch(
      setWebRTC({
        micVolume: parseInt(localMicVolume),
        speakerVolume: parseInt(localSpeakerVolume),
        isMicMuted: localIsMicMuted === 'true',
        isSpeakerMuted: localIsSpeakerMuted === 'true',
        mutedById: JSON.parse(localMutedById),
        voiceThreshold: parseInt(localVoiceThreshold),
      }),
    );
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
    masterGainNode.gain.value = store.getState().webrtc.speakerVolume / 100;
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

    store.dispatch(setSpeakingId({ id: userId, value: false }));
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
        track.enabled = !store.getState().webrtc.mutedById[userId];
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

    store.dispatch(setSpeakingId({ id: 'user', value: false }));
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
        const { speakingMode, isSpeakKeyPressed } = store.getState().webrtc;
        track.enabled = speakingMode === 'key' ? isSpeakKeyPressed : true;
      });

      // Create nodes
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = store.getState().webrtc.micVolume / (microphoneAmplificationRef.current ? 20 : 100);

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
      gainNode.gain.value = store.getState().webrtc.mixVolume / 100;

      mixNodesRef.current = { stream: systemStream, source: sourceNode, gain: gainNode };

      sourceNode.connect(gainNode);
      gainNode.connect(inputDesRef.current);
      gainNode.connect(inputAnalyserRef.current);
      if (store.getState().webrtc.isRecording) gainNode.connect(recorderGainRef.current!);

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
    sendTransportRef.current.on('connectionstatechange', async (s) => {
      new Logger('WebRTC').info(`SendTransport connection state = ${s}`);

      if (s != 'failed' && s != 'disconnected') return;

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

      ipc.webrtc.signalStateChange({ signalState: s, userId: localStorage.getItem('userId') || 'unknown-user', channelId, info });

      new Logger('WebRTC').error(`SendTransport connection stats: ${JSON.stringify(info)}`);
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
    const isMicMuted = volume === 0;
    store.dispatch(setWebRTC({ micVolume: volume, isMicMuted }));
    window.localStorage.setItem('mic-volume', volume.toString());
    window.localStorage.setItem('is-mic-mute', isMicMuted.toString());
  }, []);

  const changeMixVolume = useCallback((volume: number) => {
    volume = Math.min(100, Math.max(0, volume));
    if (mixNodesRef.current.gain) mixNodesRef.current.gain.gain.value = volume / 100;
    store.dispatch(setWebRTC({ mixVolume: volume }));
    window.localStorage.setItem('mix-volume', volume.toString());
  }, []);

  const changeSpeakerVolume = useCallback((volume: number) => {
    volume = Math.min(100, Math.max(0, volume));
    if (masterGainNodeRef.current) masterGainNodeRef.current.gain.value = volume / 100;
    const isSpeakerMuted = volume === 0;
    store.dispatch(setWebRTC({ speakerVolume: volume, isSpeakerMuted }));
    window.localStorage.setItem('speaker-volume', volume.toString());
    window.localStorage.setItem('is-speaker-mute', isSpeakerMuted.toString());
  }, []);

  const addSpeakerVolume = useCallback(
    (value: number = BASE_VOLUME) => {
      changeSpeakerVolume(store.getState().webrtc.speakerVolume + value);
    },
    [changeSpeakerVolume],
  );

  const subtractSpeakerVolume = useCallback(
    (value: number = BASE_VOLUME) => {
      changeSpeakerVolume(store.getState().webrtc.speakerVolume - value);
    },
    [changeSpeakerVolume],
  );

  const changeVoiceThreshold = useCallback((voiceThreshold: number) => {
    store.dispatch(setWebRTC({ voiceThreshold }));
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
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
        new Logger('WebRTC').error(`Access input device failed: ${error.message}`);
      });

    store.dispatch(setWebRTC({ isMicTaken: true }));
  }, [initMicAudio]);

  const stopSpeaking = useCallback(() => {
    removeMicAudio();
    store.dispatch(setWebRTC({ isMicTaken: false }));
  }, [removeMicAudio]);

  const startMixing = useCallback(async () => {
    if (!store.getState().webrtc.isMicTaken) return;

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
      .catch((e) => {
        const error = e instanceof Error ? e : new Error('Unknown error');
        new Logger('WebRTC').error(`Error capturing audio from system: ${error.message}`);
      });

    store.dispatch(setWebRTC({ isMixModeActive: true }));
  }, [initMixAudio]);

  const stopMixing = useCallback(() => {
    ipc.loopbackAudio.disable();
    removeMixAudio();
    store.dispatch(setWebRTC({ isMixModeActive: false }));
  }, [removeMixAudio]);

  const startRecording = useCallback(async () => {
    if (!audioContextRef.current || !recorderDesRef.current) {
      initAudioContext();
      return startRecording();
    }

    store.dispatch(setWebRTC({ recordTime: 0 }));
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
      store.dispatch(setWebRTC({ recordTime: store.getState().webrtc.recordTime + 1 }));
    }, 1000);

    store.dispatch(setWebRTC({ isRecording: true }));
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

    store.dispatch(setWebRTC({ isRecording: false }));
  }, [initAudioContext]);

  const muteUser = useCallback((userId: string) => {
    Object.values(consumersRef.current).forEach((consumer) => {
      if (consumer.appData.userId === userId) consumer.pause();
    });
    store.dispatch(setMutedId({ id: userId, value: true }));
    window.localStorage.setItem('muted-by-id', JSON.stringify(store.getState().webrtc.mutedById));
  }, []);

  const unmuteUser = useCallback((userId: string) => {
    Object.values(consumersRef.current).forEach((consumer) => {
      if (consumer.appData.userId === userId) consumer.resume();
    });
    store.dispatch(setMutedId({ id: userId, value: false }));
    window.localStorage.setItem('muted-by-id', JSON.stringify(store.getState().webrtc.mutedById));
  }, []);

  const pressSpeakKey = useCallback(() => {
    const { speakingMode, isMicTaken } = store.getState().webrtc;
    if (speakingMode !== 'key' || !isMicTaken) return;
    playSoundRef.current?.('startSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    store.dispatch(setWebRTC({ isSpeakKeyPressed: true }));
  }, []);

  const releaseSpeakKey = useCallback(() => {
    const { speakingMode, isMicTaken } = store.getState().webrtc;
    if (speakingMode !== 'key' || !isMicTaken) return;
    playSoundRef.current?.('stopSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    store.dispatch(setWebRTC({ isSpeakKeyPressed: false }));
  }, []);

  const takeMic = useCallback(
    async (channelId: string) => {
      if (store.getState().webrtc.isMicTaken) return;
      await setupSend(channelId);
      startSpeaking();
    },
    [setupSend, startSpeaking],
  );

  const releaseMic = useCallback(() => {
    if (!store.getState().webrtc.isMicTaken) return;
    closeSend();
    stopSpeaking();
  }, [closeSend, stopSpeaking]);

  const toggleMixMode = useCallback(() => {
    if (store.getState().webrtc.isMixModeActive) stopMixing();
    else startMixing();
  }, [startMixing, stopMixing]);

  const toggleRecording = useCallback(() => {
    if (store.getState().webrtc.isRecording) stopRecording();
    else startRecording();
  }, [startRecording, stopRecording]);

  const toggleMicMuted = useCallback(() => {
    if (store.getState().webrtc.isMicMuted) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      changeMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', store.getState().webrtc.micVolume.toString() || '50');
      changeMicVolume(0);
    }
  }, [changeMicVolume]);

  const toggleSpeakerMuted = useCallback(() => {
    if (store.getState().webrtc.isSpeakerMuted) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      changeSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', store.getState().webrtc.speakerVolume.toString() || '50');
      changeSpeakerVolume(0);
    }
  }, [changeSpeakerVolume]);

  // Effects
  useEffect(() => {
    initLocalStorage();
    initAudioContext();
  }, [initLocalStorage, initAudioContext]);

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
  }, [initAudioContext]);

  useEffect(() => {
    const changeInputAudioDevice = (inputAudioDevice: string) => {
      new Logger('WebRTC').info(`Input audio device updated: ${inputAudioDevice}`);
      inputAudioDeviceRef.current = inputAudioDevice;
      if (store.getState().webrtc.isMicTaken) startSpeaking();
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
        el.setSinkId(outputAudioDevice).catch((e) => {
          const error = e instanceof Error ? e : new Error('Unknown error');
          new Logger('WebRTC').warn(`Set output device failed: ${error.message}`);
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
      if (store.getState().webrtc.isMicTaken) startSpeaking();
    };
    changeEchoCancellation(ipc.systemSettings.echoCancellation.get());
    const unsub = ipc.systemSettings.echoCancellation.onUpdate(changeEchoCancellation);
    return () => unsub();
  }, [startSpeaking]);

  useEffect(() => {
    const changeNoiseCancellation = (noiseCancellation: boolean) => {
      new Logger('WebRTC').info(`Noise cancellation updated: ${noiseCancellation}`);
      noiseCancellationRef.current = noiseCancellation;
      if (store.getState().webrtc.isMicTaken) startSpeaking();
    };
    changeNoiseCancellation(ipc.systemSettings.noiseCancellation.get());
    const unsub = ipc.systemSettings.noiseCancellation.onUpdate(changeNoiseCancellation);
    return () => unsub();
  }, [startSpeaking]);

  useEffect(() => {
    const changeMicrophoneAmplification = (microphoneAmplification: boolean) => {
      new Logger('WebRTC').info(`Microphone amplification updated: ${microphoneAmplification}`);
      microphoneAmplificationRef.current = microphoneAmplification;
      changeMicVolume(store.getState().webrtc.micVolume || 100);
    };
    changeMicrophoneAmplification(ipc.systemSettings.microphoneAmplification.get());
    const unsub = ipc.systemSettings.microphoneAmplification.onUpdate(changeMicrophoneAmplification);
    return () => unsub();
  }, [changeMicVolume]);

  useEffect(() => {
    const changeSpeakingMode = (speakingMode: Types.SpeakingMode) => {
      new Logger('WebRTC').info(`Speaking mode updated: ${speakingMode}`);
      micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
        track.enabled = speakingMode === 'key' ? store.getState().webrtc.isSpeakKeyPressed : true;
      });
      store.dispatch(setWebRTC({ speakingMode }));
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

  useEffect(() => {
    const unsub = ipc.sfuDiagnosis.onRequest(async () => {
      let info: { transportId?: string; ip?: string; port?: string } | null = null;

      try {
        if (!recvTransportRef.current) {
          new Logger('WebRTC').info('Not in a channel, attempting to join one for diagnosis using standard logic...');

          let targetServer = null;

          const searchResults = await ipc.data.searchServer({ query: '10' });
          targetServer = searchResults.find((s) => s.displayId === '10' || s.serverId === '10');

          if (!targetServer) {
            const userId = window.localStorage.getItem('userId');
            if (userId) {
              const servers = await ipc.data.servers({ userId });
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
              if (recvTransportRef.current) break;
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        } else {
          new Logger('WebRTC').info('Already in an SFU session, reusing existing transport for diagnosis.');
        }

        if (recvTransportRef.current) {
          for (let retry = 0; retry < 10; retry++) {
            const stats = await recvTransportRef.current.getStats();
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                info = {
                  transportId: recvTransportRef.current?.id,
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
  }, [loadServer]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const sendTransport = sendTransportRef.current;
      const recvTransport = recvTransportRef.current;
      const transport = sendTransport || recvTransport;

      if (transport) {
        // Update Status
        const s = transport.connectionState;
        if (s === 'connected') store.dispatch(setWebRTC({ status: 'connected' }));
        else if (s === 'failed') store.dispatch(setWebRTC({ status: 'failed' }));
        else if (s === 'new' || s === 'connecting') store.dispatch(setWebRTC({ status: 'connecting' }));
        else store.dispatch(setWebRTC({ status: 'disconnected' }));

        // Update Latency (prefer sendTransport for RTT, fallback to recvTransport)
        const activeTransport = sendTransport && sendTransport.connectionState === 'connected' ? sendTransport : recvTransport && recvTransport.connectionState === 'connected' ? recvTransport : null;

        if (activeTransport) {
          const stats = await activeTransport.getStats();
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime) {
                store.dispatch(setWebRTC({ latency: Math.round(report.currentRoundTripTime * 1000) }));
              }
            }
          });
        } else {
          store.dispatch(setWebRTC({ latency: 0 }));
        }
      } else {
        store.dispatch(setWebRTC({ status: 'disconnected', latency: 0 }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

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
