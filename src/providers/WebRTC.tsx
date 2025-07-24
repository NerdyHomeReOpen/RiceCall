import React, { useEffect, useRef, useState, useContext, createContext, useCallback } from 'react';

// Providers
import { useSocket } from '@/providers/Socket';

// Types
import { SocketServerEvent } from '@/types';

// Services
import ipcService from '@/services/ipc.service';
import { sfuService } from '@/services/sfu.service';
import * as mediasoupClient from 'mediasoup-client';
import { onceSfu } from '@/utils/sfuOnce.helper';

let device: mediasoupClient.Device | null = null;
let sendTransport: mediasoupClient.types.Transport | null = null;
let recvTransport: mediasoupClient.types.Transport | null = null;

type Data = {
  from: string;
  userId: string;
  channelId: string;
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
  handleEditBitrate: (newBitrate: number) => void;
  handleEditMicVolume: (volume: number) => void;
  handleEditMusicVolume: (volume: number) => void;
  handleEditSpeakerVolume: (volume: number) => void;
  handleEditInputStream: (deviceId: string) => void;
  handleEditOutputStream: (deviceId: string) => void;
  handleEditMusicInputStream: (audioBuffer: AudioBuffer) => void;
  muteList: string[];
  isMute: boolean;
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
  const [isMute, setIsMute] = useState<boolean>(true);
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
  const volumeThreshold = useRef<number>(1);
  const volumeSilenceDelay = useRef<number>(500);
  const localStream = useRef<MediaStream | null>(null);
  const localMute = useRef<boolean>(false);
  const localBitrate = useRef<number>(64000);
  const localMicVolume = useRef<number>(100);
  const localSpeakerVolume = useRef<number>(100);
  const localMusicVolume = useRef<number>(100);
  const peerStreams = useRef<{ [id: string]: MediaStream }>({});
  const peerAudioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const peerDataChannels = useRef<{ [id: string]: RTCDataChannel }>({});
  const audioContext = useRef<AudioContext | null>(null);
  const micSourceNode = useRef<MediaStreamAudioSourceNode | null>(null);
  const musicSourceNode = useRef<AudioBufferSourceNode | null>(null);
  const micGainNode = useRef<GainNode | null>(null);
  const mixGainNode = useRef<GainNode | null>(null);
  const musicGainNode = useRef<GainNode | null>(null);
  const destinationNode = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sfuPeerConnection = useRef<RTCPeerConnection | null>(null);


  // Hooks
  const socket = useSocket();

  // Handlers
  const handleMute = useCallback((userId: string) => {
    Object.entries(peerAudioRefs.current).forEach(([key, audio]) => {
      if (key === userId) audio.muted = true;
    });

    setMuteList((prev) => [...prev, userId]);
  }, []);

  const handleUnmute = useCallback((userId: string) => {
    Object.entries(peerAudioRefs.current).forEach(([key, audio]) => {
      if (key === userId) audio.muted = false;
    });

    setMuteList((prev) => prev.filter((id) => id !== userId));
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!localStream.current) {
      console.warn('No local stream');
      return;
    }

    const newIsMute = !localMute.current;

    localStream.current.getAudioTracks().forEach((track) => {
      track.enabled = !newIsMute;
    });

    setIsMute(newIsMute);
    localMute.current = newIsMute;
  }, []);

  const handleEditMute = useCallback((muted?: boolean) => {
    if (!localStream.current) {
      console.warn('No local stream');
      return;
    }

    const newIsMute = muted ?? localMute.current;

    localStream.current.getAudioTracks().forEach((track) => {
      track.enabled = !newIsMute;
    });

    setIsMute(newIsMute);
    localMute.current = newIsMute;
  }, []);

  const handleEditBitrate = useCallback((bitrate?: number) => {
    if (bitrate === localBitrate.current) {
      console.warn(`Bitrate already set to ${bitrate}, skipping...`);
      return;
    }

    const newBitrate = bitrate ?? localBitrate.current;

    Object.values(peerConnections.current).forEach((connection) => {
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
    localBitrate.current = newBitrate;
  }, []);

  const handleEditMicVolume = useCallback((volume?: number) => {
    if (!localStream.current) {
      console.warn('No local stream');
      return;
    }
    if (!audioContext.current) {
      console.warn('No audio context');
      return;
    }
    if (!micGainNode.current) {
      console.warn('No mic gain node');
      return;
    }
    if (!micSourceNode.current) {
      console.warn('No mic source node');
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
    const newVolume = volume ?? localMicVolume.current;

    micGainNode.current.gain.value = newVolume / 100;

    // Process audio tracks
    const processedTrack = destinationNode.current.stream.getAudioTracks()[0];
    Object.values(peerConnections.current).forEach((connection) => {
      const senders = connection.getSenders();
      const audioSender = senders.find((s) => s.track?.kind === 'audio');
      if (audioSender) {
        audioSender.replaceTrack(processedTrack).catch((error) => console.error('Error replacing audio track:', error));
      }
    });

    setMicVolume(newVolume);
    localMicVolume.current = newVolume;
  }, []);

  const handleEditMusicVolume = useCallback((volume?: number) => {
    if (!musicGainNode.current) {
      console.warn('No music gain node');
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

    const newVolume = volume ?? localMusicVolume.current;

    musicGainNode.current.gain.value = newVolume / 100;

    // Process audio tracks
    const processedTrack = destinationNode.current.stream.getAudioTracks()[0];
    Object.values(peerConnections.current).forEach((connection) => {
      const senders = connection.getSenders();
      const audioSender = senders.find((s) => s.track?.kind === 'audio');
      if (audioSender) {
        audioSender.replaceTrack(processedTrack).catch((error) => console.error('Error replacing audio track:', error));
      }
    });

    setMusicVolume(newVolume);
    localMusicVolume.current = newVolume;
  }, []);

  const handleEditSpeakerVolume = useCallback((volume?: number) => {
    const newVolume = volume ?? localSpeakerVolume.current;

    Object.values(peerAudioRefs.current).forEach((audio) => {
      audio.volume = newVolume / 100;
    });

    setSpeakerVolume(newVolume);
    localSpeakerVolume.current = newVolume;
  }, []);

  const handleEditInputStream = useCallback(
    (deviceId: string) => {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
      }
      if (micSourceNode.current) {
        micSourceNode.current.disconnect();
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
          if (!audioContext.current) {
            console.warn('No audio context');
            return;
          }
          if (!micGainNode.current) {
            console.warn('No mic gain node');
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

          localStream.current = stream;

          // Create nodes
          const source = audioContext.current.createMediaStreamSource(stream);

          // Connect nodes
          source.connect(micGainNode.current);

          // Set nodes
          micSourceNode.current = source;

          // Update track
          const newTrack = destinationNode.current.stream.getAudioTracks()[0];
          Object.values(peerConnections.current).forEach((connection) => {
            const senders = connection.getSenders();
            const audioSender = senders.find((s) => s.track?.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(newTrack).catch((error) => console.error('Error replacing audio track:', error));
            }
          });

          handleEditMute();
          handleEditMicVolume();
        })
        .catch((err) => console.error('Error accessing microphone', err));
    },
    [handleEditMute, handleEditMicVolume],
  );

  const handleEditOutputStream = useCallback(
    (deviceId: string) => {
      Object.values(peerAudioRefs.current).forEach((audio) => {
        audio.setSinkId(deviceId).catch((err) => console.error('Error accessing speaker:', err));
      });

      handleEditSpeakerVolume();
    },
    [handleEditSpeakerVolume],
  );

  const handleEditMusicInputStream = useCallback(
    (stream: AudioBuffer) => {
      if (musicSourceNode.current) {
        musicSourceNode.current.disconnect();
      }
      if (!audioContext.current) {
        console.warn('No audio context');
        return;
      }
      if (!musicGainNode.current) {
        console.warn('No music gain node');
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

      // Create nodes
      const source = audioContext.current.createBufferSource();
      source.buffer = stream;

      // Connect nodes
      source.connect(musicGainNode.current);

      // Set nodes
      musicSourceNode.current = source;

      // Update track
      const newTrack = destinationNode.current.stream.getAudioTracks()[0];
      Object.values(peerConnections.current).forEach((connection) => {
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

  const handleRTCJoin = async ({ from: socketId, userId, channelId }: Data) => {
    // if (peerConnections.current[userId]) removePeerConnection(userId);
    // createPeerConnection(userId, socketId);
    // const offer = await peerConnections.current[userId].createOffer();
    // await peerConnections.current[userId].setLocalDescription(offer);
    // handleSendRTCOffer(socketId, offer);
    console.log('handleRTCJoin');
     if (!sfuPeerConnection.current) {
      createSFUPeerConnection(channelId, userId); // la función que crea y asigna sfuPeerConnection.current
    }
  };

  const handleRTCLeave = async ({ userId }: Data) => {
    if (!peerConnections.current[userId]) return;
    removePeerConnection(userId);
  };

  const handleDisconnectServer = async() => {
    console.log('DISCONNECT FROM SERVER SFU');
    cleanupAudioElements();
    sfuService.disconnect();
  };

  const handleRTCOffer = async ({ from: socketId, userId, offer }: Offer) => {
    if (!peerConnections.current[userId]) {
      console.warn(`Connection (${userId}) not found, creating`);
      createPeerConnection(userId, socketId);
    } else if (peerConnections.current[userId].signalingState === 'stable') {
      console.warn(`Connection (${userId}) already in stable state, recreating`);
      removePeerConnection(userId);
      createPeerConnection(userId, socketId);
    }

    const offerDes = new RTCSessionDescription({
      type: offer.type,
      sdp: offer.sdp,
    });

    await peerConnections.current[userId].setRemoteDescription(offerDes);
    const answer = await peerConnections.current[userId].createAnswer();
    await peerConnections.current[userId].setLocalDescription(answer);

    handleSendRTCAnswer(socketId, answer);
  };

  const handleRTCAnswer = async ({ userId, answer }: Answer) => {
    if (!peerConnections.current[userId]) {
      console.warn(`Connection (${userId}) not found`);
      return;
    } else if (peerConnections.current[userId].signalingState === 'stable') {
      console.warn(`Connection (${userId}) already in stable state, ignoring answer`);
      return;
    }

    const answerDes = new RTCSessionDescription({
      type: answer.type,
      sdp: answer.sdp,
    });

    await peerConnections.current[userId].setRemoteDescription(answerDes);
  };

  const handleRTCIceCandidate = async ({ userId, candidate }: IceCandidate) => {
    if (!peerConnections.current[userId]) return;
    const iceCandidate = new RTCIceCandidate({
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid,
      sdpMLineIndex: candidate.sdpMLineIndex,
      usernameFragment: candidate.usernameFragment,
    });
    await peerConnections.current[userId].addIceCandidate(iceCandidate);
  };

  const removePeerConnection = (userId: string) => {
    if (!peerConnections.current[userId]) {
      console.warn(`Connection (${userId}) not found`);
      return;
    }
    if (!peerDataChannels.current[userId]) {
      console.warn(`Data channel (${userId}) not found`);
      return;
    }

    peerConnections.current[userId].close();
    delete peerConnections.current[userId];
    delete peerAudioRefs.current[userId];

    setSpeakStatus((prev) => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
  };

  const createPeerConnection = (userId: string, socketId: string) => {
    if (peerConnections.current[userId]) {
      console.warn(`Connection (${userId}) already exists`);
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
      if (!peerAudioRefs.current[userId]) {
        peerAudioRefs.current[userId] = document.body.appendChild(document.createElement('audio'));
        peerAudioRefs.current[userId].autoplay = true;
        peerAudioRefs.current[userId].oncanplay = () => handleEditSpeakerVolume();
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
    peerDataChannels.current[userId] = peerConnection.createDataChannel('volume');

    setSpeakStatus((prev) => {
      const newState = { ...prev };
      newState[userId] = 0;
      return newState;
    });

    const processedAudioTrack = destinationNode.current.stream.getAudioTracks()[0];
    if (processedAudioTrack) {
      peerConnection.addTrack(processedAudioTrack, destinationNode.current.stream);
    }
  };

  const consumedProducers = new Set<string>();
let pendingProducers: string[] = [];
let recvTransportReady = false;
const audioElements: HTMLAudioElement[] = [];

let newProducerListenerRegistered = false;
let recvTransportCreating = false;

const createSFUPeerConnection = async (channelId: string, userId: string) => {
  console.log('createSFUPeerConnection');
  if (typeof window === 'undefined') return;          // evita SSR
  if (!destinationNode.current) return;

  cleanupAudioElements();

  // 0.  Crea o reutiliza Device
  if (!device) {
    const { Device } = await import('mediasoup-client');
    device = new Device();
  }

  const localStream = destinationNode.current.stream;
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return;

  const clientId = userId;
  const sendId = `${clientId}-${channelId}-send`;
  const recvId = `${clientId}-${channelId}-recv`;

  if (!sfuService.isConnected()) {
    sfuService.connect('ws://localhost:1996');
  }

  /* ---------- SEND TRANSPORT ---------- */
  onceSfu('createTransport', async (msg) => {
    if (msg.sendId !== sendId) return;

    if (!device!.loaded) {
      await device!.load({ routerRtpCapabilities: msg.transportInfo.routerRtpCapabilities });
    }

    sendTransport = device!.createSendTransport(msg.transportInfo);

    // Evita listeners duplicados
    sendTransport.removeAllListeners('connect');
    sendTransport.removeAllListeners('produce');

    sendTransport.on('connect', ({ dtlsParameters }, cb) => {
      onceSfu('connectTransportAck', () => {
        console.log('connectTransportAck 1');
        cb();
      });
      sfuService.send({
        action: 'connectTransport',
        transportId: sendTransport!.id,
        dtlsParameters,
        clientId,
        channelId
      });
    });

    sendTransport.on('produce', ({ kind, rtpParameters }, cb) => {
      const prodId = `${clientId}-${channelId}-producer`;
      onceSfu('produce', (res) => cb({ id: res.producer.id }));
      sfuService.send({
        action: 'produce',
        id: prodId,
        clientId,
        transportId: sendTransport!.id,
        kind,
        rtpParameters,
        channelId
      });
    });

    await sendTransport.produce({ track: audioTrack });
  });

  // Pide creación del sendTransport
  sfuService.send({ action: 'createTransport', id: sendId, clientId, channelId, direction: 'send' });

  /* ---------- NEW PRODUCERS (listener único) ---------- */
  if (!newProducerListenerRegistered) {
    newProducerListenerRegistered = true;

    sfuService.on('newProducer', ({ producerId, kind, channelId }) => {
      if (!channelId || !producerId) return;
      console.log('NEWPRODUCER: ', producerId);

      if (!recvTransport && !recvTransportCreating) {
        recvTransportCreating = true;
        pendingProducers.push(producerId);
        console.log('SIN recvTransport');

        onceSfu('createTransport', async (msg) => {
          recvTransportCreating = false; // reset flag
          if (!device!.loaded) {
            await device!.load({ routerRtpCapabilities: msg.transportInfo.routerRtpCapabilities });
          }

          recvTransport = device!.createRecvTransport(msg.transportInfo);

          // Evita duplicados
          recvTransport.removeAllListeners('connect');

          recvTransport.on('connect', ({ dtlsParameters }, cb) => {
            console.log('OnConnect createtransport newProducer');
            onceSfu('connectTransportAck', () => {
              console.log('connectTransportAck en newProducer');
              recvTransportReady = true;
              cb();
            });
            sfuService.send({
              action: 'connectTransport',
              transportId: recvTransport!.id,
              dtlsParameters,
              clientId,
              channelId
            });
          });

          flushPendingProducers();
        });

        console.log('createTransport SEND recv');
        sfuService.send({ action: 'createTransport', id: recvId, clientId, channelId, direction: 'recv' });
      } else if (recvTransportReady) {
        console.log('Con recvTransportReady');
        consumeProducer(producerId);
      } else {
        console.log('recvTransportReady: ', recvTransportReady);
        if (recvTransportReady) {
          flushPendingProducers();
        } else {
          consumeProducer(producerId);
        }
      }
    });
  }

  function flushPendingProducers() {
    console.log('flushPendingProducers');
    while (pendingProducers.length > 0) {
      const pId = pendingProducers.shift();
      consumeProducer(pId!);
    }
  }

  /* ---------- helper ---------- */
  function consumeProducer(producerId: string) {
    if (consumedProducers.has(producerId)) return;
    if (!recvTransport) return;

    onceSfu('consume', async (msg) => {
      const { consumer } = msg;
      const track = await recvTransport!.consume({
        id: consumer.id,
        producerId: consumer.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
      });

      if (!track || !track.track) {
        console.warn('No se recibió track válido del consumer:', consumer);
        return;
      }

      try {
        await track.resume();
      } catch (err) {
        console.error('Error al hacer resume:', err);
      }

      const stream = new MediaStream([track.track]);

      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.srcObject = stream;
      audioEl.controls = true;
      audioEl.muted = true;
      document.body.appendChild(audioEl);
      audioElements.push(audioEl);

      audioEl.play().then(() => {
        audioEl.muted = false;
      }).catch(err => {
        console.warn('Autoplay bloqueado:', err);
      });

      consumedProducers.add(producerId);
      console.log('PLAY STREAM');
    });

    console.log('CONSUME SEND');
    console.log(recvTransport.id);

    sfuService.send({
      action: 'consume',
      id: `cons-${producerId}`,
      clientId: clientId,
      transportId: recvTransport.id,
      producerId: producerId,
      rtpCapabilities: device!.rtpCapabilities,
      channelId: channelId
    });
  }
};

 function cleanupAudioElements() {
    audioElements.forEach((el) => {
      el.pause();
      el.srcObject = null;
      el.remove();
    });
    audioElements.length = 0;    
    consumedProducers.clear();
  }

  useEffect(() => {
    const localMicVolume = window.localStorage.getItem('mic-volume');
    const localSpeakerVolume = window.localStorage.getItem('speaker-volume');
    const localMute = window.localStorage.getItem('is-mute');

    setMicVolume(localMicVolume !== null ? parseInt(localMicVolume) : 100);
    setSpeakerVolume(localSpeakerVolume !== null ? parseInt(localSpeakerVolume) : 100);
    setIsMute(localMute !== null ? localMute === 'true' : false);
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
    audioContext.current = audioCtx;
    micGainNode.current = micGain;
    mixGainNode.current = mixGain;
    destinationNode.current = destination;

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

    return () => {
      if (audioContext.current) audioContext.current.close();
      if (localStream.current) localStream.current.getTracks().forEach((track) => track.stop());
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
    window.localStorage.setItem('is-mute', isMute.toString());
  }, [isMute]);

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
      [SocketServerEvent.RTC_SHUTDOWN]: handleDisconnectServer,
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
        handleMute,
        handleUnmute,
        handleToggleMute,
        handleEditBitrate,
        handleEditMicVolume,
        handleEditMusicVolume,
        handleEditSpeakerVolume,
        handleEditInputStream,
        handleEditOutputStream,
        handleEditMusicInputStream,
        muteList,
        isMute,
        bitrate,
        micVolume,
        speakerVolume,
        musicVolume,
        volumePercent,
        speakStatus,
        connectionStatus,
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
