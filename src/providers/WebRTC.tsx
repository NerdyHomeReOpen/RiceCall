import React, { useEffect, useRef, useState, useContext, createContext, useCallback } from 'react';

// Providers
import { useSocket } from '@/providers/Socket';

// Types
import { SocketServerEvent } from '@/types';

// Services
import ipcService from '@/services/ipc.service';

type Data = {
  from: string;
  userId: string;
};

type Offer = {
  from: string;
  userId: string;
  offer: {
    type: RTCSdpType;
    sdp: string;
  };
};

type Answer = {
  from: string;
  userId: string;
  answer: {
    type: RTCSdpType;
    sdp: string;
  };
};

type IceCandidate = {
  from: string;
  userId: string;
  candidate: {
    candidate: string;
    sdpMid: string | null;
    sdpMLineIndex: number | null;
    usernameFragment: string | null;
  };
};

interface WebRTCContextType {
  handleMuteUser: (userId: string) => void;
  handleUnmuteUser: (userId: string) => void;
  handleToggleTakeMic: () => void;
  handleToggleSpeakerMute: () => void;
  handleToggleMicMute: () => void;
  handleEditBitrate: (newBitrate: number) => void;
  handleEditMicVolume: (volume: number) => void;
  handleEditMusicVolume: (volume: number) => void;
  handleEditSpeakerVolume: (volume: number) => void;
  handleEditInputStream: (deviceId: string) => void;
  handleEditOutputStream: (deviceId: string) => void;
  handleEditMusicInputStream: (audioBuffer: AudioBuffer) => void;
  muteList: string[];
  isMicMute: boolean;
  isSpeakerMute: boolean;
  isMicTaken: boolean;
  bitrate: number;
  micVolume: number;
  speakerVolume: number;
  musicVolume: number;
  volumePercent: number;
  speakStatus: { [id: string]: number };
  connectionStatus: { [id: string]: string };
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
  const [isMicTaken, setIsMicTaken] = useState<boolean>(false);
  const [isMicMute, setIsMicMute] = useState<boolean>(false);
  const [isSpeakerMute, setIsSpeakerMute] = useState<boolean>(false);
  const [bitrate, setBitrate] = useState<number>(64000);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [musicVolume, setMusicVolume] = useState<number>(100);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [speakStatus, setSpeakStatus] = useState<{ [id: string]: number }>({});
  const [volumePercent, setVolumePercent] = useState<number>(0);
  const [muteList, setMuteList] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed'>>({});

  // Refs
  const volumePercentRef = useRef<number>(0);
  const volumeThresholdRef = useRef<number>(1);
  const volumeSilenceDelayRef = useRef<number>(500);
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
  const musicSourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const mixGainNodeRef = useRef<GainNode | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Hooks
  const socket = useSocket();

  // Handlers
  const handleToggleTakeMic = useCallback(() => {
    if (!localStreamRef.current) {
      console.warn('No local stream');
      return;
    }

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !micTakenRef.current;
    });

