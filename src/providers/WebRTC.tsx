/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  createContext,
  useCallback,
} from 'react';

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
  handleMute: (userId: string) => void;
  handleUnmute: (userId: string) => void;
  handleToggleMute: () => void;
  handleUpdateBitrate: (newBitrate: number) => void;
  handleUpdateMicVolume: (volume: number) => void;
  handleUpdateSpeakerVolume: (volume: number) => void;
  handleUpdateInputStream: (deviceId: string) => void;
  handleUpdateOutputStream: (deviceId: string) => void;
  muteList: string[];
  isMute: boolean;
  bitrate: number;
  micVolume: number;
  speakerVolume: number;
  volumePercent: number;
  speakStatus: { [id: string]: number };
}

const WebRTCContext = createContext<WebRTCContextType>({} as WebRTCContextType);

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context)
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
}

const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  // States
  const [isMute, setIsMute] = useState<boolean>(false);
  const [bitrate, setBitrate] = useState<number>(128000);
  const [micVolume, setMicVolume] = useState<number>(100);
  const [speakerVolume, setSpeakerVolume] = useState<number>(100);
  const [speakStatus, setSpeakStatus] = useState<{ [id: string]: number }>({});
  const [volumePercent, setVolumePercent] = useState<number>(0);
  const [muteList, setMuteList] = useState<string[]>([]);

  // Refs
  const volumePercentRef = useRef<number>(0);
  const localStream = useRef<MediaStream | null>(null);
  const peerStreams = useRef<{ [id: string]: MediaStream }>({});
  const peerAudioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const peerDataChannels = useRef<{ [id: string]: RTCDataChannel }>({});
  const audioContext = useRef<AudioContext | null>(null);
  const gainNode = useRef<GainNode | null>(null);
  const sourceNode = useRef<MediaStreamAudioSourceNode | null>(null);
  const destinationNode = useRef<MediaStreamAudioDestinationNode | null>(null);
  const analyserNode = useRef<AnalyserNode | null>(null);
  const volumeThreshold = useRef<number>(1);
  const volumeSilenceDelay = useRef<number>(500);

  // Hooks
  const socket = useSocket();

  // Handlers
  const handleMute = (userId: string) => {
    setMuteList((prev) => [...prev, userId]);
    Object.entries(peerAudioRefs.current).forEach(([key, audio]) => {
      if (key === userId) {
        audio.volume = 0;
      }
    });
  };

  const handleUnmute = (userId: string) => {
    setMuteList((prev) => prev.filter((id) => id !== userId));
    Object.entries(peerAudioRefs.current).forEach(([key, audio]) => {
      if (key === userId) {
        audio.volume = speakerVolume / 100;
      }
    });
  };

  const handleToggleMute = () => {
    try {
      localStream.current?.getAudioTracks().forEach((track) => {
        track.enabled = isMute;
      });
      setIsMute(!isMute);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleUpdateBitrate = useCallback(
    (newBitrate: number) => {
      try {
        if (newBitrate === bitrate) {
          console.warn(`Bitrate already set to ${newBitrate}, skipping...`);
          return;
        }

        Object.values(peerConnections.current).forEach(async (connection) => {
          const senders = connection.getSenders();
          for (const sender of senders) {
            const parameters = sender.getParameters();
            if (!parameters.encodings) {
              parameters.encodings = [{}];
            }
            parameters.encodings[0].maxBitrate = newBitrate;
            await sender.setParameters(parameters);
          }
        });
        setBitrate(newBitrate);
      } catch (error) {
        console.error('Error updating bitrate:', error);
      }
    },
    [bitrate],
  );

  const handleUpdateMicVolume = useCallback(
    (volume: number | null) => {
      try {
        if (!audioContext.current) {
          console.warn('No audio context');
          return;
        }
        if (!gainNode.current) {
          console.warn('No gain node');
          return;
        }
        if (!sourceNode.current) {
          console.warn('No source node');
          return;
        }
        if (!destinationNode.current) {
          console.warn('No destination node');
          return;
        }
        if (destinationNode.current.stream.getAudioTracks().length === 0) {
          console.warn('No audio tracks');
          return;
        }

        // Set gain value
        const newVolume = volume !== null ? volume : micVolume;
        gainNode.current.gain.value = newVolume / 100;

        // Process audio tracks
        const processedTrack =
          destinationNode.current.stream.getAudioTracks()[0];
        Object.values(peerConnections.current).forEach((connection) => {
          const senders = connection.getSenders();
          const audioSender = senders.find((s) => s.track?.kind === 'audio');
          if (audioSender) {
            audioSender
              .replaceTrack(null)
              .then(() =>
                audioSender
                  .replaceTrack(processedTrack)
                  .catch((error) =>
                    console.error('Error replacing audio track:', error),
                  ),
              )
              .catch((error) =>
                console.error('Error removing audio track:', error),
              );
          }
        });
        setMicVolume(newVolume);
      } catch (error) {
        console.error('Error updating microphone volume:', error);
      }
    },
    [micVolume],
  );

  const handleUpdateSpeakerVolume = useCallback(
    (volume: number | null) => {
      try {
        // Set volume
        const newVolume = volume !== null ? volume : speakerVolume;
        Object.entries(peerAudioRefs.current).forEach(([userId, audio]) => {
          if (!muteList.includes(userId)) audio.volume = newVolume / 100;
        });
        setSpeakerVolume(newVolume);
      } catch (error) {
        console.error('Error updating speaker volume:', error);
      }
    },
    [speakerVolume],
  );

  const handleUpdateInputStream = useCallback(
    (deviceId: string) => {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        })
        .then((stream) => {
          localStream.current = stream;
          audioContext.current = new AudioContext();

          // Create nodes
          const ctx = audioContext.current;
          const source = ctx.createMediaStreamSource(stream);
          const gain = ctx.createGain();
          const destination = ctx.createMediaStreamDestination();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          const dataArray = new Uint8Array(analyser.fftSize);

          source.connect(gain);
          gain.connect(analyser);
          gain.connect(destination);

          // Set nodes
          sourceNode.current = source;
          gainNode.current = gain;
          destinationNode.current = destination;
          analyserNode.current = analyser;

          let silenceTimer: ReturnType<typeof setTimeout> | null = null;

          const detectSpeaking = () => {
            if (!analyserNode.current) return;
            analyserNode.current.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const v = (dataArray[i] - 128) / 128;
              sum += v * v;
            }
            const volume = Math.sqrt(sum / dataArray.length);
            const volumePercent = Math.floor(Math.min(1, volume / 0.5) * 100);

            if (volumePercent > volumeThreshold.current) {
              if (volumePercentRef.current !== -1) {
                volumePercentRef.current = volumePercent;
                setVolumePercent(volumePercent);
                if (silenceTimer) clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => {
                  if (volumePercentRef.current !== -1) {
                    volumePercentRef.current = 0;
                    setVolumePercent(0);
                  }
                }, volumeSilenceDelay.current);
              }
            }

            requestAnimationFrame(detectSpeaking);
          };
          detectSpeaking();
        })
        .catch((err) => console.error('Error accessing microphone', err));
      handleUpdateMicVolume(null);
    },
    [handleUpdateMicVolume],
  );

  const handleUpdateOutputStream = useCallback(
    async (deviceId: string) => {
      Object.values(peerAudioRefs.current).forEach((audio) =>
        audio
          .setSinkId(deviceId)
          .catch((err) => console.error('Error accessing speaker:', err)),
      );
      handleUpdateSpeakerVolume(null);
    },
    [handleUpdateSpeakerVolume],
  );

  const handleSendRTCOffer = useCallback(
    (socketId: string, offer: RTCSessionDescriptionInit) => {
      if (!socket) return;
      socket.send.RTCOffer({
        to: socketId,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
      });
    },
    [socket],
  );

  const handleSendRTCAnswer = useCallback(
    (socketId: string, answer: RTCSessionDescriptionInit) => {
      if (!socket) return;
      socket.send.RTCAnswer({
        to: socketId,
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      });
    },
    [socket],
  );

  const handleSendRTCIceCandidate = useCallback(
    (socketId: string, candidate: RTCIceCandidate) => {
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
    },
    [socket],
  );

  const removePeerConnection = useCallback(async (userId: string) => {
    try {
      // Remove peer connection
      if (!peerConnections.current[userId]) {
        console.warn('Peer connection not found');
        return;
      }
      if (!peerDataChannels.current[userId]) {
        console.warn('Peer data channel not found');
        return;
      }

      peerConnections.current[userId].close();
      delete peerConnections.current[userId];
      delete peerAudioRefs.current[userId];

      // Remove speaking status
      setSpeakStatus((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    } catch (error) {
      console.error('Error removing peer connection:', error);
    }
  }, []);

  const createPeerConnection = useCallback(
    async (userId: string, socketId: string) => {
      try {
        // Create peer connection
        if (peerConnections.current[userId]) {
          console.warn('Peer connection already exists');
          return;
        }

        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ],
          iceCandidatePoolSize: 10,
        });

        peerConnection.onicecandidate = (event) => {
          if (event.candidate)
            handleSendRTCIceCandidate(socketId, event.candidate);
        };
        peerConnection.oniceconnectionstatechange = () => {
          console.info(
            userId,
            'Connection State:',
            peerConnection.connectionState,
          );
          const isFailed = ['disconnected', 'failed', 'closed'].includes(
            peerConnection.connectionState,
          );
          if (isFailed) removePeerConnection(userId);
        };
        peerConnection.onconnectionstatechange = () => {
          console.info(
            userId,
            'Connection State:',
            peerConnection.connectionState,
          );
          const isFailed = ['disconnected', 'failed', 'closed'].includes(
            peerConnection.connectionState,
          );
          if (isFailed) removePeerConnection(userId);
        };
        peerConnection.onsignalingstatechange = () => {
          console.info(
            userId,
            'Signaling State:',
            peerConnection.signalingState,
          );
          const isFailed = ['disconnected', 'failed', 'closed'].includes(
            peerConnection.signalingState,
          );
          if (isFailed) removePeerConnection(userId);
        };
        peerConnection.ontrack = (event) => {
          if (!peerAudioRefs.current[userId]) {
            peerAudioRefs.current[userId] = document.body.appendChild(
              document.createElement('audio'),
            );
            peerAudioRefs.current[userId].autoplay = true;
            peerAudioRefs.current[userId].oncanplay = () =>
              handleUpdateSpeakerVolume(null);
          }
          peerAudioRefs.current[userId].srcObject = event.streams[0];
          peerStreams.current[userId] = event.streams[0];
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
        peerConnections.current[userId] = peerConnection;
        peerDataChannels.current[userId] =
          peerConnection.createDataChannel('volume');

        // Create speaking status
        setSpeakStatus((prev) => {
          const newState = { ...prev };
          newState[userId] = 0;
          return newState;
        });

        // Add audio track to peer connection
        if (!destinationNode.current) {
          console.warn('No destination node');
          return;
        }
        if (destinationNode.current.stream.getAudioTracks().length === 0) {
          console.warn('No audio tracks');
          return;
        }

        const processedAudioTrack =
          destinationNode.current.stream.getAudioTracks()[0];
        if (processedAudioTrack) {
          peerConnection.addTrack(
            processedAudioTrack,
            destinationNode.current.stream,
          );
        }
      } catch (error) {
        console.error('Error creating peer connection:', error);
      }
    },
    [
      removePeerConnection,
      handleUpdateSpeakerVolume,
      handleSendRTCIceCandidate,
    ],
  );

  const handleRTCJoin = useCallback(
    async ({ from: socketId, userId }: Data) => {
      try {
        // Remove peer connection if it exists
        if (peerConnections.current[userId]) await removePeerConnection(userId);
        // Create peer connection
        await createPeerConnection(userId, socketId);
        // Create offer
        const offer = await peerConnections.current[userId].createOffer();
        await peerConnections.current[userId].setLocalDescription(offer);
        // Send offer
        handleSendRTCOffer(socketId, offer);
      } catch (error) {
        console.error('Error handling RTC join:', error);
      }
    },
    [createPeerConnection, removePeerConnection, handleSendRTCOffer],
  );

  const handleRTCLeave = useCallback(
    async ({ userId }: Data) => {
      try {
        if (!peerConnections.current[userId]) return;
        // Remove peer connection
        await removePeerConnection(userId);
      } catch (error) {
        console.error('Error handling RTC leave:', error);
      }
    },
    [removePeerConnection],
  );

  const handleRTCOffer = useCallback(
    async ({ from: socketId, userId, offer }: Offer) => {
      try {
        if (!peerConnections.current[userId]) {
          await createPeerConnection(userId, socketId);
        } else if (
          peerConnections.current[userId].signalingState === 'stable'
        ) {
          console.warn(
            'Connection already in stable state, preparing to handle new offer',
          );
          await removePeerConnection(userId);
          await createPeerConnection(userId, socketId);
        }
        // Receive offer
        const offerDes = new RTCSessionDescription({
          type: offer.type,
          sdp: offer.sdp,
        });
        await peerConnections.current[userId].setRemoteDescription(offerDes);
        // Create answer
        const answer = await peerConnections.current[userId].createAnswer();
        await peerConnections.current[userId].setLocalDescription(answer);
        // Send answer
        handleSendRTCAnswer(socketId, answer);
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    },
    [createPeerConnection, removePeerConnection, handleSendRTCAnswer],
  );

  const handleRTCAnswer = useCallback(async ({ userId, answer }: Answer) => {
    try {
      if (!peerConnections.current[userId]) return;
      // Check if connection is already in stable state
      if (peerConnections.current[userId].signalingState === 'stable') {
        console.warn('Connection already in stable state, ignoring answer');
        return;
      }
      // Receive answer
      const answerDes = new RTCSessionDescription({
        type: answer.type,
        sdp: answer.sdp,
      });
      await peerConnections.current[userId].setRemoteDescription(answerDes);
    } catch (error) {
      console.error('Error setting remote description:', error);
    }
  }, []);

  const handleRTCIceCandidate = useCallback(
    async ({ userId, candidate }: IceCandidate) => {
      try {
        if (!peerConnections.current[userId]) return;
        // Receive ICE candidate
        const iceCandidate = new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          usernameFragment: candidate.usernameFragment,
        });
        await peerConnections.current[userId].addIceCandidate(iceCandidate);
      } catch (error) {
        console.error('Error adding ice candidate:', error);
      }
    },
    [],
  );

  useEffect(() => {
    handleUpdateInputStream('');
    handleUpdateOutputStream('');

    ipcService.audio.get('input', async (deviceId) => {
      // Get device info
      const devices = await navigator.mediaDevices.enumerateDevices();
      const deviceInfo = devices.find((d) => d.deviceId === deviceId);
      console.info('New input stream device info:', deviceInfo);
      handleUpdateInputStream(deviceId || '');
    });
    ipcService.audio.get('output', async (deviceId) => {
      // Get device info
      const devices = await navigator.mediaDevices.enumerateDevices();
      const deviceInfo = devices.find((d) => d.deviceId === deviceId);
      console.info('New output stream device info:', deviceInfo);
      handleUpdateOutputStream(deviceId || '');
    });

    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }
      if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }
      if (gainNode.current) {
        gainNode.current = null;
      }
      if (sourceNode.current) {
        sourceNode.current = null;
      }
      if (destinationNode.current) {
        destinationNode.current = null;
      }
    };
  }, []);

  useEffect(() => {
    for (const dataChannel of Object.values(peerDataChannels.current)) {
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
  }, [
    socket,
    isMute,
    micVolume,
    speakerVolume,
    bitrate,
    handleRTCJoin,
    handleRTCLeave,
    handleRTCOffer,
    handleRTCAnswer,
    handleRTCIceCandidate,
  ]);

  return (
    <WebRTCContext.Provider
      value={{
        handleMute,
        handleUnmute,
        handleToggleMute,
        handleUpdateBitrate,
        handleUpdateMicVolume,
        handleUpdateSpeakerVolume,
        handleUpdateInputStream,
        handleUpdateOutputStream,
        muteList,
        isMute,
        bitrate,
        micVolume,
        speakerVolume,
        volumePercent,
        speakStatus,
      }}
    >
      {Object.keys(peerStreams).map((userId) => (
        <audio
          key={userId}
          ref={(el) => {
            if (el) el.srcObject = peerStreams.current[userId];
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
