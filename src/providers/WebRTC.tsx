import React, { useEffect, useRef, useState, useContext, createContext, useCallback, useMemo } from 'react';
import * as mediasoupClient from 'mediasoup-client';
// import { io, Socket } from 'socket.io-client';

// Services
import ipc from '@/services/ipc.service';

// Types
import { SpeakingMode, ConsumerReturnType, TransportReturnType, ProducerReturnType, User, SFUConsumeParams, SFUCreateTransportParams, SFUProduceParams, SFUJoinParams, SFULeaveParams } from '@/types';

// Providers
import { useSoundPlayer } from '@/providers/SoundPlayer';

interface WebRTCContextType {
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;
  takeMic: () => void;
  untakeMic: () => void;
  toggleSpeakKey: (enable: boolean) => void;
  toggleSpeakerMute: () => void;
  toggleMicMute: () => void;
  changeBitrate: (newBitrate: number) => void;
  changeMicVolume: (volume: number) => void;
  changeMixVolume: (volume: number) => void;
  changeSpeakerVolume: (volume: number) => void;
  isPressSpeakKey: boolean;
  isMicMute: boolean;
  isSpeakerMute: boolean;
  micVolume: number;
  speakerVolume: number;
  mixVolume: number;
  mutedIds: string[];
  volumePercent: { [userId: string]: number };
  remoteUserStatusList: { [userId: string]: RemoteUserStatus };
}

type RemoteUserStatus = 'connecting' | 'connected' | 'disconnected';

