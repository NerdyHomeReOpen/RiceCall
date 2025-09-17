import React, { useEffect, useRef, useState, useContext, createContext, useCallback, useMemo } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import { getSystemAudioStream } from '@/utils/getSystemAudioStream';

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
  setIsUserMuted: (userId: string, muted: boolean) => void;
  setIsMicTaken: (taken: boolean) => void;
  setIsSpeakKeyPressed: (pressed: boolean) => void;
  toggleSpeakerMute: () => void;
  toggleMicMute: () => void;
  changeBitrate: (newBitrate: number) => void;
  changeMicVolume: (volume: number) => void;
  changeMixVolume: (volume: number) => void;
  changeSpeakerVolume: (volume: number) => void;
  toggleMixMode: () => Promise<void>;
  toggleRecord: () => void;   
  isPressingSpeakKey: boolean;
  isMicMute: boolean;
  isSpeakerMute: boolean;
  micVolume: number;
  speakerVolume: number;
  mixVolume: number;
  mutedIds: string[];
  volumePercent: { [userId: string]: number };
  remoteUserStatusList: { [userId: string]: RemoteUserStatus };
  isMixModeActive: boolean;
  isRecording: boolean;  
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
  const volumePercentRef = useRef<{ [userId: string]: number }>({});
  const lastRefreshRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const speakerRef = useRef<HTMLAudioElement | null>(null);
  const soundPlayerRef = useRef(soundPlayer);
  const isSystemAudioActiveRef = useRef(false);
  const [isMixModeActive, setIsMixModeActive] = useState<boolean>(false);

  // Mic
  const isTakingMicRef = useRef<boolean>(false);
  const micMuteRef = useRef<boolean>(false);
  const micVolumeRef = useRef<number>(100);
  const micNodesRef = useRef<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null }>({
    stream: null,
    source: null,
    gain: null,
    analyser: null,
  });
  const inputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  // Mix
  const mixVolumeRef = useRef<number>(100);
  const mixNodesRef = useRef<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null }>({
    stream: null,
    source: null,
    gain: null,
    analyser: null,
  });

  // Recording
  const recordDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<BlobPart[]>([]);
  const isRecordingRef = useRef(false);
  const [isRecording, setIsRecording] = useState(false);

  // Speaker
  const speakerMuteRef = useRef<boolean>(false);
  const speakerVolumeRef = useRef<number>(100);
  const speakerNodesRef = useRef<{ [id: string]: { stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null } }>({});
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const outputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  // Speaking Mode
  const speakingModeRef = useRef<SpeakingMode>('key');
  const isPressSpeakKeyRef = useRef<boolean>(false);
  // Bitrate
  const bitrateRef = useRef<number>(64000);
  // Mute
  const mutedIdsRef = useRef<string[]>([]);
  // SFU
  const deviceRef = useRef<mediasoupClient.Device>(new mediasoupClient.Device());
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const consumersRef = useRef<{ [producerId: string]: mediasoupClient.types.Consumer }>({}); // producerId -> consumer

  // Memos
  const SPEAKING_VOLUME_THRESHOLD = useMemo(() => 2, []);

  // States
  const [isPressingSpeakKey, setIsPressingSpeakKey] = useState<boolean>(false);
  const [isMicMute, setIsMicMute] = useState<boolean>(false);
  const [isSpeakerMute, setIsSpeakerMute] = useState<boolean>(false);
  const [isTakingMic, setIsTakingMic] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [mixVolume, setMixVolume] = useState<number>(100);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [volumePercent, setVolumePercent] = useState<{ [userId: string]: number }>({});
  const [remoteUserStatusList, setRemoteUserStatusList] = useState<{ [userId: string]: RemoteUserStatus }>({}); // userId -> status

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
      if (targetId === userId && !isTakingMicRef.current) {
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
    const localIsMicMute = window.localStorage.getItem('is-mic-mute') ?? 'false';
    const localIsSpeakerMute = window.localStorage.getItem('is-speaker-mute') ?? 'false';
    const localMutedIds = window.localStorage.getItem('muted-ids') ?? '';

    setMicVolume(parseInt(localMicVolume));
    micVolumeRef.current = parseInt(localMicVolume);
    setSpeakerVolume(parseInt(localSpeakerVolume));
    speakerVolumeRef.current = parseInt(localSpeakerVolume);
    setIsMicMute(localIsMicMute === 'true');
    micMuteRef.current = localIsMicMute === 'true';
    setIsSpeakerMute(localIsSpeakerMute === 'true');
    speakerMuteRef.current = localIsSpeakerMute === 'true';
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

  const removeMicAudio = useCallback((userId: string) => {
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
  }, []);

  const initMicAudio = useCallback(
    async (stream: MediaStream) => {
      if (!audioContextRef.current) {
        initAudioContext();
        return initMicAudio(stream);
      }

      // Remove existing mic audio
      removeMicAudio(userId);

      // Disable tracks if muted
      stream.getAudioTracks().forEach((track) => {
        track.enabled = speakingModeRef.current === 'key' ? isPressSpeakKeyRef.current : true;
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
        if (isTakingMicRef.current) audioProducerRef.current.resume();
        else audioProducerRef.current.pause();
      }

      // Initialize analyser
      analyserNode.fftSize = 2048;
      const dataArray = new Uint8Array(analyserNode.fftSize);
      detectSpeaking(userId, analyserNode, dataArray);
    },
    [userId, detectSpeaking, removeMicAudio, initAudioContext],
  );

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
    [initAudioContext, detectSpeaking]
  );

  const startMixMode = useCallback(async () => {
    if (isSystemAudioActiveRef.current) return;
    try {
      const systemStream = await getSystemAudioStream();
      await initMixMode(systemStream);
      isSystemAudioActiveRef.current = true;
      setIsMixModeActive(true);
      
    } catch (err) {
      console.error('[WebRTC] Error capturing audio from system', err);
    }
  }, [initMixMode]);

  const stopMixMode = useCallback(() => {
    if (!isSystemAudioActiveRef.current) return;

    mixNodesRef.current.stream?.getTracks().forEach((t) => t.stop());
    if (mixNodesRef.current.source) mixNodesRef.current.source.disconnect();
    if (mixNodesRef.current.gain) mixNodesRef.current.gain.disconnect();
    if (mixNodesRef.current.analyser) mixNodesRef.current.analyser.disconnect();

    mixNodesRef.current = { stream: null, source: null, gain: null, analyser: null };
    isSystemAudioActiveRef.current = false;
    setIsMixModeActive(false);

  }, []);
  
  const toggleMixMode = useCallback(async () => {
    if (isSystemAudioActiveRef.current) {
      stopMixMode();
    } else {
      await startMixMode();
    }
  }, [startMixMode, stopMixMode]);

  const disconnectSafe = (from?: AudioNode | null, to?: AudioNode | null) => {
  try {
    if (from && to) from.disconnect(to);
  } catch {}
};

const ensureRecordGraph = useCallback(() => {
  if (!audioContextRef.current) initAudioContext();

  if (!recordDesRef.current) {
    recordDesRef.current = audioContextRef.current!.createMediaStreamDestination();
  }

  disconnectSafe(micNodesRef.current.analyser, recordDesRef.current);
  disconnectSafe(mixNodesRef.current.analyser, recordDesRef.current);
  disconnectSafe(masterGainNodeRef.current, recordDesRef.current);
  if (isSystemAudioActiveRef.current) {
    if (micNodesRef.current.analyser) micNodesRef.current.analyser.connect(recordDesRef.current);
    if (mixNodesRef.current.analyser) mixNodesRef.current.analyser.connect(recordDesRef.current);
  } else {
    if (micNodesRef.current.analyser) micNodesRef.current.analyser.connect(recordDesRef.current);
    if (masterGainNodeRef.current) masterGainNodeRef.current.connect(recordDesRef.current);
  }
}, [initAudioContext]);


  const startRecording = useCallback(() => {
    if (isRecordingRef.current) return;
    ensureRecordGraph();

    const stream = recordDesRef.current!.stream;
    const mimeType =
      MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
      MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';

    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorderRef.current = mr;
    recordChunksRef.current = [];

    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordChunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(recordChunksRef.current, { type: mimeType || 'audio/webm' });      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url; a.download = `ricecall-room-${ts}.webm`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    };

    mr.start(1000);
    isRecordingRef.current = true;
    setIsRecording(true);
  }, [ensureRecordGraph]);


  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    try {
      mediaRecorderRef.current?.stop();
    } catch (e) {
      console.warn('[WebRTC] stopRecording error', e);
    }

    if (recordDesRef.current) {
      disconnectSafe(micNodesRef.current.analyser, recordDesRef.current);
      disconnectSafe(mixNodesRef.current.analyser, recordDesRef.current);
      disconnectSafe(masterGainNodeRef.current, recordDesRef.current);
    }

    isRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  const toggleRecord = useCallback(() => {
    if (isRecordingRef.current) stopRecording();
    else startRecording();
  }, [startRecording, stopRecording]);


  const changeBitrate = useCallback((bitrate: number) => {
    bitrateRef.current = bitrate;
  }, []);

  const changeMicVolume = useCallback((volume: number) => {
    micNodesRef.current.gain!.gain.value = volume / 20;
    setMicVolume(volume);
    micVolumeRef.current = volume;
    const isMicMute = volume === 0;
    setIsMicMute(isMicMute);
    micMuteRef.current = isMicMute;
    window.localStorage.setItem('is-mic-mute', isMicMute.toString());
    window.localStorage.setItem('mic-volume', volume.toString());
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
    const isSpeakerMute = volume === 0;
    setIsSpeakerMute(isSpeakerMute);
    speakerMuteRef.current = isSpeakerMute;
    window.localStorage.setItem('is-speaker-mute', isSpeakerMute.toString());
    window.localStorage.setItem('speaker-volume', volume.toString());
  }, []);

  const setIsUserMuted = useCallback((userId: string, muted: boolean) => {
    speakerNodesRef.current[userId]?.stream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
    setMutedIds((prev) => (muted ? [...prev, userId] : prev.filter((id) => id !== userId)));
    mutedIdsRef.current = muted ? [...mutedIdsRef.current, userId] : mutedIdsRef.current.filter((id) => id !== userId);
    window.localStorage.setItem('muted-ids', mutedIdsRef.current.join(','));
  }, []);

  const setIsMicTaken = useCallback((taken: boolean) => {
    setIsTakingMic(taken);
    isTakingMicRef.current = taken;
  }, []);

  const setIsSpeakKeyPressed = useCallback((enable: boolean) => {
    if (speakingModeRef.current !== 'key') return;
    soundPlayerRef.current.playSound(enable ? 'startSpeaking' : 'stopSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = enable;
    });
    setIsPressingSpeakKey(enable);
    isPressSpeakKeyRef.current = enable;
  }, []);

  const toggleMicMute = useCallback(() => {
    if (micMuteRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      changeMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', micVolumeRef.current.toString());
      changeMicVolume(0);
    }
  }, [changeMicVolume]);

  const toggleSpeakerMute = useCallback(() => {
    console.log('[WebRTC] toggleSpeakerMute', speakerMuteRef.current);
    if (speakerMuteRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      changeSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', speakerVolumeRef.current.toString());
      changeSpeakerVolume(0);
    }
  }, [changeSpeakerVolume]);

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
      const userId = consumer.appData.userId as string;
      removeSpeakerAudio(userId);
      consumer.close();
      delete consumersRef.current[producerId];

      setRemoteUserStatusList((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

      console.info('[WebRTC] Unconsumed producer: ', userId);
    },
    [removeSpeakerAudio],
  );

  const setupSend = useCallback(async (channelId: string) => {
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
    if (isTakingMicRef.current) audioProducerRef.current.resume();
    else audioProducerRef.current.pause();
  }, []);

  const setupRecv = useCallback(
    async (channelId: string) => {
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

  const handleSFUJoined = useCallback(
    async ({ channelId }: { channelId: string }) => {
      if (recvTransportRef.current) {
        recvTransportRef.current.close();
        recvTransportRef.current = null;
      }
      await setupRecv(channelId);

      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }
      await setupSend(channelId);
    },
    [setupSend, setupRecv],
  );

  const handleSFULeft = useCallback(async () => {
    if (recvTransportRef.current) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }
    if (sendTransportRef.current) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }
    if (isSystemAudioActiveRef.current) stopMixMode();
  }, []);

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
    if (el && typeof el.setSinkId === 'function' && deviceId) {
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
    if (isTakingMic) audioProducerRef.current?.resume();
    else audioProducerRef.current?.pause();
  }, [isTakingMic]);

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
        setIsUserMuted,
        setIsMicTaken,
        setIsSpeakKeyPressed,
        toggleSpeakerMute,
        toggleMicMute,
        changeBitrate,
        changeMicVolume,
        changeMixVolume,
        changeSpeakerVolume,
        toggleMixMode,
        toggleRecord,
        isPressingSpeakKey,
        isMicMute,
        isSpeakerMute,
        micVolume,
        mixVolume,
        speakerVolume,
        mutedIds,
        remoteUserStatusList,
        volumePercent,
        isMixModeActive,
        isRecording
      }}
    >
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
