import React, { useEffect, useRef, useState, useContext, createContext, useCallback } from 'react';
import * as mediasoupClient from 'mediasoup-client';
import { io, Socket } from 'socket.io-client';

// Services
import ipcService from '@/services/ipc.service';

// Types
import {
  SpeakingMode,
  ConsumerReturnType,
  TransportReturnType,
  ProducerReturnType,
  User,
  SFUConsumeParams,
  SFUCreateTransportParams,
  SFUProduceParams,
  SFUJoinParams,
  SFULeaveParams,
  ACK,
} from '@/types';

const sfuUrl = process.env.NEXT_PUBLIC_SFU_URL || 'http://localhost:4501';

interface WebRTCContextType {
  handleMuteUser: (userId: string) => void;
  handleUnmuteUser: (userId: string) => void;
  handleToggleSpeakKey: (enable: boolean) => void;
  handleToggleTakeMic: () => void;
  handleToggleSpeakerMute: () => void;
  handleToggleMicMute: () => void;
  handleEditBitrate: (newBitrate: number) => void;
  handleEditMicVolume: (volume: number) => void;
  handleEditMixVolume: (volume: number) => void;
  handleEditSpeakerVolume: (volume: number) => void;
  isPressSpeakKey: boolean;
  isMicTaken: boolean;
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
  // States
  const [isPressSpeakKey, setIsPressSpeakKey] = useState<boolean>(false);
  const [isMicTaken, setIsMicTaken] = useState<boolean>(false);
  const [isMicMute, setIsMicMute] = useState<boolean>(false);
  const [isSpeakerMute, setIsSpeakerMute] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [mixVolume, setMixVolume] = useState<number>(100);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [volumePercent, setVolumePercent] = useState<{ [userId: string]: number }>({});
  const [remoteUserStatusList, setRemoteUserStatusList] = useState<{ [userId: string]: RemoteUserStatus }>({}); // userId -> status

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);

  // Mic
  const micTakenRef = useRef<boolean>(false);
  const micMuteRef = useRef<boolean>(false);
  const micVolumeRef = useRef<number>(100);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputDestinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Mix
  const mixVolumeRef = useRef<number>(100);
  const mixGainNodeRef = useRef<GainNode | null>(null);

  // Speaker
  const speakerMuteRef = useRef<boolean>(false);
  const speakerVolumeRef = useRef<number>(100);
  const speakerStreamListRef = useRef<{ [id: string]: MediaStream }>({}); // userId -> stream
  const speakerSourceListRef = useRef<{ [id: string]: MediaStreamAudioSourceNode }>({}); // userId -> source
  const speakerGainNodeListRef = useRef<{ [id: string]: GainNode }>({}); // userId -> gain
  const speakerAnalyserListRef = useRef<{ [id: string]: AnalyserNode }>({}); // userId -> analyser
  const outputDestinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Device
  const inputDeviceIdRef = useRef<string | null>(null);
  const outputDeviceIdRef = useRef<string | null>(null);

  // Speaking Mode
  const speakingModeRef = useRef<SpeakingMode>('key');
  const isPressSpeakKeyRef = useRef<boolean>(false);

  // Bitrate
  const bitrateRef = useRef<number>(64000);

  // SFU
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<mediasoupClient.Device>(new mediasoupClient.Device());
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const consumersRef = useRef<{ [producerId: string]: mediasoupClient.types.Consumer }>({}); // producerId -> consumer

  // Audio
  const speakerRef = useRef<HTMLAudioElement | null>(null);

  const initSpeakerAudio = useCallback(
    (userId: string, stream: MediaStream) => {
      if (!audioContextRef.current) {
        console.warn('No audio context');
        return;
      }
      if (!outputDestinationNodeRef.current) {
        console.warn('No output destination node');
        return;
      }

      stream.getAudioTracks().forEach((track) => {
        track.enabled = !mutedIds.includes(userId);
      });

      speakerStreamListRef.current[userId] = stream;
      speakerSourceListRef.current[userId] = audioContextRef.current.createMediaStreamSource(stream);
      if (!speakerGainNodeListRef.current[userId]) speakerGainNodeListRef.current[userId] = audioContextRef.current.createGain();
      if (!speakerAnalyserListRef.current[userId]) speakerAnalyserListRef.current[userId] = audioContextRef.current.createAnalyser();

      speakerSourceListRef.current[userId].connect(speakerGainNodeListRef.current[userId]);
      speakerGainNodeListRef.current[userId].connect(speakerAnalyserListRef.current[userId]);
      speakerGainNodeListRef.current[userId].gain.value = 1;
      speakerAnalyserListRef.current[userId].connect(outputDestinationNodeRef.current);

      // Initialize analyser for volume detection
      speakerAnalyserListRef.current[userId].fftSize = 2048;
      const dataArray = new Uint8Array(speakerAnalyserListRef.current[userId].fftSize);

      const detectSpeaking = () => {
        if (!speakerAnalyserListRef.current[userId]) return;
        speakerAnalyserListRef.current[userId].getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const volume = Math.sqrt(sum / dataArray.length);
        const volumePercent = Math.floor(Math.min(1, volume / 0.5) * 100);
        setVolumePercent((prev) => ({ ...prev, [userId]: volumePercent }));
        requestAnimationFrame(detectSpeaking);
      };
      detectSpeaking();

      const speaker = speakerRef.current;
      if (!speaker) return;
      speaker.srcObject = stream;
      speaker.muted = speakerMuteRef.current;
      speaker.volume = speakerVolumeRef.current / 100;
      speaker.controls = false;
      speaker.autoplay = true;
    },
    [mutedIds],
  );

  const initMicAudio = useCallback(
    (stream: MediaStream) => {
      if (!audioContextRef.current) {
        console.warn('No audio context');
        return;
      }
      if (!inputDestinationNodeRef.current) {
        console.warn('No input destination node');
        return;
      }

      stream.getAudioTracks().forEach((track) => {
        track.enabled = speakingModeRef.current === 'key' ? isPressSpeakKeyRef.current : micTakenRef.current;
      });

      micStreamRef.current = stream;
      micSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      if (!micGainNodeRef.current) micGainNodeRef.current = audioContextRef.current.createGain();
      if (!micAnalyserRef.current) micAnalyserRef.current = audioContextRef.current.createAnalyser();

      micSourceRef.current.connect(micGainNodeRef.current);
      micGainNodeRef.current.connect(micAnalyserRef.current);
      micAnalyserRef.current.connect(inputDestinationNodeRef.current);

      // Initialize analyser
      micAnalyserRef.current.fftSize = 2048;
      const dataArray = new Uint8Array(micAnalyserRef.current.fftSize);

      const detectSpeaking = () => {
        if (!micAnalyserRef.current) return;
        micAnalyserRef.current.getByteTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const volume = Math.sqrt(sum / dataArray.length);
        const volumePercent = Math.floor(Math.min(1, volume / 0.5) * 100);
        setVolumePercent((prev) => ({ ...prev, [userId]: volumePercent }));
        requestAnimationFrame(detectSpeaking);
      };
      detectSpeaking();
    },
    [userId],
  );

  const handleEditBitrate = useCallback((bitrate: number) => {
    const newBitrate = bitrate;
    bitrateRef.current = newBitrate;
  }, []);

  const handleEditMicVolume = useCallback((volume: number) => {
    if (!micGainNodeRef.current) {
      console.warn('No mic gain node');
      return;
    }
    const newVolume = volume;
    micGainNodeRef.current.gain.value = newVolume / 100;
    setMicVolume(newVolume);
    micVolumeRef.current = newVolume;
  }, []);

  const handleEditMixVolume = useCallback((volume: number) => {
    if (!mixGainNodeRef.current) {
      console.warn('No mix gain node');
      return;
    }
    const newVolume = volume;
    mixGainNodeRef.current.gain.value = newVolume / 100;
    setMixVolume(newVolume);
    mixVolumeRef.current = newVolume;
  }, []);

  const handleEditSpeakerVolume = useCallback((volume: number) => {
    if (!speakerRef.current) {
      console.warn('No speaker ref');
      return;
    }
    const newVolume = volume;
    speakerRef.current.volume = newVolume / 100;
    setSpeakerVolume(newVolume);
    speakerVolumeRef.current = newVolume;
  }, []);

  const handleEditInputStream = useCallback(
    (deviceId: string) => {
      navigator.mediaDevices
        .getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          },
        })
        .then((stream) => {
          initMicAudio(stream);
        })
        .catch((err) => console.error('Error accessing microphone', err));
    },
    [initMicAudio],
  );

  const handleMuteUser = useCallback((userId: string) => {
    speakerStreamListRef.current[userId].getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    setMutedIds((prev) => [...prev, userId]);
  }, []);

  const handleUnmuteUser = useCallback((userId: string) => {
    speakerStreamListRef.current[userId].getAudioTracks().forEach((track) => {
      track.enabled = true;
    });
    setMutedIds((prev) => prev.filter((id) => id !== userId));
  }, []);

  const handleToggleSpeakKey = useCallback((enable: boolean) => {
    if (!micStreamRef.current) {
      console.warn('No mic stream');
      return;
    }
    if (speakingModeRef.current !== 'key') {
      console.warn('Not in key mode');
      return;
    }
    micStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = micTakenRef.current ? enable : false;
    });
    setIsPressSpeakKey(enable);
    isPressSpeakKeyRef.current = enable;
  }, []);

  const handleToggleTakeMic = useCallback(() => {
    if (!micStreamRef.current) {
      console.warn('No mic stream');
      return;
    }
    micStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = speakingModeRef.current === 'key' ? isPressSpeakKeyRef.current : micTakenRef.current;
    });
    setIsMicTaken(!micTakenRef.current);
    micTakenRef.current = !micTakenRef.current;
  }, []);

  const handleToggleMicMute = useCallback(() => {
    if (micMuteRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      handleEditMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', micVolumeRef.current.toString());
      handleEditMicVolume(0);
    }
    setIsMicMute(!micMuteRef.current);
    micMuteRef.current = !micMuteRef.current;
  }, [handleEditMicVolume]);

  const handleToggleSpeakerMute = useCallback(() => {
    if (speakerMuteRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      handleEditSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', speakerVolumeRef.current.toString());
      handleEditSpeakerVolume(0);
    }
    setIsSpeakerMute(!speakerMuteRef.current);
    speakerMuteRef.current = !speakerMuteRef.current;
  }, [handleEditSpeakerVolume]);

  const emitAck = useCallback(<T, R>(event: string, payload: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        console.warn('[WebRTC] No socket');
        return reject(new Error('No socket'));
      }
      socketRef.current.emit(event, payload, (res: ACK<R>) => {
        if (res?.ok) resolve(res.data as R);
        else reject(new Error(res?.error || 'unknown error'));
      });
    });
  }, []);

  const consumeOne = useCallback(
    async (producerId: string) => {
      if (!recvTransportRef.current) return;
      const consumerInfo = await emitAck<SFUConsumeParams, ConsumerReturnType>('SFUCreateConsumer', {
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
      setRemoteUserStatusList((prev) => ({ ...prev, [userId]: 'connected' }));
      console.info('[WebRTC] Consumed producer: ', userId);
    },
    [emitAck, initSpeakerAudio],
  );

  const unconsumeOne = useCallback(async (producerId: string) => {
    if (!recvTransportRef.current) return;
    if (!consumersRef.current[producerId]) return;
    const consumer = consumersRef.current[producerId];
    const userId = consumer.appData.userId as string;
    consumer.close();
    delete consumersRef.current[producerId];
    delete speakerStreamListRef.current[userId];
    delete speakerGainNodeListRef.current[userId];
    setRemoteUserStatusList((prev) => ({ ...prev, [userId]: 'disconnected' }));
    console.info('[WebRTC] Unconsumed producer: ', userId);
  }, []);

  const setupSend = useCallback(async () => {
    const transport = await emitAck<SFUCreateTransportParams, TransportReturnType>('SFUCreateTransport', { direction: 'send' });

    if (!deviceRef.current.loaded) await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

    sendTransportRef.current = deviceRef.current.createSendTransport(transport);
    sendTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
      emitAck('SFUConnectTransport', { transportId: sendTransportRef.current!.id, dtlsParameters })
        .then(() => {
          console.info('[WebRTC] SendTransport connected to SFU');
          cb();
        })
        .catch(eb);
    });
    sendTransportRef.current.on('produce', ({ kind, rtpParameters }, cb, eb) => {
      emitAck<SFUProduceParams, ProducerReturnType>('SFUCreateProducer', { transportId: sendTransportRef.current!.id, kind, rtpParameters })
        .then(({ id }) => {
          console.info('[WebRTC] SendTransport produced to SFU');
          cb({ id });
        })
        .catch(eb);
    });
    sendTransportRef.current.on('connectionstatechange', (s) => {
      console.log('[WebRTC] SendTransport connection state =', s);
    });

    const track = inputDestinationNodeRef.current?.stream.getAudioTracks()[0];
    if (!track) {
      console.warn('[WebRTC] No mic track yet, skip produce');
      return;
    }

    const producer = await sendTransportRef.current.produce({ track, encodings: [{ maxBitrate: 128000 }], stopTracks: false });
    producer.on('transportclose', () => {
      console.log('[WebRTC] Producer transport closed');
      producer.close();
    });
    producer.on('trackended', () => {
      console.log('[WebRTC] Producer track ended');
      producer.close();
    });
  }, [emitAck]);

  const setupRecv = useCallback(async () => {
    const transport = await emitAck<SFUCreateTransportParams, TransportReturnType>('SFUCreateTransport', { direction: 'recv' });

    if (!deviceRef.current.loaded) await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

    recvTransportRef.current = deviceRef.current.createRecvTransport(transport);
    recvTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
      emitAck('SFUConnectTransport', { transportId: recvTransportRef.current!.id, dtlsParameters })
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
  }, [emitAck, consumeOne]);

  const handleJoinSFUChannel = useCallback(
    async ({ channelId }: { channelId: string }) => {
      if (!socketRef.current) {
        console.warn('[WebRTC] No socket');
        return;
      }

      await emitAck<SFUJoinParams, void>('SFUJoin', { channelId })
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
    [emitAck, setupSend, setupRecv],
  );

  const handleLeaveSFUChannel = useCallback(
    async ({ channelId }: { channelId: string }) => {
      if (!socketRef.current) {
        console.warn('[WebRTC] No socket');
        return;
      }

      await emitAck<SFULeaveParams, void>('SFULeave', { channelId })
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
    },
    [emitAck],
  );

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

  // Effects
  useEffect(() => {
    if (!userId) return;

    const socket = io(sfuUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      query: { userId },
    });

    socket.on('connect', () => {
      console.info('[WebRTC] connected to SFU');
    });
    socket.on('disconnect', () => {
      console.info('[WebRTC] disconnected from SFU');
    });
    socket.on('error', (error) => {
      console.error('[WebRTC] error:', error);
    });
    socket.on('connect_error', (error) => {
      console.error('[WebRTC] connect error:', error);
    });
    socket.on('reconnect', (attemptNumber) => {
      console.info('[WebRTC] reconnecting, attempt number:', attemptNumber);
    });
    socket.on('reconnect_error', (error) => {
      console.error('[WebRTC] reconnect error:', error);
    });
    socket.on('SFUNewProducer', handleNewProducer);
    socket.on('SFUProducerClosed', handleProducerClosed);

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [userId, handleNewProducer, handleProducerClosed]);

  useEffect(() => {
    const localMicVolume = window.localStorage.getItem('mic-volume');
    const localSpeakerVolume = window.localStorage.getItem('speaker-volume');
    const localMicMute = window.localStorage.getItem('is-mic-mute');
    const localSpeakerMute = window.localStorage.getItem('is-speaker-mute');

    setMicVolume(localMicVolume !== null ? parseInt(localMicVolume) : 100);
    setSpeakerVolume(localSpeakerVolume !== null ? parseInt(localSpeakerVolume) : 100);
    setIsMicMute(localMicMute !== null ? localMicMute === 'true' : false);
    setIsSpeakerMute(localSpeakerMute !== null ? localSpeakerMute === 'true' : false);
  }, []);

  useEffect(() => {
    // Initialize audio context
    if (audioContextRef.current) return;
    const audioContext = new AudioContext();
    const inputDestination = audioContext.createMediaStreamDestination();
    const outputDestination = audioContext.createMediaStreamDestination();

    audioContext.onstatechange = () => console.log('[AUDIO] ctx state =', audioContext.state);

    audioContextRef.current = audioContext;
    inputDestinationNodeRef.current = inputDestination;
    outputDestinationNodeRef.current = outputDestination;
  }, []);

  useEffect(() => {}, [speakerVolume, isSpeakerMute]);

  useEffect(() => {
    const changeInputAudioDevice = (deviceId: string) => {
      console.info('[WebRTC] input device updated: ', deviceId);
      inputDeviceIdRef.current = deviceId;
      handleEditInputStream(deviceId || '');
    };
    const changeOutputAudioDevice = (deviceId: string) => {
      console.info('[WebRTC] output device updated: ', deviceId);
      outputDeviceIdRef.current = deviceId;
    };
    const changeSpeakingMode = (mode: SpeakingMode) => {
      console.info('[WebRTC] speaking mode updated: ', mode);
      speakingModeRef.current = mode;
    };

    const unsubscribe: (() => void)[] = [
      ipcService.systemSettings.inputAudioDevice.get(changeInputAudioDevice),
      ipcService.systemSettings.outputAudioDevice.get(changeOutputAudioDevice),
      ipcService.systemSettings.speakingMode.get(changeSpeakingMode),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleEditInputStream]);

  useEffect(() => {
    const unsubscribe: (() => void)[] = [ipcService.socket.on('channelConnected', handleJoinSFUChannel), ipcService.socket.on('channelDisconnected', handleLeaveSFUChannel)];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleJoinSFUChannel, handleLeaveSFUChannel]);

  useEffect(() => {
    window.localStorage.setItem('mic-volume', micVolume.toString());
  }, [micVolume]);

  useEffect(() => {
    window.localStorage.setItem('speaker-volume', speakerVolume.toString());
  }, [speakerVolume]);

  useEffect(() => {
    window.localStorage.setItem('is-mic-mute', isMicMute.toString());
  }, [isMicMute]);

  useEffect(() => {
    window.localStorage.setItem('is-speaker-mute', isSpeakerMute.toString());
  }, [isSpeakerMute]);

  return (
    <WebRTCContext.Provider
      value={{
        handleMuteUser,
        handleUnmuteUser,
        handleToggleSpeakKey,
        handleToggleTakeMic,
        handleToggleSpeakerMute,
        handleToggleMicMute,
        handleEditBitrate,
        handleEditMicVolume,
        handleEditMixVolume,
        handleEditSpeakerVolume,
        isPressSpeakKey,
        isMicTaken,
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
      <audio ref={speakerRef} autoPlay style={{ display: 'none' }} />
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