const WebRTCContext = createContext<WebRTCContextType>({} as WebRTCContextType);

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
  // Mic
  const micTakenRef = useRef<boolean>(false);
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
  const muteIdsRef = useRef<string[]>([]);
  // SFU
  const deviceRef = useRef<mediasoupClient.Device>(new mediasoupClient.Device());
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const consumersRef = useRef<{ [producerId: string]: mediasoupClient.types.Consumer }>({}); // producerId -> consumer

  // Memos
  const SPEAKING_VOLUME_THRESHOLD = useMemo(() => 2, []);

  // States
  const [isPressSpeakKey, setIsPressSpeakKey] = useState<boolean>(false);
  const [isMicMute, setIsMicMute] = useState<boolean>(false);
  const [isSpeakerMute, setIsSpeakerMute] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [mixVolume, setMixVolume] = useState<number>(100);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [volumePercent, setVolumePercent] = useState<{ [userId: string]: number }>({});
  const [remoteUserStatusList, setRemoteUserStatusList] = useState<{ [userId: string]: RemoteUserStatus }>({}); // userId -> status

  const detectSpeaking = useCallback(
    (userId: string, analyserNode: AnalyserNode, dataArray: Uint8Array) => {
      if (!analyserNode) return;
      analyserNode.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      const volumePercent = Math.min(1, volume / 0.5) * 100;
      volumePercentRef.current[userId] = volumePercent > SPEAKING_VOLUME_THRESHOLD ? volumePercent : 0;

      const now = performance.now();
      if (now - lastRefreshRef.current >= 80) {
        lastRefreshRef.current = now;
        setVolumePercent((prev) => ({ ...prev, ...volumePercentRef.current }));
      }

      rafIdListRef.current[userId] = requestAnimationFrame(() => detectSpeaking(userId, analyserNode, dataArray));
    },
    [SPEAKING_VOLUME_THRESHOLD],
  );

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
      if (!audioContextRef.current) return;

      // Remove existing speaker audio
      removeSpeakerAudio(userId);

      // Disable tracks if muted
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !muteIdsRef.current.includes(userId);
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
        stream.getAudioTracks().forEach((track) => {
          track.enabled = false;
          track.enabled = true;
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
    [detectSpeaking, removeSpeakerAudio],
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
      if (!audioContextRef.current) return;

      // Remove existing mic audio
      removeMicAudio(userId);

      // Disable tracks if muted
      stream.getAudioTracks().forEach((track) => {
        track.enabled = micTakenRef.current ? (speakingModeRef.current === 'key' ? isPressSpeakKeyRef.current : true) : false;
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
      }

      // Initialize analyser
      analyserNode.fftSize = 2048;
      const dataArray = new Uint8Array(analyserNode.fftSize);
      detectSpeaking(userId, analyserNode, dataArray);
    },
    [userId, detectSpeaking, removeMicAudio],
  );

  const changeBitrate = useCallback((bitrate: number) => {
    const newBitrate = bitrate;
    bitrateRef.current = newBitrate;
  }, []);

  const changeMicVolume = useCallback((volume: number) => {
    const newVolume = volume;
    micNodesRef.current.gain!.gain.value = newVolume / 20;
    setMicVolume(newVolume);
    micVolumeRef.current = newVolume;
    const isMicMute = newVolume === 0;
    setIsMicMute(isMicMute);
    micMuteRef.current = isMicMute;
    window.localStorage.setItem('is-mic-mute', isMicMute.toString());
    window.localStorage.setItem('mic-volume', newVolume.toString());
  }, []);

  const changeMixVolume = useCallback((volume: number) => {
    const newVolume = volume;
    mixNodesRef.current.gain!.gain.value = newVolume / 100;
    setMixVolume(newVolume);
    mixVolumeRef.current = newVolume;
    window.localStorage.setItem('mix-volume', newVolume.toString());
  }, []);

  const changeSpeakerVolume = useCallback((volume: number) => {
    const newVolume = volume;
    masterGainNodeRef.current!.gain.value = newVolume / 100;
    setSpeakerVolume(newVolume);
    speakerVolumeRef.current = newVolume;
    const isSpeakerMute = newVolume === 0;
    setIsSpeakerMute(isSpeakerMute);
    speakerMuteRef.current = isSpeakerMute;
    window.localStorage.setItem('is-speaker-mute', isSpeakerMute.toString());
    window.localStorage.setItem('speaker-volume', newVolume.toString());
  }, []);

  const muteUser = useCallback((userId: string) => {
    speakerNodesRef.current[userId]?.stream?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    setMutedIds((prev) => [...prev, userId]);
    muteIdsRef.current.push(userId);
  }, []);

  const unmuteUser = useCallback((userId: string) => {
    speakerNodesRef.current[userId]?.stream?.getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    setMutedIds((prev) => prev.filter((id) => id !== userId));
    muteIdsRef.current = muteIdsRef.current.filter((id) => id !== userId);
  }, []);

  const takeMic = useCallback(() => {
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = speakingModeRef.current !== 'key';
    });
    micTakenRef.current = true;
  }, []);

  const untakeMic = useCallback(() => {
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    micTakenRef.current = false;
  }, []);

  const toggleSpeakKey = useCallback((enable: boolean) => {
    if (speakingModeRef.current !== 'key') {
      console.warn('Not in key mode');
      return;
    }
    soundPlayerRef.current.playSound(enable ? 'startSpeaking' : 'stopSpeaking');
    micNodesRef.current.stream?.getAudioTracks().forEach((track) => {
      track.enabled = micTakenRef.current && enable;
    });
    setIsPressSpeakKey(enable);
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
    async (producerId: string) => {
      if (!recvTransportRef.current) return;
      const consumerInfo = await ipc.socket.emit<SFUConsumeParams, ConsumerReturnType>('SFUCreateConsumer', {
        transportId: recvTransportRef.current!.id,
        producerId,
        rtpCapabilities: deviceRef.current.rtpCapabilities,
      });

      const consumer = await recvTransportRef.current.consume({
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

  const setupSend = useCallback(async () => {
    const transport = await ipc.socket.emit<SFUCreateTransportParams, TransportReturnType>('SFUCreateTransport', { direction: 'send' });

    if (!deviceRef.current.loaded) await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

    sendTransportRef.current = deviceRef.current.createSendTransport(transport);
    sendTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
      ipc.socket
        .emit('SFUConnectTransport', { transportId: sendTransportRef.current!.id, dtlsParameters })
        .then(() => {
          console.info('[WebRTC] SendTransport connected to SFU');
          cb();
        })
        .catch(eb);
    });
    sendTransportRef.current.on('produce', ({ kind, rtpParameters }, cb, eb) => {
      ipc.socket
        .emit<SFUProduceParams, ProducerReturnType>('SFUCreateProducer', { transportId: sendTransportRef.current!.id, kind, rtpParameters })
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
    if (!track) {
      console.warn('[WebRTC] No mic track yet, skip produce');
      return;
    }

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

  const setupRecv = useCallback(async () => {
    const transport = await ipc.socket.emit<SFUCreateTransportParams, TransportReturnType>('SFUCreateTransport', { direction: 'recv' });

    if (!deviceRef.current.loaded) await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

    recvTransportRef.current = deviceRef.current.createRecvTransport(transport);
    recvTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
      ipc.socket
        .emit('SFUConnectTransport', { transportId: recvTransportRef.current!.id, dtlsParameters })
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
      consumeOne(producer.id).catch(console.error);
    }
  }, [consumeOne]);

  const handleJoinSFUChannel = useCallback(
    async ({ channelId }: { channelId: string }) => {
      await ipc.socket
        .emit<SFUJoinParams, void>('SFUJoin', { channelId })
        .then(() => console.info('[WebRTC] Joined SFU channel: ', channelId))
        .catch((e) => {
          console.error('[WebRTC] Error joining SFU channel: ', e);
        });

      if (recvTransportRef.current) {
        recvTransportRef.current.close();
        recvTransportRef.current = null;
      }
      await setupRecv();

      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }
      await setupSend();
    },
    [setupSend, setupRecv],
  );

  const handleLeaveSFUChannel = useCallback(async ({ channelId }: { channelId: string }) => {
    await ipc.socket
      .emit<SFULeaveParams, void>('SFULeave', { channelId })
      .then(() => console.info('[WebRTC] Left SFU channel: ', channelId))
      .catch((e) => {
        console.error('[WebRTC] Error leaving SFU channel: ', e);
      });

    if (recvTransportRef.current) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }
    if (sendTransportRef.current) {
      sendTransportRef.current.close();
      sendTransportRef.current = null;
    }
  }, []);

  const handleNewProducer = useCallback(
    async ({ userId, producerId }: { userId: string; producerId: string }) => {
      if (!recvTransportRef.current) return;
      console.info('[WebRTC] New producer: ', userId);
      consumeOne(producerId).catch((e) => {
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

  useEffect(() => {
    const localMicVolume = window.localStorage.getItem('mic-volume');
    const localSpeakerVolume = window.localStorage.getItem('speaker-volume');
    const localIsMicMute = window.localStorage.getItem('is-mic-mute');
    const localIsSpeakerMute = window.localStorage.getItem('is-speaker-mute');
    const localMutedIds = window.localStorage.getItem('muted-ids');

    setMicVolume(localMicVolume !== null ? parseInt(localMicVolume) : 100);
    micVolumeRef.current = localMicVolume !== null ? parseInt(localMicVolume) : 100;
    setSpeakerVolume(localSpeakerVolume !== null ? parseInt(localSpeakerVolume) : 100);
    speakerVolumeRef.current = localSpeakerVolume !== null ? parseInt(localSpeakerVolume) : 100;
    setIsMicMute(localIsMicMute !== null ? localIsMicMute === 'true' : false);
    micMuteRef.current = localIsMicMute !== null ? localIsMicMute === 'true' : false;
    setIsSpeakerMute(localIsSpeakerMute !== null ? localIsSpeakerMute === 'true' : false);
    speakerMuteRef.current = localIsSpeakerMute !== null ? localIsSpeakerMute === 'true' : false;
    setMutedIds(localMutedIds !== null ? localMutedIds.split(',') : []);
    muteIdsRef.current = localMutedIds !== null ? localMutedIds.split(',') : [];
  }, []);

  useEffect(() => {
    // Initialize audio context
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

  useEffect(() => {
    window.localStorage.setItem('muted-ids', mutedIds.join(','));
  }, [mutedIds]);

  useEffect(() => {
    const unsubscribe = [
      ipc.systemSettings.inputAudioDevice.get(handleEditInputDevice),
      ipc.systemSettings.outputAudioDevice.get(handleEditOutputDevice),
      ipc.systemSettings.speakingMode.get(handleEditSpeakingMode),
      ipc.socket.on('channelConnected', handleJoinSFUChannel),
      ipc.socket.on('channelDisconnected', handleLeaveSFUChannel),
      ipc.socket.on('SFUNewProducer', handleNewProducer),
      ipc.socket.on('SFUProducerClosed', handleProducerClosed),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleEditInputDevice, handleEditOutputDevice, handleJoinSFUChannel, handleLeaveSFUChannel, handleNewProducer, handleProducerClosed]);

  return (
    <WebRTCContext.Provider
      value={{
        muteUser,
        unmuteUser,
        takeMic,
        untakeMic,
        toggleSpeakKey,
        toggleSpeakerMute,
        toggleMicMute,
        changeBitrate,
        changeMicVolume,
        changeMixVolume,
        changeSpeakerVolume,
        isPressSpeakKey,
        isMicMute,
        isSpeakerMute,
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
