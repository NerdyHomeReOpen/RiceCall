import { useCallback, useEffect, useRef } from 'react';
import type { SharedRefs } from './useSharedRefs';
import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import Logger from '@/utils/logger';

interface UseSFUTransportDeps {
  initSpeakerAudio: (userId: string, stream: MediaStream) => Promise<void>;
  removeSpeakerAudio: (userId: string) => void;
  startSpeaking: () => void;
  stopSpeaking: () => void;
}

export const useSFUTransport = (
  refs: SharedRefs,
  { initSpeakerAudio, removeSpeakerAudio, startSpeaking, stopSpeaking }: UseSFUTransportDeps,
) => {
  const { audioProducerRef, inputDesRef, bitrateRef, deviceRef, sendTransportRef, recvTransportRef, consumersRef } = refs;

  const currentChannelIdRef = useRef<string | null>(null);
  const sendRetryCountRef = useRef<number>(0);
  const recvRetryCountRef = useRef<number>(0);

  const consumeOne = useCallback(
    async (producerId: string, channelId: string) => {
      const consumerInfo = await ipc.socket
        .emit('SFUCreateConsumer', {
          transportId: recvTransportRef.current!.id,
          producerId,
          rtpCapabilities: deviceRef.current.rtpCapabilities,
          channelId,
        })
        .catch((e) => {
          new Logger('WebRTC').error(`Error creating consumer: ${e}`);
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

      const userId = consumer.appData.userId;
      if (!userId || typeof userId !== 'string') return;

      const stream = new MediaStream([consumer.track]);
      initSpeakerAudio(userId, stream);

      new Logger('WebRTC').info(`Consumed producer: ${userId}`);
    },
    [initSpeakerAudio, recvTransportRef, deviceRef, consumersRef],
  );

  const unconsumeOne = useCallback(
    async (producerId: string) => {
      const consumer = consumersRef.current[producerId];
      if (!consumer) return;

      const userId = consumer.appData.userId;
      if (!userId || typeof userId !== 'string') return;

      consumer.close();
      delete consumersRef.current[producerId];
      removeSpeakerAudio(userId);

      new Logger('WebRTC').info(`Unconsumed producer: ${userId}`);
    },
    [removeSpeakerAudio, consumersRef],
  );

  const setupSend = useCallback(
    async (channelId: string) => {
      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }

      const transport = await ipc.socket
        .emit('SFUCreateTransport', { direction: 'send', channelId })
        .catch((e) => {
          new Logger('WebRTC').error(`Error creating send transport: ${e}`);
          return null;
        });
      if (!transport) return;

      if (!deviceRef.current.loaded)
        await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

      sendTransportRef.current = deviceRef.current.createSendTransport(transport);

      sendTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
        ipc.socket
          .emit('SFUConnectTransport', { transportId: sendTransportRef.current!.id, dtlsParameters })
          .then(() => {
            new Logger('WebRTC').info('SendTransport connected to SFU');
            cb();
          })
          .catch(eb);
      });

      sendTransportRef.current.on('produce', ({ kind, rtpParameters }, cb, eb) => {
        ipc.socket
          .emit('SFUCreateProducer', { transportId: sendTransportRef.current!.id, kind, rtpParameters, channelId })
          .then(({ id }) => {
            new Logger('WebRTC').info('SendTransport produced to SFU');
            cb({ id });
          })
          .catch(eb);
      });

      sendTransportRef.current.on('connectionstatechange', async (s) => {
        new Logger('WebRTC').info(`SendTransport connection state = ${s}`);

        if (s === 'connected') {
          sendRetryCountRef.current = 0;
        }

        if (s === 'failed' || s === 'disconnected') {
          let info;
          const stats = await sendTransportRef.current?.getStats();
          stats?.forEach((report) => {
            if (report.type === 'candidate-pair') {
              info = {
                state: report.state,
                currentRoundTripTime: report.currentRoundTripTime,
                requestsSent: report.requestsSent,
                responsesReceived: report.responsesReceived,
                localCandidateId: report.localCandidateId,
                remoteCandidateId: report.remoteCandidateId,
              };
            }
          });

          ipc.webrtc.signalStateChange({
            signalState: s,
            userId: localStorage.getItem('userId') || 'unknown-user',
            channelId,
            info,
          });

          new Logger('WebRTC').error(`SendTransport connection stats: ${JSON.stringify(info)}`);

          const retryChannelId = currentChannelIdRef.current;
          if (retryChannelId && sendRetryCountRef.current < 3) {
            sendRetryCountRef.current++;
            const delay = 2000 * sendRetryCountRef.current;
            new Logger('WebRTC').info(`Retrying send transport in ${delay}ms (attempt ${sendRetryCountRef.current})`);
            setTimeout(() => setupSend(retryChannelId), delay);
          }
        }
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
        new Logger('WebRTC').info('Producer transport closed');
        audioProducerRef.current?.close();
      });
      audioProducerRef.current.on('trackended', () => {
        new Logger('WebRTC').info('Producer track ended');
        audioProducerRef.current?.close();
      });
    },
    [audioProducerRef, inputDesRef, bitrateRef, deviceRef, sendTransportRef],
  );

  const setupRecv = useCallback(
    async (channelId: string) => {
      if (recvTransportRef.current) {
        recvTransportRef.current.close();
        recvTransportRef.current = null;
      }

      const transport = await ipc.socket
        .emit('SFUCreateTransport', { direction: 'recv', channelId })
        .catch((e) => {
          new Logger('WebRTC').error(`Error creating recv transport: ${e}`);
          return null;
        });
      if (!transport) return;

      if (!deviceRef.current.loaded)
        await deviceRef.current.load({ routerRtpCapabilities: transport.routerRtpCapabilities });

      recvTransportRef.current = deviceRef.current.createRecvTransport(transport);

      recvTransportRef.current.on('connect', ({ dtlsParameters }, cb, eb) => {
        ipc.socket
          .emit('SFUConnectTransport', { transportId: recvTransportRef.current!.id, dtlsParameters })
          .then(() => {
            new Logger('WebRTC').info('RecvTransport connected to SFU');
            cb();
          })
          .catch(eb);
      });

      recvTransportRef.current.on('connectionstatechange', (s) => {
        new Logger('WebRTC').info(`RecvTransport connection state = ${s}`);

        if (s === 'connected') {
          recvRetryCountRef.current = 0;
        }

        if (s === 'failed' || s === 'disconnected') {
          const retryChannelId = currentChannelIdRef.current;
          if (retryChannelId && recvRetryCountRef.current < 3) {
            recvRetryCountRef.current++;
            const delay = 2000 * recvRetryCountRef.current;
            new Logger('WebRTC').info(`Retrying recv transport in ${delay}ms (attempt ${recvRetryCountRef.current})`);
            setTimeout(() => setupRecv(retryChannelId), delay);
          }
        }
      });

      for (const producer of transport.producers ?? []) {
        consumeOne(producer.id, channelId).catch((e) => {
          new Logger('WebRTC').error(`Error consuming producer: ${e}`);
        });
      }
    },
    [consumeOne, deviceRef, recvTransportRef],
  );

  const closeSend = useCallback(
    async () => {
      currentChannelIdRef.current = null;
      if (sendTransportRef.current) {
        sendTransportRef.current.close();
        sendTransportRef.current = null;
      }
    },
    [sendTransportRef],
  );

  const closeRecv = useCallback(() => {
    currentChannelIdRef.current = null;
    if (recvTransportRef.current) {
      recvTransportRef.current.close();
      recvTransportRef.current = null;
    }
  }, [recvTransportRef]);

  const takeMic = useCallback(
    async (channelId: string) => {
      if (Store.store.getState().webrtc.isMicTaken) return;
      currentChannelIdRef.current = channelId;
      await setupSend(channelId);
      startSpeaking();
    },
    [setupSend, startSpeaking],
  );

  const releaseMic = useCallback(() => {
    if (!Store.store.getState().webrtc.isMicTaken) return;
    currentChannelIdRef.current = null;
    closeSend();
    stopSpeaking();
  }, [closeSend, stopSpeaking]);

  const muteUser = useCallback(
    (userId: string) => {
      Object.values(consumersRef.current).forEach((consumer) => {
        if (consumer.appData.userId === userId) consumer.pause();
      });
      Store.store.dispatch(Store.setMutedId({ id: userId, value: true }));
      window.localStorage.setItem('muted-by-id', JSON.stringify(Store.store.getState().webrtc.mutedById));
    },
    [consumersRef],
  );

  const unmuteUser = useCallback(
    (userId: string) => {
      Object.values(consumersRef.current).forEach((consumer) => {
        if (consumer.appData.userId === userId) consumer.resume();
      });
      Store.store.dispatch(Store.setMutedId({ id: userId, value: false }));
      window.localStorage.setItem('muted-by-id', JSON.stringify(Store.store.getState().webrtc.mutedById));
    },
    [consumersRef],
  );

  const changeBitrate = useCallback(
    (bitrate: number) => {
      audioProducerRef.current?.setRtpEncodingParameters({ maxBitrate: bitrate });
      bitrateRef.current = bitrate;
    },
    [audioProducerRef, bitrateRef],
  );

  useEffect(() => {
    const unsub = ipc.socket.on('SFUJoined', ({ channelId }: { channelId: string }) => {
      currentChannelIdRef.current = channelId;
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
    const unsub = ipc.socket.on(
      'SFUNewProducer',
      ({ userId, producerId, channelId }: { userId: string; producerId: string; channelId: string }) => {
        new Logger('WebRTC').info(`New producer: ${userId}`);
        consumeOne(producerId, channelId).catch((e) => {
          new Logger('WebRTC').error(`Error consuming producer: ${e}`);
        });
      },
    );
    return () => unsub();
  }, [consumeOne]);

  useEffect(() => {
    const unsub = ipc.socket.on(
      'SFUProducerClosed',
      ({ userId, producerId }: { userId: string; producerId: string }) => {
        new Logger('WebRTC').info(`Producer closed: ${userId}`);
        unconsumeOne(producerId).catch((e) => {
          new Logger('WebRTC').error(`Error unconsuming producer: ${e}`);
        });
      },
    );
    return () => unsub();
  }, [unconsumeOne]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const sendTransport = sendTransportRef.current;
      const recvTransport = recvTransportRef.current;
      const transport = sendTransport || recvTransport;

      if (transport) {
        const s = transport.connectionState;
        if (s === 'connected') Store.store.dispatch(Store.setWebRTC({ status: 'connected' }));
        else if (s === 'failed') Store.store.dispatch(Store.setWebRTC({ status: 'failed' }));
        else if (s === 'new' || s === 'connecting') Store.store.dispatch(Store.setWebRTC({ status: 'connecting' }));
        else Store.store.dispatch(Store.setWebRTC({ status: 'disconnected' }));

        const activeTransport =
          sendTransport && sendTransport.connectionState === 'connected'
            ? sendTransport
            : recvTransport && recvTransport.connectionState === 'connected'
            ? recvTransport
            : null;

        if (activeTransport) {
          const stats = await activeTransport.getStats();
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime) {
                Store.store.dispatch(Store.setWebRTC({ latency: Math.round(report.currentRoundTripTime * 1000) }));
              }
            }
          });
        } else {
          Store.store.dispatch(Store.setWebRTC({ latency: 0 }));
        }
      } else {
        Store.store.dispatch(Store.setWebRTC({ status: 'disconnected', latency: 0 }));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sendTransportRef, recvTransportRef]);

  return {
    setupSend,
    setupRecv,
    closeSend,
    closeRecv,
    consumeOne,
    unconsumeOne,
    takeMic,
    releaseMic,
    muteUser,
    unmuteUser,
    changeBitrate,
  };
};
