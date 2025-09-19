import React, { useEffect, useRef, useState, useContext, createContext, useCallback, useMemo } from 'react';
import * as mediasoupClient from 'mediasoup-client';

// Services
import ipc from '@/services/ipc.service';

// Types
import {
  User,
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

interface WebRTCContextType {
  setUserMuted: (userId: string, muted: boolean) => void;
  setMicTaken: (taken: boolean, channelId: string) => void;
  setSpeakKeyPressed: (pressed: boolean) => void;
  toggleMixMode: () => void;
  toggleRecording: () => void;
  toggleSpeakerMuted: () => void;
  toggleMicMuted: () => void;
  changeBitrate: (newBitrate: number) => void;
  changeMicVolume: (volume: number) => void;
  changeMixVolume: (volume: number) => void;
  changeSpeakerVolume: (volume: number) => void;
  isMicTaken: boolean;
  isSpeakKeyPressed: boolean;
  isMixModeActive: boolean;
  isMicMuted: boolean;
  isSpeakerMuted: boolean;
  isRecording: boolean;
  micVolume: number;
  mixVolume: number;
  speakerVolume: number;
  mutedIds: string[];
  volumePercent: { [userId: string]: number };
  remoteUserStatusList: { [userId: string]: RemoteUserStatus };
}

type RemoteUserStatus = 'connecting' | 'connected' | 'disconnected';

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) throw new Error('useWebRTC must be used within a WebRTCProvider');
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
  userId: User['userId'];
}

