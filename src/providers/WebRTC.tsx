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
  volumePercent: number;
  mutedIds: string[];
  remoteUserStatusList: Record<string, RemoteUserStatus>;
}

type RemoteUserStatus = {
  status: 'connecting' | 'connected' | 'disconnected';
  volume: number;
};

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
  const [volumePercent, setVolumePercent] = useState<number>(0);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [remoteUserStatusList, setRemoteUserStatusList] = useState<Record<string, RemoteUserStatus>>({}); // userId -> status

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);

  // Mic
  const micTakenRef = useRef<boolean>(false);
  const micMuteRef = useRef<boolean>(false);
  const micVolumeRef = useRef<number>(100);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  // Mix
  const mixVolumeRef = useRef<number>(100);
  // const mixSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const mixGainNodeRef = useRef<GainNode | null>(null);
  const inputDestinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Speaker
  const speakerMuteRef = useRef<boolean>(false);
  const speakerVolumeRef = useRef<number>(100);
  const speakerSourceNodeRef = useRef<{ [userId: string]: MediaStreamAudioSourceNode }>({});
  const speakerGainNodeRef = useRef<{ [userId: string]: GainNode }>({});
  const outputDestinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const speakerRef = useRef<HTMLAudioElement | null>(null);

  // Device
  const inputDeviceIdRef = useRef<string | null>(null);
  const outputDeviceIdRef = useRef<string | null>(null);

  // Speaking Mode
  const speakingModeRef = useRef<SpeakingMode>('key');
  const isPressSpeakKeyRef = useRef<boolean>(false);
  const volumePercentRef = useRef<number>(0);
  const volumeThresholdRef = useRef<number>(1);

  // Bitrate
  const bitrateRef = useRef<number>(64000);

  // SFU
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<mediasoupClient.Device>(new mediasoupClient.Device());
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const consumersRef = useRef<{ [producerId: string]: mediasoupClient.types.Consumer }>({}); // producerId -> consumer

  // const streamListRef = useRef<{ [id: string]: MediaStream }>({}); // userId -> stream
  // const audioListRef = useRef<{ [id: string]: HTMLAudioElement }>({}); // userId -> audio
  // const audioRefHandlersRef = useRef<Record<string, (el: HTMLAudioElement | null) => void>>({}); // userId -> (el: HTMLAudioElement | null) => void

  const handleEditBitrate = useCallback((bitrate?: number) => {
    if (bitrate === bitrateRef.current) {
      console.warn(`Bitrate already set to ${bitrate}, skipping...`);
      return;
    }
    const newBitrate = bitrate ?? bitrateRef.current;
    // Object.values(peerConnectionListRef.current).forEach((connection) => {
    //   const senders = connection.getSenders();
    //   for (const sender of senders) {
    //     const parameters = sender.getParameters();
    //     if (!parameters.encodings) {
    //       parameters.encodings = [{}];
    //     }
    //     parameters.encodings[0].maxBitrate = newBitrate;
    //     sender.setParameters(parameters).catch((error) => {
    //       console.error('Error setting bitrate:', error);
    //     });
    //   }
    // });
    bitrateRef.current = newBitrate;
  }, []);

  const handleEditMicVolume = useCallback((volume?: number) => {
    if (!micGainNodeRef.current) {
      console.warn('No mic gain node');
      return;
    }
    const newVolume = volume ?? micVolumeRef.current;
    micGainNodeRef.current.gain.value = newVolume / 100;
    setMicVolume(newVolume);
    micVolumeRef.current = newVolume;
  }, []);

  const handleEditMixVolume = useCallback((volume?: number) => {
    if (!mixGainNodeRef.current) {
      console.warn('No mix gain node');
      return;
    }
    const newVolume = volume ?? mixVolumeRef.current;
    mixGainNodeRef.current.gain.value = newVolume / 100;
    setMixVolume(newVolume);
    mixVolumeRef.current = newVolume;
  }, []);

  const handleEditSpeakerVolume = useCallback((volume?: number) => {
    if (!speakerRef.current) {
      console.warn('No speaker ref');
      return;
    }
    const newVolume = volume ?? speakerVolumeRef.current;
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
          if (!audioContextRef.current) {
            console.warn('No audio context');
            return;
          }
          if (!micGainNodeRef.current) {
            console.warn('No mic gain node');
            return;
          }

          micStreamRef.current = stream;
          micStreamRef.current.getAudioTracks().forEach((track) => {
            // track.enabled = speakingModeRef.current === 'key' ? isPressSpeakKeyRef.current : micTakenRef.current;
            track.enabled = true;
          });

          // Create nodes
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(micGainNodeRef.current);
          micSourceNodeRef.current = source;

          handleEditMicVolume();
        })
        .catch((err) => console.error('Error accessing microphone', err));
    },
    [handleEditMicVolume],
  );

  const handleMuteUser = useCallback((userId: string) => {
    speakerGainNodeRef.current[userId].gain.value = 0;
    setMutedIds((prev) => [...prev, userId]);
  }, []);

  const handleUnmuteUser = useCallback((userId: string) => {
    speakerGainNodeRef.current[userId].gain.value = 1;
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
      console.log('[WebRTC] consumer track state:', consumer.track.readyState, 'enabled:', consumer.track.enabled);
      const userId = consumer.appData.userId as string;
      const stream = new MediaStream([consumer.track]);
      console.log('[WebRTC] consumer stream:', stream);

      if (!audioContextRef.current) {
        console.warn('No audio context');
        return;
      }
      if (!outputDestinationNodeRef.current) {
        console.warn('No output destination node');
        return;
      }

      // Create nodes
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const gain = audioContextRef.current.createGain();

      // Connect nodes
      source.connect(gain);
      gain.connect(outputDestinationNodeRef.current);

      speakerSourceNodeRef.current[userId] = source;
      speakerGainNodeRef.current[userId] = gain;
      consumersRef.current[producerId] = consumer;
      setRemoteUserStatusList((prev) => ({ ...prev, [userId]: { status: 'connected', volume: 0 } }));
      console.info('[WebRTC] Consumed producer: ', producerId);
      console.info('[WebRTC] UserId: ', userId);

      if (audioContextRef.current && speakerGainNodeRef.current[userId]) {
        const osc = audioContextRef.current.createOscillator();
        osc.frequency.value = 440;
        osc.connect(speakerGainNodeRef.current[userId]);
        osc.start();
        setInterval(() => {
          osc.stop();
          osc.disconnect();
        }, 1500);
      }
    },
    [emitAck],
  );

  const unconsumeOne = useCallback((producerId: string) => {
    if (!recvTransportRef.current) return;
    const consumer = consumersRef.current[producerId];
    if (!consumer) return;
    const userId = consumer.appData.userId as string;
    consumer.close();
    delete consumersRef.current[producerId];
    delete speakerSourceNodeRef.current[userId];
    delete speakerGainNodeRef.current[userId];
    setRemoteUserStatusList((prev) => ({ ...prev, [userId]: { status: 'disconnected', volume: 0 } }));
    console.info('[WebRTC] Unconsumed producer: ', producerId);
    console.info('[WebRTC] UserId: ', userId);
  }, []);

  const setupSend = useCallback(async () => {
    const transport = await emitAck<SFUCreateTransportParams, TransportReturnType>('SFUCreateTransport', { direction: 'send' });

    if (!deviceRef.current.loaded) await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });
    console.log(transport.iceCandidates);
    sendTransportRef.current = deviceRef.current.createSendTransport(transport);
    console.log('[WebRTC] SendTransport created:', sendTransportRef.current);
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

    // console.log('[WebRTC] Producing mic track:', track);
    // await sendTransportRef.current.produce({ track });

    // 使用已經連接到 Audio Context 的軌道
    const track = inputDestinationNodeRef.current?.stream.getAudioTracks()[0];
    if (!track) {
      console.warn('[WebRTC] No mic track yet, skip produce');
      return;
    }

    console.log('[WebRTC] Using processed audio track:', {
      id: track.id,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
    });

    // 創建 Producer
    const producer = await sendTransportRef.current.produce({ track });
    console.log('[WebRTC] Producer created:', {
      id: producer.id,
      kind: producer.kind,
      track: producer.track,
    });
  }, [emitAck]);

  const setupRecv = useCallback(async () => {
    const transport = await emitAck<SFUCreateTransportParams, TransportReturnType>('SFUCreateTransport', { direction: 'recv' });

    if (!deviceRef.current.loaded) await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });
    console.log(transport.iceCandidates);
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
    async (...args: { channelId: string }[]) => {
      if (!socketRef.current) {
        console.warn('[WebRTC] No socket');
        return;
      }

      const { channelId } = args[0];

      await emitAck<SFUJoinParams, void>('SFUJoin', { channelId })
        .then(() => console.info('[WebRTC] Joined SFU channel: ', channelId))
        .catch(console.error);

      await setupRecv();
      await setupSend();

      if (audioContextRef.current && micGainNodeRef.current) {
        const osc = audioContextRef.current.createOscillator();
        osc.frequency.value = 440;
        osc.connect(micGainNodeRef.current);
        osc.start();
        setInterval(() => {
          osc.stop();
          osc.disconnect();
        }, 1500);
      }
    },
    [emitAck, setupSend, setupRecv],
  );

  const handleLeaveSFUChannel = useCallback(
    async (...args: { channelId: string }[]) => {
      if (!socketRef.current) {
        console.warn('[WebRTC] No socket');
        return;
      }

      const { channelId } = args[0];

      await emitAck<SFULeaveParams, void>('SFULeave', { channelId })
        .then(() => console.info('[WebRTC] Left SFU channel: ', channelId))
        .catch(console.error);

      recvTransportRef.current?.close();
      sendTransportRef.current?.close();
      recvTransportRef.current = null;
      sendTransportRef.current = null;
    },
    [emitAck],
  );

  const handleNewProducer = useCallback(
    async ({ kind, userId, producerId }: { kind: string; userId: string; producerId: string }) => {
      if (!recvTransportRef.current) return;
      console.info('[WebRTC] New producer: ', producerId);
      console.info('[WebRTC] UserId: ', userId);
      console.info('[WebRTC] Kind: ', kind);
      consumeOne(producerId).catch(console.error);
    },
    [consumeOne],
  );

  const handleProducerClosed = useCallback(
    async ({ userId, producerId }: { userId: string; producerId: string }) => {
      console.info('[WebRTC] Producer closed: ', producerId);
      console.info('[WebRTC] UserId: ', userId);
      unconsumeOne(producerId);
    },
    [unconsumeOne],
  );

  // const getAudioRef = useCallback(
  //   (userId: string) => {
  //     if (!audioRefHandlersRef.current[userId]) {
  //       audioRefHandlersRef.current[userId] = (el: HTMLAudioElement | null) => {
  //         if (!el) {
  //           delete audioListRef.current[userId];
  //           return;
  //         }
  //         const stream = streamListRef.current[userId];
  //         if (el.srcObject !== stream) {
  //           el.srcObject = stream;
  //           console.log('[WebRTC] Set audio srcObject for user:', userId, 'stream:', stream);
  //         }

  //         audioListRef.current[userId] = el;
  //         el.muted = mutedIds.includes(userId);
  //         el.volume = (speakerMuteRef.current ? 0 : speakerVolumeRef.current) / 100;
  //         el.controls = false;
  //         el.autoplay = true;

  //         el.onerror = (e) => {
  //           console.error('[WebRTC] Audio error for user:', userId, e);
  //         };

  //         el.onloadedmetadata = () => {
  //           console.log('[WebRTC] Audio loaded metadata for user:', userId);
  //         };

  //         if (outputDeviceIdRef.current && 'setSinkId' in el) {
  //           (el as HTMLAudioElement).setSinkId(outputDeviceIdRef.current).catch(() => {});
  //         }
  //       };
  //     }
  //     return audioRefHandlersRef.current[userId];
  //   },
  //   [mutedIds],
  // );

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
    const audioCtx = new AudioContext();

    // Create nodes
    const micGain = audioCtx.createGain();
    const mixGain = audioCtx.createGain();
    const analyser = audioCtx.createAnalyser();
    const inputDestination = audioCtx.createMediaStreamDestination();
    const outputDestination = audioCtx.createMediaStreamDestination();

    // Connect nodes
    micGain.connect(analyser);
    mixGain.connect(analyser);
    analyser.connect(inputDestination);

    // Set nodes
    audioContextRef.current = audioCtx;
    micGainNodeRef.current = micGain;
    mixGainNodeRef.current = mixGain;
    inputDestinationNodeRef.current = inputDestination;
    outputDestinationNodeRef.current = outputDestination;

    // Set audio ref
    speakerRef.current = document.createElement('audio');
    speakerRef.current.srcObject = outputDestination.stream;
    speakerRef.current.volume = (speakerMuteRef.current ? 0 : speakerVolumeRef.current) / 100;
    speakerRef.current.controls = false;
    speakerRef.current.autoplay = true;
    speakerRef.current.style.display = 'none';
    document.body.appendChild(speakerRef.current);

    // Initialize analyser
    analyser.fftSize = 2048;
    const dataArray = new Uint8Array(analyser.fftSize);

    const detectSpeaking = () => {
      if (!analyser) return;
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      const volumePercent = Math.floor(Math.min(1, volume / 0.5) * 100);
      volumePercentRef.current = volumePercent;
      requestAnimationFrame(detectSpeaking);
    };
    detectSpeaking();

    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

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
      ipcService.socket.on('channelConnected', handleJoinSFUChannel),
      ipcService.socket.on('channelDisconnected', handleLeaveSFUChannel),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleEditInputStream, handleJoinSFUChannel, handleLeaveSFUChannel, handleNewProducer, handleProducerClosed]);

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

  useEffect(() => {
    let lastSent = -1;
    const id = setInterval(() => {
      const volume = volumePercentRef.current > volumeThresholdRef.current ? volumePercentRef.current : 0;
      if (volume !== lastSent) {
        // for (const dataChannel of Object.values(peerDataChannelListRef.current)) {
        //   if (dataChannel && dataChannel.readyState === 'open') dataChannel.send(JSON.stringify({ volume }));
        // }
        setVolumePercent(volume);
        lastSent = volume;
      }
    }, 66);
    return () => clearInterval(id);
  }, []);

  // useEffect(() => {
  //   if (!audioRef.current) return;
  //   if (!outputDestinationNodeRef.current) return;
  //   const stream = outputDestinationNodeRef.current.stream;
  //   if (audioRef.current.srcObject !== stream) {
  //     audioRef.current.srcObject = stream;
  //     console.log('[WebRTC] Set audio srcObject for user:', 'stream:', stream);
  //   }

  //   audioRef.current.volume = (speakerMuteRef.current ? 0 : speakerVolumeRef.current) / 100;
  //   audioRef.current.controls = false;
  //   audioRef.current.autoplay = true;

  //   if (outputDeviceIdRef.current && 'setSinkId' in audioRef.current) {
  //     (audioRef.current as HTMLAudioElement).setSinkId(outputDeviceIdRef.current).catch(() => {});
  //   }
  // }, [speakerMuteRef, speakerVolumeRef]);

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
        volumePercent,
        mutedIds,
        remoteUserStatusList,
      }}
    >
      {/* {Object.keys(remoteUserStatusList).map((userId) => (
        <audio key={userId} ref={getAudioRef(userId)} autoPlay style={{ display: 'none' }} />
      ))}
      <audio key={userId} ref={audioRef} autoPlay style={{ display: 'none' }} /> */}
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