    setIsMicTaken(!micTakenRef.current);
    micTakenRef.current = !micTakenRef.current;
  }, []);

  const handleMuteUser = useCallback((userId: string) => {
    Object.entries(peerAudioListRef.current).forEach(([key, audio]) => {
      if (key === userId) audio.muted = true;
    });

    setMuteList((prev) => [...prev, userId]);
  }, []);

  const handleUnmuteUser = useCallback((userId: string) => {
    Object.entries(peerAudioListRef.current).forEach(([key, audio]) => {
      if (key === userId) audio.muted = false;
    });

    setMuteList((prev) => prev.filter((id) => id !== userId));
  }, []);

  const handleToggleMicMute = useCallback(() => {
    if (micMuteRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-mic-volume') || '50');
      handleEditMicVolume(prevVolume);
    } else {
      localStorage.setItem('previous-mic-volume', micVolume.toString());
      handleEditMicVolume(0);
    }

    setIsMicMute(!micMuteRef.current);
    micMuteRef.current = !micMuteRef.current;
  }, []);

  const handleToggleSpeakerMute = useCallback(() => {
    if (speakerMuteRef.current) {
      const prevVolume = parseInt(localStorage.getItem('previous-speaker-volume') || '50');
      handleEditSpeakerVolume(prevVolume);
    } else {
      localStorage.setItem('previous-speaker-volume', speakerVolume.toString());
      handleEditSpeakerVolume(0);
    }

    setIsSpeakerMute(!speakerMuteRef.current);
    speakerMuteRef.current = !speakerMuteRef.current;
  }, []);

  const handleEditBitrate = useCallback((bitrate?: number) => {
    console.info('Bitrate changed to', bitrate);
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

    setBitrate(newBitrate);
    bitrateRef.current = newBitrate;
  }, []);

  const handleEditMicVolume = useCallback((volume?: number) => {
    if (!localStreamRef.current) {
      console.warn('No local stream');
      return;
    }
    if (!audioContextRef.current) {
      console.warn('No audio context');
      return;
    }
    if (!micGainNodeRef.current) {
      console.warn('No mic gain node');
      return;
    }
    if (!micSourceNodeRef.current) {
      console.warn('No mic source node');
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

    // Set gain value
    const newVolume = volume ?? micVolumeRef.current;

    micGainNodeRef.current.gain.value = newVolume / 100;

    // Process audio tracks
    const processedTrack = destinationNodeRef.current.stream.getAudioTracks()[0];
    Object.values(peerConnectionListRef.current).forEach((connection) => {
      const senders = connection.getSenders();
      const audioSender = senders.find((s) => s.track?.kind === 'audio');
      if (audioSender) {
        audioSender.replaceTrack(processedTrack).catch((error) => console.error('Error replacing audio track:', error));
      }
    });

    setMicVolume(newVolume);
    micVolumeRef.current = newVolume;
  }, []);

  const handleEditMusicVolume = useCallback((volume?: number) => {
    if (!musicGainNodeRef.current) {
      console.warn('No music gain node');
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

    const newVolume = volume ?? musicVolumeRef.current;

    musicGainNodeRef.current.gain.value = newVolume / 100;

    // Process audio tracks
    const processedTrack = destinationNodeRef.current.stream.getAudioTracks()[0];
    Object.values(peerConnectionListRef.current).forEach((connection) => {
      const senders = connection.getSenders();
      const audioSender = senders.find((s) => s.track?.kind === 'audio');
      if (audioSender) {
        audioSender.replaceTrack(processedTrack).catch((error) => console.error('Error replacing audio track:', error));
      }
    });

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

          // Create nodes
          const source = audioContextRef.current.createMediaStreamSource(stream);

          // Connect nodes
          source.connect(micGainNodeRef.current);

          // Set nodes
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

  const handleEditOutputStream = useCallback(
    (deviceId: string) => {
      Object.values(peerAudioListRef.current).forEach((audio) => {
        audio.setSinkId(deviceId).catch((err) => console.error('Error accessing speaker:', err));
      });

      handleEditSpeakerVolume();
    },
    [handleEditSpeakerVolume],
  );

  const handleEditMusicInputStream = useCallback(
    (stream: AudioBuffer) => {
      if (musicSourceNodeRef.current) {
        musicSourceNodeRef.current.disconnect();
      }
      if (!audioContextRef.current) {
        console.warn('No audio context');
        return;
      }
      if (!musicGainNodeRef.current) {
        console.warn('No music gain node');
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

      // Create nodes
      const source = audioContextRef.current.createBufferSource();
      source.buffer = stream;

      // Connect nodes
      source.connect(musicGainNodeRef.current);

      // Set nodes
      musicSourceNodeRef.current = source;

      // Update track
      const newTrack = destinationNodeRef.current.stream.getAudioTracks()[0];
      Object.values(peerConnectionListRef.current).forEach((connection) => {
        const senders = connection.getSenders();
        const audioSender = senders.find((s) => s.track?.kind === 'audio');
        if (audioSender) {
          audioSender.replaceTrack(newTrack).catch((error) => console.error('Error replacing audio track:', error));
        }
      });

      handleEditMusicVolume();
    },
    [handleEditMusicVolume],
  );

  const handleSendRTCOffer = (socketId: string, offer: RTCSessionDescriptionInit) => {
    if (!socket) return;
    socket.send.RTCOffer({
      to: socketId,
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
    });
  };

  const handleSendRTCAnswer = (socketId: string, answer: RTCSessionDescriptionInit) => {
    if (!socket) return;
    socket.send.RTCAnswer({
      to: socketId,
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    });
  };

  const handleSendRTCIceCandidate = (socketId: string, candidate: RTCIceCandidate) => {
    if (!socket) return;
    socket.send.RTCIceCandidate({
      to: socketId,
      candidate: {
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment,
      },
    });
  };

  const handleRTCJoin = async ({ from: socketId, userId }: Data) => {
    if (peerConnectionListRef.current[userId]) removePeerConnection(userId);
    createPeerConnection(userId, socketId);
    const offer = await peerConnectionListRef.current[userId].createOffer();
    await peerConnectionListRef.current[userId].setLocalDescription(offer);
    handleSendRTCOffer(socketId, offer);
  };

  const handleRTCLeave = async ({ userId }: Data) => {
    if (!peerConnectionListRef.current[userId]) return;
    removePeerConnection(userId);
  };

  const handleRTCOffer = async ({ from: socketId, userId, offer }: Offer) => {
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
  };

  const handleRTCAnswer = async ({ userId, answer }: Answer) => {
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
  };

  const handleRTCIceCandidate = async ({ userId, candidate }: IceCandidate) => {
    if (!peerConnectionListRef.current[userId]) return;
    const iceCandidate = new RTCIceCandidate({
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      usernameFragment: candidate.usernameFragment,
    });
    await peerConnectionListRef.current[userId].addIceCandidate(iceCandidate);
  };

  const removePeerConnection = (userId: string) => {
    if (!peerConnectionListRef.current[userId]) {
      console.warn(`Connection (${userId}) not found`);
      return;
    }
    if (!peerDataChannelListRef.current[userId]) {
      console.warn(`Data channel (${userId}) not found`);
      return;
    }

    peerConnectionListRef.current[userId].close();
    delete peerConnectionListRef.current[userId];
    delete peerAudioListRef.current[userId];

    setSpeakStatus((prev) => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
  };

  const createPeerConnection = (userId: string, socketId: string) => {
    if (peerConnectionListRef.current[userId]) {
      console.warn(`Connection (${userId}) already exists`);
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

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }, { urls: 'stun:stun2.l.google.com:19302' }],
      iceCandidatePoolSize: 10,
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) handleSendRTCIceCandidate(socketId, event.candidate);
    };

    peerConnection.oniceconnectionstatechange = () => {
      setConnectionStatus((prev) => {
        const newState = { ...prev };
        newState[userId] = peerConnection.connectionState;
        return newState;
      });
      const isFailed = ['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState);
      if (isFailed) removePeerConnection(userId);
    };

    peerConnection.onconnectionstatechange = () => {
      setConnectionStatus((prev) => {
        const newState = { ...prev };
        newState[userId] = peerConnection.connectionState;
        return newState;
      });
      const isFailed = ['disconnected', 'failed', 'closed'].includes(peerConnection.connectionState);
      if (isFailed) removePeerConnection(userId);
    };

    peerConnection.onsignalingstatechange = () => {
      const isFailed = ['disconnected', 'failed', 'closed'].includes(peerConnection.signalingState);
      if (isFailed) removePeerConnection(userId);
    };

    peerConnection.ontrack = (event) => {
      if (!peerAudioListRef.current[userId]) {
        peerAudioListRef.current[userId] = document.body.appendChild(document.createElement('audio'));
        peerAudioListRef.current[userId].autoplay = true;
        peerAudioListRef.current[userId].oncanplay = () => handleEditSpeakerVolume();
      }
      peerAudioListRef.current[userId].srcObject = event.streams[0];
      peerStreamListRef.current[userId] = event.streams[0];
    };

    peerConnection.ondatachannel = (event) => {
      event.channel.onmessage = (event) => {
        const { volume } = JSON.parse(event.data);
        setSpeakStatus((prev) => {
          const newState = { ...prev };
          newState[userId] = volume;
          return newState;
        });
      };
    };

    peerConnectionListRef.current[userId] = peerConnection;
    peerDataChannelListRef.current[userId] = peerConnection.createDataChannel('volume');

    setSpeakStatus((prev) => {
      const newState = { ...prev };
      newState[userId] = 0;
      return newState;
    });

    const processedAudioTrack = destinationNodeRef.current.stream.getAudioTracks()[0];
    if (processedAudioTrack) {
      peerConnection.addTrack(processedAudioTrack, destinationNodeRef.current.stream);
    }
  };

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
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

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
      if (volumePercent > volumeThresholdRef.current) {
        if (volumePercentRef.current !== -1) {
          volumePercentRef.current = volumePercent;
          setVolumePercent(volumePercent);
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            if (volumePercentRef.current !== -1) {
              volumePercentRef.current = 0;
              setVolumePercent(0);
            }
          }, volumeSilenceDelayRef.current);
        }
      }

      requestAnimationFrame(detectSpeaking);
    };
    detectSpeaking();

    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    // Get input device info
    // const getInputDeviceInfo = async (deviceId: string) => {
    //   const devices = await navigator.mediaDevices.enumerateDevices();
    //   const deviceInfo = devices.find((d) => d.deviceId === deviceId);
    //   console.info('New input stream device info:', deviceInfo);
    // };

    // const getOutputDeviceInfo = async (deviceId: string) => {
    //   const devices = await navigator.mediaDevices.enumerateDevices();
    //   const deviceInfo = devices.find((d) => d.deviceId === deviceId);
    //   console.info('New output stream device info:', deviceInfo);
    // };

    ipcService.systemSettings.inputAudioDevice.get(() => {});
    ipcService.systemSettings.outputAudioDevice.get(() => {});

    const offUpdateInput = ipcService.systemSettings.inputAudioDevice.onUpdate((deviceId) => {
      handleEditInputStream(deviceId || '');
    });

    const offUpdateOutput = ipcService.systemSettings.outputAudioDevice.onUpdate((deviceId) => {
      handleEditOutputStream(deviceId || '');
    });

    return () => {
      offUpdateInput();
      offUpdateOutput();
    };
  }, [handleEditInputStream, handleEditOutputStream]);

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
    for (const dataChannel of Object.values(peerDataChannelListRef.current)) {
      if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ volume: volumePercent }));
      }
    }
  }, [volumePercent]);

  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      [SocketServerEvent.RTC_JOIN]: handleRTCJoin,
      [SocketServerEvent.RTC_LEAVE]: handleRTCLeave,
      [SocketServerEvent.RTC_OFFER]: handleRTCOffer,
      [SocketServerEvent.RTC_ANSWER]: handleRTCAnswer,
      [SocketServerEvent.RTC_ICE_CANDIDATE]: handleRTCIceCandidate,
    };
    const unsubscribe: (() => void)[] = [];

    Object.entries(eventHandlers).map(([event, handler]) => {
      const unsub = socket.on[event as SocketServerEvent](handler);
      unsubscribe.push(unsub);
    });

    return () => {
      unsubscribe.forEach((unsub) => unsub());
    };
  }, [socket]);

  return (
    <WebRTCContext.Provider
      value={{
        handleToggleTakeMic,
        handleMuteUser,
        handleUnmuteUser,
        handleToggleSpeakerMute,
        handleToggleMicMute,
        handleEditBitrate,
        handleEditMicVolume,
        handleEditMusicVolume,
        handleEditSpeakerVolume,
        handleEditInputStream,
        handleEditOutputStream,
        handleEditMusicInputStream,
        muteList,
        isMicMute,
        isSpeakerMute,
        isMicTaken,
        bitrate,
        micVolume,
        speakerVolume,
        musicVolume,
        volumePercent,
        speakStatus,
        connectionStatus,
      }}
    >
      {Object.keys(peerStreamListRef.current).map((userId) => (
        <audio
          key={userId}
          ref={(el) => {
            if (el) el.srcObject = peerStreamListRef.current[userId];
          }}
          autoPlay
          controls
          style={{ display: 'none' }}
        />
      ))}
      {children}
    </WebRTCContext.Provider>
  );
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
