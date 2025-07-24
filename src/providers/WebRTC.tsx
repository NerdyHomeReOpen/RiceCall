import React, { useEffect, useRef, useState, useContext, createContext, useCallback } from 'react';

// Providers
import { useSocket } from '@/providers/Socket';

// Services
import ipcService from '@/services/ipc.service';
import { sfuService } from '@/services/sfu.service';
import * as mediasoupClient from 'mediasoup-client';
import { onceSfu } from '@/utils/sfuOnce.helper';

let device: mediasoupClient.Device | null = null;
let sendTransport: mediasoupClient.types.Transport | null = null;
let recvTransport: mediasoupClient.types.Transport | null = null;

// Types
import { Data, Offer, Answer, IceCandidate, SpeakingMode } from '@/types';

interface WebRTCContextType {
  handleMuteUser: (userId: string) => void;
  handleUnmuteUser: (userId: string) => void;
  handleToggleSpeakKey: (enable: boolean) => void;
  handleToggleTakeMic: () => void;
  handleToggleSpeakerMute: () => void;
  handleToggleMicMute: () => void;
  handleEditBitrate: (newBitrate: number) => void;
  handleEditMicVolume: (volume: number) => void;
  handleEditMusicVolume: (volume: number) => void;
  handleEditSpeakerVolume: (volume: number) => void;
  isPressSpeakKey: boolean;
  isMicTaken: boolean;
  isMicMute: boolean;
  isSpeakerMute: boolean;
  micVolume: number;
  speakerVolume: number;
  musicVolume: number;
  volumePercent: number;
  mutedIds: string[];
  speakStatusList: { [id: string]: number };
  connectionStatusList: { [id: string]: string };
}

const WebRTCContext = createContext<WebRTCContextType>({} as WebRTCContextType);

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) throw new Error('useWebRTC must be used within a WebRTCProvider');
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
}

