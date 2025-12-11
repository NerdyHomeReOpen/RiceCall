import React, { useEffect, useRef, useState, useContext, createContext, useCallback } from 'react';
import * as mediasoupClient from 'mediasoup-client';

// Services
import ipc from '@/services/ipc.service';

// Types
import {
  SpeakingMode,
  SFUCreateConsumerReturnType,
  SFUCreateTransportReturnType,
  SFUCreateProducerReturnType,
  SFUCreateConsumerParams,
  SFUCreateTransportParams,
  SFUCreateProducerParams,
} from '@/types';

// Providers
import { useSoundPlayer } from '@/providers/SoundPlayer';

// Utils
import { encodeAudio } from '@/utils/encodeAudio';

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
  changeVoiceThreshold: (voiceThreshold: number) => void;
  isSpeaking: (targetId: string) => boolean;
  isMuted: (targetId: string) => boolean;
  getVolumePercent: (targetId: string) => number;
  isMicTaken: boolean;
  isSpeakKeyPressed: boolean;
  isMixModeActive: boolean;
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  isRecording: boolean;
  micVolume: number;
  mixVolume: number;
  speakerVolume: number;
  voiceThreshold: number;
  speakingMode: SpeakingMode;
  recordTime: number;
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
  const soundPlayer = useSoundPlayer();

  // Refs
  const rafIdListRef = useRef<{ [userId: string]: number }>({}); // userId -> rAF id
  const lastRefreshRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const speakerRef = useRef<HTMLAudioElement | null>(null);
  const soundPlayerRef = useRef(soundPlayer);

  // Nodes
  const micNodesRef = useRef<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null }>({ stream: null, source: null, gain: null });
  const mixNodesRef = useRef<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null }>({ stream: null, source: null, gain: null });
  const speakerNodesRef = useRef<{ [id: string]: { stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null } }>({});
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const outputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderGainRef = useRef<GainNode | null>(null);

  // Speaking Mode
  const [speakingMode, setSpeakingMode] = useState<SpeakingMode>('key');
  const speakingModeRef = useRef<SpeakingMode>('key');

  // Bitrate
  const bitrateRef = useRef<number>(64000);

  // SFU
  const deviceRef = useRef<mediasoupClient.Device>(new mediasoupClient.Device());
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const consumersRef = useRef<{ [producerId: string]: mediasoupClient.types.Consumer }>({}); // producerId -> consumer

  // States
  const [isMixModeActive, setIsMixModeActive] = useState<boolean>(false);
  const isMixModeActiveRef = useRef(false);

  // Mic
  const isMicTakenRef = useRef<boolean>(false);
  const isSpeakKeyPressedRef = useRef<boolean>(false);
  const isMicMutedRef = useRef<boolean>(false);
  const micVolumeRef = useRef<number>(100);
  const microphoneAmplificationRef = useRef<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [isMicTaken, setIsMicTaken] = useState<boolean>(false);
  const [isSpeakKeyPressed, setIsSpeakKeyPressed] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [inputAudioDevice, setInputAudioDevice] = useState<string | null>(null);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(false);
  const [noiseCancellation, setNoiseCancellation] = useState<boolean>(false);

  // Mix
  const mixVolumeRef = useRef<number>(100);
  const [mixVolume, setMixVolume] = useState<number>(100);

  // Speaker
  const speakerVolumeRef = useRef<number>(100);
  const isSpeakerMutedRef = useRef<boolean>(false);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);

  // Volume Threshold
  const voiceThresholdRef = useRef<number>(1);
  const [voiceThreshold, setVoiceThreshold] = useState<number>(1);

  // Recorder
  const buffersRef = useRef<{ left: Float32Array<ArrayBufferLike>; right: Float32Array<ArrayBufferLike> }[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordTime, setRecordTime] = useState<number>(0);

  // Mute Ids
  const mutedIdsRef = useRef<string[]>([]);
  const [mutedIds, setMutedIds] = useState<string[]>([]);

  // Volume Percent
  const volumePercentRef = useRef<{ [userId: string]: number }>({});
  const [volumePercent, setVolumePercent] = useState<{ [userId: string]: number }>({});

  const detectSpeaking = useCallback((targetId: string | 'user', analyserNode: AnalyserNode, dataArray: Uint8Array<ArrayBuffer>) => {
    analyserNode.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128;
      sum += v * v;
    }
    const volume = Math.sqrt(sum / dataArray.length);
    const volumePercent = Math.min(1, volume / 0.5) * 100;
    volumePercentRef.current[targetId] = volumePercent;

    if (targetId === 'user') {
      if (volumePercent > voiceThresholdRef.current) audioProducerRef.current?.resume();
      else audioProducerRef.current?.pause();
    }

    const now = performance.now();
    if (now - lastRefreshRef.current >= 10) {
      lastRefreshRef.current = now;
      setVolumePercent((prev) => ({ ...prev, ...volumePercentRef.current }));
    }

    rafIdListRef.current[targetId] = requestAnimationFrame(() => detectSpeaking(targetId, analyserNode, dataArray));
  }, []);

  const initLocalStorage = useCallback(() => {
    const localMicVolume = window.localStorage.getItem('mic-volume') ?? '100';
    const localSpeakerVolume = window.localStorage.getItem('speaker-volume') ?? '100';
    const localIsMicMuted = window.localStorage.getItem('is-mic-mute') ?? 'false';
    const localIsSpeakerMuted = window.localStorage.getItem('is-speaker-mute') ?? 'false';
    const localMutedIds = window.localStorage.getItem('muted-ids') ?? '';
    const localVoiceThreshold = window.localStorage.getItem('voice-threshold') ?? '1';

    setMicVolume(parseInt(localMicVolume));
    micVolumeRef.current = parseInt(localMicVolume);
    setSpeakerVolume(parseInt(localSpeakerVolume));
    speakerVolumeRef.current = parseInt(localSpeakerVolume);
    setIsMicMuted(localIsMicMuted === 'true');
    isMicMutedRef.current = localIsMicMuted === 'true';
    setIsSpeakerMuted(localIsSpeakerMuted === 'true');
    isSpeakerMutedRef.current = localIsSpeakerMuted === 'true';
    setMutedIds(localMutedIds.split(','));
    mutedIdsRef.current = localMutedIds.split(',');
    setVoiceThreshold(parseInt(localVoiceThreshold));
    voiceThresholdRef.current = parseInt(localVoiceThreshold);
  }, []);

  const initAudioContext = useCallback(async () => {
    // Create audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    const audioContext = new AudioContext();
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
    masterGainNode.gain.value = speakerVolumeRef.current / 100;
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

    delete volumePercentRef.current[userId];
    setVolumePercent((prev) => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
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
        track.enabled = !mutedIdsRef.current.includes(userId);
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
  }, []);

  const initMicAudio = useCallback(
    async (stream: MediaStream) => {
      if (!audioContextRef.current || !inputDesRef.current || !inputAnalyserRef.current) {
        initAudioContext();
        return initMicAudio(stream);
      }

      // Remove existing mic audio
      removeMicAudio();

      // Disable tracks if muted
      stream.getAudioTracks().forEach((track) => {
        track.enabled = speakingModeRef.current === 'key' ? isSpeakKeyPressedRef.current : true;
      });

      // Create nodes
      const sourceNode = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = micVolumeRef.current / (microphoneAmplificationRef.current ? 20 : 100);

      micNodesRef.current = { stream, source: sourceNode, gain: gainNode };

      // Connect nodes
      sourceNode.connect(gainNode);
      gainNode.connect(inputDesRef.current);
      gainNode.connect(inputAnalyserRef.current);

      // Start speaking detection
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
      gainNode.gain.value = mixVolumeRef.current / 100;

      mixNodesRef.current = { stream: systemStream, source: sourceNode, gain: gainNode };

      sourceNode.connect(gainNode);
      gainNode.connect(inputDesRef.current);
      gainNode.connect(inputAnalyserRef.current);
      if (isRecordingRef.current) gainNode.connect(recorderGainRef.current!);

      // Start speaking detection
      const dataArray = new Uint8Array(inputAnalyserRef.current.fftSize) as Uint8Array<ArrayBuffer>;
      detectSpeaking('system', inputAnalyserRef.current, dataArray);
    },
    [initAudioContext, removeMixAudio, detectSpeaking],
  );

  const consumeOne = useCallback(
    async (producerId: string, channelId: string) => {
      const consumerInfo = await ipc.socket
        .emit<SFUCreateConsumerParams, SFUCreateConsumerReturnType>('SFUCreateConsumer', {
          transportId: recvTransportRef.current!.id,
          producerId,
          rtpCapabilities: deviceRef.current.rtpCapabilities,
          channelId,
        })
        .catch((e) => {
          console.error('[WebRTC] Error creating consumer: ', e);
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

      const userId = consumer.appData.userId as string;
      const stream = new MediaStream([consumer.track]);
      initSpeakerAudio(userId, stream);

      console.info('[WebRTC] Consumed producer: ', userId);
    },
    [initSpeakerAudio],
  );

  const unconsumeOne = useCallback(
    async (producerId: string) => {
      const consumer = consumersRef.current[producerId];
      if (!consumer) return;

      const userId = consumer.appData.userId as string;
      consumer.close();
      delete consumersRef.current[producerId];
      removeSpeakerAudio(userId);

      console.info('[WebRTC] Unconsumed producer: ', userId);
    },
    [removeSpeakerAudio],
  );

  const setupSend = useCallback(async (channelId: string) => {
    if (sendTransportRef.current) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }

    const transport = await ipc.socket
      .emit<SFUCreateTransportParams, SFUCreateTransportReturnType>('SFUCreateTransport', {
        direction: 'send',
        channelId,
      })
      .catch((e) => {
        console.error('[WebRTC] Error creating send transport: ', e);
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
          console.info('[WebRTC] SendTransport connected to SFU');
          cb();
        })
        .catch(eb);
    });
    sendTransportRef.current.on('produce', ({ kind, rtpParameters }, cb, eb) => {
      ipc.socket
        .emit<SFUCreateProducerParams, SFUCreateProducerReturnType>('SFUCreateProducer', {
          transportId: sendTransportRef.current!.id,
          kind,
          rtpParameters,
          channelId,
        })
        .then(({ id }) => {
          console.info('[WebRTC] SendTransport produced to SFU');
          cb({ id });
        })
        .catch(eb);
    });
    sendTransportRef.current.on('connectionstatechange', (s) => {
      console.log('[WebRTC] SendTransport connection state =', s);
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
      console.log('[WebRTC] Producer transport closed');
      audioProducerRef.current?.close();
    });
    audioProducerRef.current.on('trackended', () => {
      console.log('[WebRTC] Producer track ended');
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
        .emit<SFUCreateTransportParams, SFUCreateTransportReturnType>('SFUCreateTransport', {
          direction: 'recv',
          channelId,
        })
        .catch((e) => {
          console.error('[WebRTC] Error creating recv transport: ', e);
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
            console.info('[WebRTC] RecvTransport connected to SFU');
            cb();
          })
          .catch(eb);
      });
      recvTransportRef.current.on('connectionstatechange', (s) => {
        console.log('[WebRTC] RecvTransport connection state =', s);
      });

      // consume existing producers
      for (const producer of transport.producers ?? []) {
        consumeOne(producer.id, channelId).catch((e) => {
          console.error('[WebRTC] Error consuming producer: ', e);
        });
      }
    },
    [consumeOne],
  );

  const closeSend = useCallback(() => {
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
    if (micNodesRef.current.gain) micNodesRef.current.gain.gain.value = volume / (microphoneAmplificationRef.current ? 20 : 100);
    setMicVolume(volume);
    micVolumeRef.current = volume;
    window.localStorage.setItem('mic-volume', volume.toString());
    const isMicMuted = volume === 0;
    setIsMicMuted(isMicMuted);
    isMicMutedRef.current = isMicMuted;
    window.localStorage.setItem('is-mic-mute', isMicMuted.toString());
  }, []);

  const changeMixVolume = useCallback((volume: number) => {
    if (mixNodesRef.current.gain) mixNodesRef.current.gain.gain.value = volume / 100;
    setMixVolume(volume);
    mixVolumeRef.current = volume;
    window.localStorage.setItem('mix-volume', volume.toString());
  }, []);

  const changeSpeakerVolume = useCallback((volume: number) => {
    if (masterGainNodeRef.current) masterGainNodeRef.current.gain.value = volume / 100;
    setSpeakerVolume(volume);
    speakerVolumeRef.current = volume;
    window.localStorage.setItem('speaker-volume', volume.toString());
    const isSpeakerMuted = volume === 0;
    setIsSpeakerMuted(isSpeakerMuted);
    isSpeakerMutedRef.current = isSpeakerMuted;
    window.localStorage.setItem('is-speaker-mute', isSpeakerMuted.toString());
  }, []);

  const changeVoiceThreshold = useCallback((voiceThreshold: number) => {
    setVoiceThreshold(voiceThreshold);
    voiceThresholdRef.current = voiceThreshold;
    window.localStorage.setItem('voice-threshold', voiceThreshold.toString());
  }, []);

  const startMixing = useCallback(async () => {
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
        ipc.loopbackAudio.disable();
        initMixAudio(stream);
      })
      .catch((err) => {
        console.error('[WebRTC] Error capturing audio from system', err);
      });

    setIsMixModeActive(true);
    isMixModeActiveRef.current = true;
  }, [initMixAudio]);

  const stopMixing = useCallback(() => {
    ipc.loopbackAudio.disable();
    removeMixAudio();
    setIsMixModeActive(false);
    isMixModeActiveRef.current = false;
  }, [removeMixAudio]);

  const startRecording = useCallback(async () => {
    if (!audioContextRef.current || !recorderDesRef.current) {
      initAudioContext();
      return startRecording();
    }

    setRecordTime(0);
    recorderGainRef.current = audioContextRef.current.createGain();
    recorderGainRef.current.connect(recorderDesRef.current);

    micNodesRef.current.gain?.connect(recorderGainRef.current);
    mixNodesRef.current.gain?.connect(recorderGainRef.current);
    masterGainNodeRef.current?.connect(recorderGainRef.current);

    const recorderNode = new AudioWorkletNode(audioContextRef.current, 'recorder-processor');
    recorderGainRef.current.connect(recorderNode);

    recorderNode.port.onmessage = (e) => {
      const { left, right } = e.data;
      buffersRef.current.push({ left: left.slice(), right: right.slice() });
    };

    setIsRecording(true);
    isRecordingRef.current = true;
  }, [initAudioContext]);

  const stopRecording = useCallback(() => {
    if (!audioContextRef.current) {
      initAudioContext();
      return stopRecording();
    }

    recorderGainRef.current?.disconnect();
    if (timerRef.current) clearInterval(timerRef.current);

    const arrayBuffer = encodeAudio(buffersRef.current, audioContextRef.current.sampleRate);
    ipc.record.save(arrayBuffer);

    buffersRef.current = [];

    setIsRecording(false);
    isRecordingRef.current = false;
  }, [initAudioContext]);

  const muteUser = useCallback((userId: string) => {
    Object.values(consumersRef.current).forEach((consumer) => {
      if (consumer.appData.userId === userId) consumer.pause();
    });
    setMutedIds((prev) => [...prev, userId]);
    mutedIdsRef.current = [...mutedIdsRef.current, userId];
    window.localStorage.setItem('muted-ids', mutedIdsRef.current.join(','));
  }, []);

  const unmuteUser = useCallback((userId: string) => {
    Object.values(consumersRef.current).forEach((consumer) => {
      if (consumer.appData.userId === userId) consumer.resume();
    });
    setMutedIds((prev) => prev.filter((id) => id !== userId));
    mutedIdsRef.current = [...mutedIdsRef.current.filter((id) => id !== userId)];
    window.localStorage.setItem('muted-ids', mutedIdsRef.current.join(','));
  }, []);

  const pressSpeakKey = useCallback(() => {
    if (speakingModeRef.current !== 'key' || !isMicTakenRef.current) return;
    soundPlayerRef.current.playSound('startSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    setIsSpeakKeyPressed(true);
    isSpeakKeyPressedRef.current = true;
  }, []);

  const releaseSpeakKey = useCallback(() => {
    if (speakingModeRef.current !== 'key' || !isMicTakenRef.current) return;
    soundPlayerRef.current.playSound('stopSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    setIsSpeakKeyPressed(false);
    isSpeakKeyPressedRef.current = false;
  }, []);

  const takeMic = useCallback(
    async (channelId: string) => {
      if (isMicTakenRef.current) return;
      await setupSend(channelId);
      setIsMicTaken(true);
      isMicTakenRef.current = true;
    },
    [setupSend],
  );

  const releaseMic = useCallback(() => {
    if (!isMicTakenRef.current) return;
    closeSend();
    setIsMicTaken(false);
    isMicTakenRef.current = false;
  }, [closeSend]);

  const toggleMixMode = useCallback(() => {
    if (isMixModeActiveRef.current) stopMixing();
    else startMixing();
  }, [startMixing, stopMixing]);

  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) stopRecording();
    else startRecording();
  }, [startRecording, stopRecording]);

  const toggleMicMuted = useCallback(() => {
    if (isMicMutedRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      changeMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', micVolumeRef.current.toString());
      changeMicVolume(0);
    }
  }, [changeMicVolume]);

  const toggleSpeakerMuted = useCallback(() => {
    if (isSpeakerMutedRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      changeSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', speakerVolumeRef.current.toString());
      changeSpeakerVolume(0);
    }
  }, [changeSpeakerVolume]);

  const isSpeaking = useCallback(
    (targetId: string | 'user') => (targetId === 'user' ? isMicTaken && volumePercent['user'] > voiceThreshold : !!volumePercent[targetId]),
    [isMicTaken, volumePercent, voiceThreshold],
  );

  const isMuted = useCallback((targetId: string | 'user') => mutedIds.includes(targetId), [mutedIds]);

  const getVolumePercent = useCallback((targetId: string | 'user') => volumePercent[targetId] ?? 0, [volumePercent]);

  // Effects
  useEffect(() => {
    if (!isRecording) return;
    timerRef.current = setInterval(() => setRecordTime((prev) => prev + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isRecording]);

  useEffect(() => {
    initLocalStorage();
    initAudioContext();
  }, [initAudioContext, initLocalStorage]);

  useEffect(() => {
    if (!isMicTaken) {
      removeMicAudio();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: 2,
          echoCancellation: echoCancellation,
          noiseSuppression: noiseCancellation,
          autoGainControl: false,
          ...(inputAudioDevice ? { deviceId: { exact: inputAudioDevice } } : {}),
        },
      })
      .then((stream) => {
        initMicAudio(stream);
      })
      .catch((err) => {
        console.error('[WebRTC] access input device failed: ', err);
      });
  }, [inputAudioDevice, echoCancellation, noiseCancellation, isMicTaken, initMicAudio, removeMicAudio]);

  useEffect(() => {
    const changeInputAudioDevice = (inputAudioDevice: string) => {
      console.info('[WebRTC] input audio device updated: ', inputAudioDevice);
      setInputAudioDevice(inputAudioDevice);
    };
    changeInputAudioDevice(ipc.systemSettings.inputAudioDevice.get());
    const unsub = ipc.systemSettings.inputAudioDevice.onUpdate(changeInputAudioDevice);
    return () => unsub();
  }, [initMicAudio]);

  useEffect(() => {
    const changeOutputAudioDevice = (outputAudioDevice: string) => {
      console.info('[WebRTC] output audio device updated: ', outputAudioDevice);
      const el = speakerRef.current;
      if (el && typeof el.setSinkId === 'function') {
        el.setSinkId(outputAudioDevice).catch((err) => {
          console.warn('[WebRTC] set output device failed: ', err);
        });
      }
    };
    changeOutputAudioDevice(ipc.systemSettings.outputAudioDevice.get());
    const unsub = ipc.systemSettings.outputAudioDevice.onUpdate(changeOutputAudioDevice);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeEchoCancellation = (echoCancellation: boolean) => {
      console.info('[WebRTC] echo cancellation updated: ', echoCancellation);
      setEchoCancellation(echoCancellation);
    };
    changeEchoCancellation(ipc.systemSettings.echoCancellation.get());
    const unsub = ipc.systemSettings.echoCancellation.onUpdate(changeEchoCancellation);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeNoiseCancellation = (noiseCancellation: boolean) => {
      console.info('[WebRTC] noise cancellation updated: ', noiseCancellation);
      setNoiseCancellation(noiseCancellation);
    };
    changeNoiseCancellation(ipc.systemSettings.noiseCancellation.get());
    const unsub = ipc.systemSettings.noiseCancellation.onUpdate(changeNoiseCancellation);
    return () => unsub();
  }, []);

  useEffect(() => {
    const changeMicrophoneAmplification = (microphoneAmplification: boolean) => {
      console.info('[WebRTC] microphone amplification updated: ', microphoneAmplification);
      microphoneAmplificationRef.current = microphoneAmplification;
      changeMicVolume(micVolumeRef.current);
    };
    changeMicrophoneAmplification(ipc.systemSettings.microphoneAmplification.get());
    const unsub = ipc.systemSettings.microphoneAmplification.onUpdate(changeMicrophoneAmplification);
    return () => unsub();
  }, [changeMicVolume]);

  useEffect(() => {
    const changeSpeakingMode = (speakingMode: SpeakingMode) => {
      console.info('[WebRTC] speaking mode updated: ', speakingMode);
      micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
        track.enabled = speakingMode === 'key' ? isSpeakKeyPressedRef.current : true;
      });
      setSpeakingMode(speakingMode);
      speakingModeRef.current = speakingMode;
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
      console.info('[WebRTC] New producer: ', userId);
      consumeOne(producerId, channelId).catch((e) => {
        console.error('[WebRTC] Error consuming producer: ', e);
      });
    });
    return () => unsub();
  }, [consumeOne]);

  useEffect(() => {
    const unsub = ipc.socket.on('SFUProducerClosed', ({ userId, producerId }: { userId: string; producerId: string }) => {
      console.info('[WebRTC] Producer closed: ', userId);
      unconsumeOne(producerId).catch((e) => {
        console.error('[WebRTC] Error unconsuming producer: ', e);
      });
    });
    return () => unsub();
  }, [unconsumeOne]);

  return (
    <WebRTCContext.Provider
      value={{
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
        changeVoiceThreshold,
        isSpeaking,
        isMuted,
        getVolumePercent,
        isMicTaken,
        isSpeakKeyPressed,
        isMixModeActive,
        isMicMuted,
        isSpeakerMuted,
        isRecording,
        micVolume,
        mixVolume,
        speakerVolume,
        speakingMode,
        voiceThreshold,
        recordTime,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