const WebRTCProvider = ({ children, userId }: WebRTCProviderProps) => {
  // Providers
  const soundPlayer = useSoundPlayer();

  // Refs
  const rafIdListRef = useRef<{ [userId: string]: number }>({}); // userId -> rAF id
  const lastRefreshRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const speakerRef = useRef<HTMLAudioElement | null>(null);
  const soundPlayerRef = useRef(soundPlayer);

  // Nodes
  const micNodesRef = useRef<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null }>({
    stream: null,
    source: null,
    gain: null,
    analyser: null,
  });
  const mixNodesRef = useRef<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null }>({
    stream: null,
    source: null,
    gain: null,
    analyser: null,
  });
  const speakerNodesRef = useRef<{ [id: string]: { stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null } }>({});
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const inputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const outputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recordDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Speaking Mode
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

  // Mic Volume
  const [micVolume, setMicVolume] = useState<number>(100);
  const [isMicTaken, setIsMicTaken] = useState<boolean>(false);
  const [isSpeakKeyPressed, setIsSpeakKeyPressed] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const isMicTakenRef = useRef<boolean>(false);
  const isSpeakKeyPressedRef = useRef<boolean>(false);
  const isMicMutedRef = useRef<boolean>(false);
  const micVolumeRef = useRef<number>(100);

  // Mix Volume
  const [mixVolume, setMixVolume] = useState<number>(100);
  const mixVolumeRef = useRef<number>(100);

  // Speaker Volume
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);
  const speakerVolumeRef = useRef<number>(100);
  const isSpeakerMutedRef = useRef<boolean>(false);

  // Recorder
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Mute Ids
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const mutedIdsRef = useRef<string[]>([]);

  // Volume Percent
  const volumePercentRef = useRef<{ [userId: string]: number }>({});
  const [volumePercent, setVolumePercent] = useState<{ [userId: string]: number }>({});

  // Remote User Status
  const [remoteUserStatusList, setRemoteUserStatusList] = useState<{ [userId: string]: RemoteUserStatus }>({}); // userId -> status

  // Memos
  const SPEAKING_VOLUME_THRESHOLD = useMemo(() => 1, []);

  const detectSpeaking = useCallback(
    (targetId: string, analyserNode: AnalyserNode, dataArray: Uint8Array) => {
      analyserNode.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      const volumePercent = Math.min(1, volume / 0.5) * 100;
      if (targetId === userId && !isMicTakenRef.current) {
        volumePercentRef.current[targetId] = 0;
      } else {
        volumePercentRef.current[targetId] = volumePercent > SPEAKING_VOLUME_THRESHOLD ? volumePercent : 0;
      }

      const now = performance.now();
      if (now - lastRefreshRef.current >= 80) {
        lastRefreshRef.current = now;
        setVolumePercent((prev) => ({ ...prev, ...volumePercentRef.current }));
      }

      rafIdListRef.current[targetId] = requestAnimationFrame(() => detectSpeaking(targetId, analyserNode, dataArray));
    },
    [SPEAKING_VOLUME_THRESHOLD, userId],
  );

  const initLocalStorage = useCallback(() => {
    const localMicVolume = window.localStorage.getItem('mic-volume') ?? '100';
    const localSpeakerVolume = window.localStorage.getItem('speaker-volume') ?? '100';
    const localIsMicMuted = window.localStorage.getItem('is-mic-mute') ?? 'false';
    const localIsSpeakerMuted = window.localStorage.getItem('is-speaker-mute') ?? 'false';
    const localMutedIds = window.localStorage.getItem('muted-ids') ?? '';

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
  }, []);

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return;

    // Create audio context
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    // Create input destination node
    const inputDestination = audioContext.createMediaStreamDestination();
    inputDesRef.current = inputDestination;

    // Create output destination node
    const outputDestination = audioContext.createMediaStreamDestination();
    outputDesRef.current = outputDestination;

    // Create record destination node
    const recordDestination = audioContext.createMediaStreamDestination();
    recordDesRef.current = recordDestination;

    // Create master gain node
    masterGainNodeRef.current = audioContext.createGain();
    masterGainNodeRef.current.gain.value = speakerVolumeRef.current / 100;
    masterGainNodeRef.current.connect(outputDestination);

    // Create audio element
    const speaker = new Audio();
    speaker.srcObject = outputDesRef.current!.stream;
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
  }, []);

  const initSpeakerAudio = useCallback(
    async (userId: string, stream: MediaStream) => {
      if (!audioContextRef.current) {
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
      analyserNode.connect(masterGainNodeRef.current!);

      // Replace track
      const newStream = outputDesRef.current!.stream;
      if (speakerRef.current && newStream) {
        speakerRef.current.srcObject = newStream;
        speakerRef.current.play().catch((err) => {
          console.warn('Autoplay failed, user gesture needed:', err);
        });
      }

      // Initialize analyser
      analyserNode.fftSize = 2048;
      const dataArray = new Uint8Array(analyserNode.fftSize);
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
    if (rafIdListRef.current[userId]) {
      cancelAnimationFrame(rafIdListRef.current[userId]);
      delete rafIdListRef.current[userId];
    }
    if (micNodesRef.current) {
      const { stream, source, gain, analyser } = micNodesRef.current;
      if (source) source.disconnect();
      if (gain) gain.disconnect();
      if (analyser) analyser.disconnect();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      micNodesRef.current = { stream: null, source: null, gain: null, analyser: null };
    }
  }, [userId]);

  const initMicAudio = useCallback(
    async (stream: MediaStream) => {
      if (!audioContextRef.current) {
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
      gainNode.gain.value = micVolumeRef.current / 20;
      const analyserNode = audioContextRef.current.createAnalyser();

      micNodesRef.current = { stream, source: sourceNode, gain: gainNode, analyser: analyserNode };

      // Connect nodes
      sourceNode.connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(inputDesRef.current!);

      // Replace track
      const newTrack = inputDesRef.current!.stream.getAudioTracks()[0];
      if (audioProducerRef.current && newTrack) {
        await audioProducerRef.current.replaceTrack({ track: newTrack });
        audioProducerRef.current.resume();
      }

      // Initialize analyser
      analyserNode.fftSize = 2048;
      const dataArray = new Uint8Array(analyserNode.fftSize);
      detectSpeaking(userId, analyserNode, dataArray);
    },
    [detectSpeaking, removeMicAudio, initAudioContext, userId],
  );

  const removeMixAudio = useCallback(() => {
    if (rafIdListRef.current['system']) {
      cancelAnimationFrame(rafIdListRef.current['system']);
      delete rafIdListRef.current['system'];
    }
    if (mixNodesRef.current) {
      const { stream, source, gain, analyser } = mixNodesRef.current;
      if (source) source.disconnect();
      if (gain) gain.disconnect();
      if (analyser) analyser.disconnect();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      mixNodesRef.current = { stream: null, source: null, gain: null, analyser: null };
    }
  }, []);

  const initMixMode = useCallback(
    async (systemStream: MediaStream) => {
      if (!audioContextRef.current) {
        initAudioContext();
        return initMixMode(systemStream);
      }

      // stop previous system tracks if needed
      if (mixNodesRef.current.stream) {
        mixNodesRef.current.stream.getTracks().forEach((t) => t.stop());
      }

      // Disable tracks si quieres control
      systemStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });

      const sourceNode = audioContextRef.current.createMediaStreamSource(systemStream);
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = mixVolumeRef.current / 100;
      const analyserNode = audioContextRef.current.createAnalyser();

      mixNodesRef.current = { stream: systemStream, source: sourceNode, gain: gainNode, analyser: analyserNode };

      sourceNode.connect(gainNode);
      gainNode.connect(analyserNode);
      analyserNode.connect(inputDesRef.current!);

      const dataArray = new Uint8Array(analyserNode.fftSize);
      analyserNode.fftSize = 2048;
      detectSpeaking('system', analyserNode, dataArray);
    },
    [initAudioContext, detectSpeaking],
  );

  const startMixMode = useCallback(async () => {
    ipc.loopbackAudio.enable();
    navigator.mediaDevices
      .getDisplayMedia({
        video: true,
        audio: {
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
        initMixMode(stream);
      })
      .catch((err) => {
        console.error('[WebRTC] Error capturing audio from system', err);
      });
  }, [initMixMode]);

  const startRecording = useCallback(() => {
    micNodesRef.current.gain?.connect(recordDesRef.current!);
    mixNodesRef.current.gain?.connect(recordDesRef.current!);
    masterGainNodeRef.current?.connect(recordDesRef.current!);

    const stream = recordDesRef.current!.stream;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';

    const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = mediaRecorder;
    recordChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      const blob = new Blob(recordChunksRef.current, { type: mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `ricecall-room-${ts}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start(1000);
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
  }, []);

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

      setRemoteUserStatusList((prev) => ({
        ...prev,
        [userId]: 'connected',
      }));

      console.info('[WebRTC] Consumed producer: ', userId);
    },
    [initSpeakerAudio],
  );

  const unconsumeOne = useCallback(
    async (producerId: string) => {
      const consumer = consumersRef.current[producerId];
      if (!consumer) return;

      const userId = consumer.appData.userId as string;
      removeSpeakerAudio(userId);
      consumer.close();
      delete consumersRef.current[producerId];

      setRemoteUserStatusList((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

      delete volumePercentRef.current[userId];
      setVolumePercent((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

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
    audioProducerRef.current = await sendTransportRef.current.produce({ track, encodings: [{ maxBitrate: 256000 }], stopTracks: false });
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
        consumeOne(producer.id, channelId).catch(console.error);
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
    bitrateRef.current = bitrate;
  }, []);

  const changeMicVolume = useCallback((volume: number) => {
    micNodesRef.current.gain!.gain.value = volume / 20;
    setMicVolume(volume);
    micVolumeRef.current = volume;
    window.localStorage.setItem('mic-volume', volume.toString());
    const isMicMuted = volume === 0;
    setIsMicMuted(isMicMuted);
    isMicMutedRef.current = isMicMuted;
    window.localStorage.setItem('is-mic-mute', isMicMuted.toString());
  }, []);

  const changeMixVolume = useCallback((volume: number) => {
    mixNodesRef.current.gain!.gain.value = volume / 100;
    setMixVolume(volume);
    mixVolumeRef.current = volume;
    window.localStorage.setItem('mix-volume', volume.toString());
  }, []);

  const changeSpeakerVolume = useCallback((volume: number) => {
    masterGainNodeRef.current!.gain.value = volume / 100;
    setSpeakerVolume(volume);
    speakerVolumeRef.current = volume;
    window.localStorage.setItem('speaker-volume', volume.toString());
    const isSpeakerMuted = volume === 0;
    setIsSpeakerMuted(isSpeakerMuted);
    isSpeakerMutedRef.current = isSpeakerMuted;
    window.localStorage.setItem('is-speaker-mute', isSpeakerMuted.toString());
  }, []);

  const setUserMuted = useCallback((userId: string, muted: boolean) => {
    Object.values(consumersRef.current).forEach((consumer) => {
      if (consumer.appData.userId === userId && muted) consumer.pause();
      else consumer.resume();
    });
    setMutedIds((prev) => (muted ? [...prev, userId] : prev.filter((id) => id !== userId)));
    mutedIdsRef.current = muted ? [...mutedIdsRef.current, userId] : mutedIdsRef.current.filter((id) => id !== userId);
    window.localStorage.setItem('muted-ids', mutedIdsRef.current.join(','));
  }, []);

  const setSpeakKeyPressed = useCallback((enable: boolean) => {
    if (speakingModeRef.current !== 'key') return;
    soundPlayerRef.current.playSound(enable ? 'startSpeaking' : 'stopSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = enable;
    });
    setIsSpeakKeyPressed(enable);
    isSpeakKeyPressedRef.current = enable;
  }, []);

  const setMicTaken = useCallback(
    async (taken: boolean, channelId: string) => {
      if (taken) await setupSend(channelId);
      else closeSend();
      setIsMicTaken(taken);
      isMicTakenRef.current = taken;
    },
    [setupSend, closeSend],
  );

  const toggleMixMode = useCallback(() => {
    if (isMixModeActiveRef.current) removeMixAudio();
    else startMixMode();
    setIsMixModeActive(!isMixModeActiveRef.current);
    isMixModeActiveRef.current = !isMixModeActiveRef.current;
  }, [startMixMode, removeMixAudio]);

  const toggleRecording = useCallback(() => {
    if (isRecordingRef.current) stopRecording();
    else startRecording();
    setIsRecording(!isRecordingRef.current);
    isRecordingRef.current = !isRecordingRef.current;
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
    console.log('[WebRTC] toggleSpeakerMute', isSpeakerMutedRef.current);
    if (isSpeakerMutedRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      changeSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', speakerVolumeRef.current.toString());
      changeSpeakerVolume(0);
    }
  }, [changeSpeakerVolume]);

  const handleSFUJoined = useCallback(
    async ({ channelId }: { channelId: string }) => {
      await setupRecv(channelId);
    },
    [setupRecv],
  );

  const handleSFULeft = useCallback(async () => {
    closeRecv();
  }, [closeRecv]);

  const handleNewProducer = useCallback(
    async ({ userId, producerId, channelId }: { userId: string; producerId: string; channelId: string }) => {
      console.info('[WebRTC] New producer: ', userId);
      consumeOne(producerId, channelId).catch((e) => {
        console.error('[WebRTC] Error consuming producer: ', e);
      });
    },
    [consumeOne],
  );

  const handleProducerClosed = useCallback(
    async ({ userId, producerId }: { userId: string; producerId: string }) => {
      console.info('[WebRTC] Producer closed: ', userId);
      unconsumeOne(producerId).catch((e) => {
        console.error('[WebRTC] Error unconsuming producer: ', e);
      });
    },
    [unconsumeOne],
  );

  const handleEditOutputDevice = useCallback((deviceId: string) => {
    const el = speakerRef.current;
    if (el && typeof el.setSinkId === 'function') {
      el.setSinkId(deviceId).catch((err) => console.warn('[WebRTC] set output device failed: ', err));
    }
  }, []);

  const handleEditInputDevice = useCallback(
    (deviceId: string) => {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          },
        })
        .then(async (stream) => {
          initMicAudio(stream);
        })
        .catch((err) => console.error('[WebRTC] access input device failed: ', err));
    },
    [initMicAudio],
  );

  const handleEditSpeakingMode = (mode: SpeakingMode) => {
    speakingModeRef.current = mode;
  };

  // Effects
  useEffect(() => {
    initAudioContext();
    initLocalStorage();
  }, [initAudioContext, initLocalStorage]);

  useEffect(() => {
    handleEditInputDevice(ipc.systemSettings.inputAudioDevice.get());
    handleEditOutputDevice(ipc.systemSettings.outputAudioDevice.get());
    handleEditSpeakingMode(ipc.systemSettings.speakingMode.get());

    const unsubscribe = [
      ipc.systemSettings.inputAudioDevice.onUpdate(handleEditInputDevice),
      ipc.systemSettings.outputAudioDevice.onUpdate(handleEditOutputDevice),
      ipc.systemSettings.speakingMode.onUpdate(handleEditSpeakingMode),
      ipc.socket.on('SFUJoined', handleSFUJoined),
      ipc.socket.on('SFULeft', handleSFULeft),
      ipc.socket.on('SFUNewProducer', handleNewProducer),
      ipc.socket.on('SFUProducerClosed', handleProducerClosed),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleEditInputDevice, handleEditOutputDevice, handleSFUJoined, handleSFULeft, handleNewProducer, handleProducerClosed]);

  return (
    <WebRTCContext.Provider
      value={{
        setUserMuted,
        setMicTaken,
        setSpeakKeyPressed,
        toggleMixMode,
        toggleRecording,
        toggleSpeakerMuted,
        toggleMicMuted,
        changeBitrate,
        changeMicVolume,
        changeMixVolume,
        changeSpeakerVolume,
        isMicTaken,
        isSpeakKeyPressed,
        isMixModeActive,
        isMicMuted,
        isSpeakerMuted,
        isRecording,
        micVolume,
        mixVolume,
        speakerVolume,
        mutedIds,
        remoteUserStatusList,
        volumePercent,
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