const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  // States
  const [isPressSpeakKey, setIsPressSpeakKey] = useState<boolean>(false);
  const [isMicTaken, setIsMicTaken] = useState<boolean>(false);
  const [isMicMute, setIsMicMute] = useState<boolean>(false);
  const [isSpeakerMute, setIsSpeakerMute] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [musicVolume, setMusicVolume] = useState<number>(100);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [volumePercent, setVolumePercent] = useState<number>(0);
  const [mutedIds, setMutedIds] = useState<string[]>([]);
  const [speakStatusList, setSpeakStatusList] = useState<{ [id: string]: number }>({});
  const [connectionStatusList, setConnectionStatusList] = useState<Record<string, 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'>>({});

  // Refs
  const speakingModeRef = useRef<SpeakingMode>('key');
  const isPressSpeakKeyRef = useRef<boolean>(false);
  const audioRefHandlersRef = useRef<Record<string, (el: HTMLAudioElement | null) => void>>({});
  const inputDeviceIdRef = useRef<string | null>(null);
  const outputDeviceIdRef = useRef<string | null>(null);
  const volumePercentRef = useRef<number>(0);
  const volumeThresholdRef = useRef<number>(1);
  // const volumeSilenceDelayRef = useRef<number>(500);
  const localStreamRef = useRef<MediaStream | null>(null);
  const bitrateRef = useRef<number>(64000);
  const micTakenRef = useRef<boolean>(false);
  const micMuteRef = useRef<boolean>(false);
  const speakerMuteRef = useRef<boolean>(false);
  const micVolumeRef = useRef<number>(100);
  const speakerVolumeRef = useRef<number>(100);
  const musicVolumeRef = useRef<number>(100);
  const peerStreamListRef = useRef<{ [id: string]: MediaStream }>({});
  const peerAudioListRef = useRef<{ [id: string]: HTMLAudioElement }>({});
  const peerConnectionListRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const peerDataChannelListRef = useRef<{ [id: string]: RTCDataChannel }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const micSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  // const musicSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const mixGainNodeRef = useRef<GainNode | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Hooks
  const socket = useSocket();

  // Handlers
  const handleSendRTCOffer = useCallback((socketId: string, offer: RTCSessionDescriptionInit) => {
    ipcService.socket.send('RTCOffer', {
      to: socketId,
      offer: { type: offer.type, sdp: offer.sdp },
    });
  }, []);

  const handleSendRTCAnswer = useCallback((socketId: string, answer: RTCSessionDescriptionInit) => {
    ipcService.socket.send('RTCAnswer', {
      to: socketId,
      answer: { type: answer.type, sdp: answer.sdp },
    });
  }, []);

  const handleSendRTCIceCandidate = useCallback((socketId: string, candidate: RTCIceCandidate) => {
    ipcService.socket.send('RTCIceCandidate', {
      to: socketId,
      candidate: { candidate: candidate.candidate, sdpMid: candidate.sdpMid, sdpMLineIndex: candidate.sdpMLineIndex, usernameFragment: candidate.usernameFragment },
    });
  }, []);

  const removePeerConnection = useCallback((userId: string) => {
    peerConnectionListRef.current[userId].close();
    delete peerConnectionListRef.current[userId];
    delete peerStreamListRef.current[userId];
    delete peerDataChannelListRef.current[userId];
    delete peerAudioListRef.current[userId];
    delete audioRefHandlersRef.current[userId];

    setSpeakStatusList((prev) => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
  }, []);

  const createPeerConnection = useCallback(
    (userId: string, socketId: string) => {
      if (!destinationNodeRef.current) {
        console.warn('No destination node');
        return;
      }
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun2.l.google.com:19302' }],
        iceCandidatePoolSize: 10,
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) handleSendRTCIceCandidate(socketId, event.candidate);
      };
      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        setConnectionStatusList((prev) => {
          const newState = { ...prev };
          newState[userId] = state;
          return newState;
        });
        if (state === 'failed' || state === 'closed') {
          removePeerConnection(userId);
        }
      };
      peerConnection.ontrack = (event) => {
        peerStreamListRef.current[userId] = event.streams[0];
      };
      peerConnection.ondatachannel = (event) => {
        event.channel.onmessage = (event) => {
          const { volume } = JSON.parse(event.data);
          setSpeakStatusList((prev) => {
            const newState = { ...prev };
            newState[userId] = volume;
            return newState;
          });
        };
      };

      peerConnectionListRef.current[userId] = peerConnection;
      peerDataChannelListRef.current[userId] = peerConnection.createDataChannel('volume');

      setSpeakStatusList((prev) => {
        const newState = { ...prev };
        newState[userId] = 0;
        return newState;
      });

      const processedAudioTrack = destinationNodeRef.current.stream.getAudioTracks()[0];
      if (processedAudioTrack) {
        peerConnection.addTrack(processedAudioTrack, destinationNodeRef.current.stream);
      }
    },
    [removePeerConnection, handleSendRTCIceCandidate],
  );

  const handleRTCJoin = useCallback(
    async ({ from: socketId, userId }: Data) => {
      if (peerConnectionListRef.current[userId]) removePeerConnection(userId);
      createPeerConnection(userId, socketId);
      const offer = await peerConnectionListRef.current[userId].createOffer();
      await peerConnectionListRef.current[userId].setLocalDescription(offer);
      handleSendRTCOffer(socketId, offer);
    },
    [handleSendRTCOffer, createPeerConnection, removePeerConnection],
  );

  const handleRTCLeave = useCallback(
    async ({ userId }: Data) => {
      if (!peerConnectionListRef.current[userId]) return;
      removePeerConnection(userId);
    },
    [removePeerConnection],
  );

  const handleRTCOffer = useCallback(
    async ({ from: socketId, userId, offer }: Offer) => {
      if (!peerConnectionListRef.current[userId]) {
        console.warn(`Connection (${userId}) not found, creating`);
        createPeerConnection(userId, socketId);
      } else if (peerConnectionListRef.current[userId].signalingState === 'stable') {
        console.warn(`Connection (${userId}) already in stable state, recreating`);
        removePeerConnection(userId);
        createPeerConnection(userId, socketId);
      }
      const offerDes = new RTCSessionDescription({
        type: offer.type,
        sdp: offer.sdp,
      });
      await peerConnectionListRef.current[userId].setRemoteDescription(offerDes);
      const answer = await peerConnectionListRef.current[userId].createAnswer();
      await peerConnectionListRef.current[userId].setLocalDescription(answer);

      handleSendRTCAnswer(socketId, answer);
    },
    [handleSendRTCAnswer, createPeerConnection, removePeerConnection],
  );

  const handleRTCAnswer = useCallback(async ({ userId, answer }: Answer) => {
    if (!peerConnectionListRef.current[userId]) {
      console.warn(`Connection (${userId}) not found`);
      return;
    } else if (peerConnectionListRef.current[userId].signalingState === 'stable') {
      console.warn(`Connection (${userId}) already in stable state, ignoring answer`);
      return;
    }
    const answerDes = new RTCSessionDescription({
      type: answer.type,
      sdp: answer.sdp,
    });
    await peerConnectionListRef.current[userId].setRemoteDescription(answerDes);
  }, []);

  const handleRTCIceCandidate = useCallback(async ({ userId, candidate }: IceCandidate) => {
    if (!peerConnectionListRef.current[userId]) return;
    const iceCandidate = new RTCIceCandidate({
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      usernameFragment: candidate.usernameFragment,
    });
    await peerConnectionListRef.current[userId].addIceCandidate(iceCandidate);
  }, []);

  const handleEditBitrate = useCallback((bitrate?: number) => {
    if (bitrate === bitrateRef.current) {
      console.warn(`Bitrate already set to ${bitrate}, skipping...`);
      return;
    }
    const newBitrate = bitrate ?? bitrateRef.current;
    Object.values(peerConnectionListRef.current).forEach((connection) => {
      const senders = connection.getSenders();
      for (const sender of senders) {
        const parameters = sender.getParameters();
        if (!parameters.encodings) {
          parameters.encodings = [{}];
        }
        parameters.encodings[0].maxBitrate = newBitrate;
        sender.setParameters(parameters).catch((error) => {
          console.error('Error setting bitrate:', error);
        });
      }
    });
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

  const handleEditMusicVolume = useCallback((volume?: number) => {
    if (!musicGainNodeRef.current) {
      console.warn('No music gain node');
      return;
    }
    const newVolume = volume ?? musicVolumeRef.current;
    musicGainNodeRef.current.gain.value = newVolume / 100;
    setMusicVolume(newVolume);
    musicVolumeRef.current = newVolume;
  }, []);

  const handleEditSpeakerVolume = useCallback((volume?: number) => {
    const newVolume = volume ?? speakerVolumeRef.current;
    Object.values(peerAudioListRef.current).forEach((audio) => {
      audio.volume = newVolume / 100;
    });
    setSpeakerVolume(newVolume);
    speakerVolumeRef.current = newVolume;
  }, []);

  const handleEditInputStream = useCallback(
    (deviceId: string) => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (micSourceNodeRef.current) {
        micSourceNodeRef.current.disconnect();
      }

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
          if (!destinationNodeRef.current) {
            console.warn('No destination node');
            return;
          }
          if (destinationNodeRef.current.stream.getAudioTracks().length === 0) {
            console.warn('No audio tracks');
            return;
          }

          localStreamRef.current = stream;
          localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = speakingModeRef.current === 'key' ? isPressSpeakKeyRef.current : micTakenRef.current;
          });

          // Create nodes
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(micGainNodeRef.current);
          micSourceNodeRef.current = source;

          // Update track
          const newTrack = destinationNodeRef.current.stream.getAudioTracks()[0];
          Object.values(peerConnectionListRef.current).forEach((connection) => {
            const senders = connection.getSenders();
            const audioSender = senders.find((s) => s.track?.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(newTrack).catch((error) => console.error('Error replacing audio track:', error));
            }
          });

          handleEditMicVolume();
        })
        .catch((err) => console.error('Error accessing microphone', err));
    },
    [handleEditMicVolume],
  );

  const handleMuteUser = useCallback((userId: string) => {
    Object.entries(peerAudioListRef.current).forEach(([key, audio]) => {
      if (key === userId) audio.muted = true;
    });
    setMutedIds((prev) => [...prev, userId]);
  }, []);

  const handleUnmuteUser = useCallback((userId: string) => {
    Object.entries(peerAudioListRef.current).forEach(([key, audio]) => {
      if (key === userId) audio.muted = false;
    });
    setMutedIds((prev) => prev.filter((id) => id !== userId));
  }, []);

  const handleToggleSpeakKey = useCallback((enable: boolean) => {
    if (!localStreamRef.current) {
      console.warn('No local stream');
      return;
    }
    if (speakingModeRef.current !== 'key') {
      console.warn('Not in key mode');
      return;
    }
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = micTakenRef.current ? enable : false;
    });
    isPressSpeakKeyRef.current = enable;
    setIsPressSpeakKey(enable);
  }, []);

  const handleToggleTakeMic = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn('No local stream');
      return;
    }
    localStreamRef.current.getAudioTracks().forEach((track) => {
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

  // const handleEditMusicInputStream = useCallback(
  //   (stream: AudioBuffer) => {
  //     if (musicSourceNodeRef.current) {
  //       musicSourceNodeRef.current.disconnect();
  //     }
  //     if (!audioContextRef.current) {
  //       console.warn('No audio context');
  //       return;
  //     }
  //     if (!musicGainNodeRef.current) {
  //       console.warn('No music gain node');
  //       return;
  //     }
  //     if (!destinationNodeRef.current) {
  //       console.warn('No destination node');
  //       return;
  //     }

  //     // Create nodes
  //     const source = audioContextRef.current.createBufferSource();
  //     source.buffer = stream;
  //     source.connect(musicGainNodeRef.current);
  //     musicSourceNodeRef.current = source;

  //     // Update track
  //     const newTrack = destinationNodeRef.current.stream.getAudioTracks()[0];
  //     Object.values(peerConnectionListRef.current).forEach((connection) => {
  //       const senders = connection.getSenders();
  //       const audioSender = senders.find((s) => s.track?.kind === 'audio');
  //       if (audioSender) {
  //         audioSender.replaceTrack(newTrack).catch((error) => console.error('Error replacing audio track:', error));
  //       }
  //     });

  //     handleEditMusicVolume();
  //   },
  //   [handleEditMusicVolume],
  // );

  const getAudioRef = useCallback(
    (userId: string) => {
      if (!audioRefHandlersRef.current[userId]) {
        audioRefHandlersRef.current[userId] = (el: HTMLAudioElement | null) => {
          if (!el) {
            delete peerAudioListRef.current[userId];
            return;
          }
          const stream = peerStreamListRef.current[userId];
          if (el.srcObject !== stream) el.srcObject = stream;

          peerAudioListRef.current[userId] = el;
          el.muted = mutedIds.includes(userId);
          el.volume = (speakerMuteRef.current ? 0 : speakerVolumeRef.current) / 100;

          if (outputDeviceIdRef.current && 'setSinkId' in el) {
            (el as HTMLAudioElement).setSinkId(outputDeviceIdRef.current).catch(() => {});
          }
        };
      }
      return audioRefHandlersRef.current[userId];
    },
    [mutedIds],
  );

  // Effects
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
    const destination = audioCtx.createMediaStreamDestination();

    // Connect nodes
    micGain.connect(analyser);
    mixGain.connect(analyser);
    analyser.connect(destination);

    // Set nodes
    audioContextRef.current = audioCtx;
    micGainNodeRef.current = micGain;
    mixGainNodeRef.current = mixGain;
    destinationNodeRef.current = destination;

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
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((track) => track.stop());
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
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [handleEditInputStream]);

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
        for (const dataChannel of Object.values(peerDataChannelListRef.current)) {
          if (dataChannel && dataChannel.readyState === 'open') dataChannel.send(JSON.stringify({ volume }));
        }
        setVolumePercent(volume);
        lastSent = volume;
      }
    }, 66);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsubscribe: (() => void)[] = [
      ipcService.socket.on('RTCJoin', handleRTCJoin),
      ipcService.socket.on('RTCLeave', handleRTCLeave),
      ipcService.socket.on('RTCOffer', handleRTCOffer),
      ipcService.socket.on('RTCAnswer', handleRTCAnswer),
      ipcService.socket.on('RTCIceCandidate', handleRTCIceCandidate),
    ];
    return () => unsubscribe.forEach((unsub) => unsub());
  }, [socket.isConnected, handleRTCJoin, handleRTCLeave, handleRTCOffer, handleRTCAnswer, handleRTCIceCandidate]);

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
        handleEditMusicVolume,
        handleEditSpeakerVolume,
        isPressSpeakKey,
        isMicTaken,
        isMicMute,
        isSpeakerMute,
        micVolume,
        speakerVolume,
        musicVolume,
        volumePercent,
        mutedIds,
        speakStatusList,
        connectionStatusList,
      }}
    >
      {Object.keys(peerStreamListRef.current).map((userId) => (
        <audio key={userId} ref={getAudioRef(userId)} autoPlay controls style={{ display: 'none' }} />
      ))}
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
