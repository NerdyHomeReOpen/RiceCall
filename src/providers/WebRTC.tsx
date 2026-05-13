import React, { useCallback, useContext, createContext, useMemo, useEffect } from 'react';

import * as ipc from '@/main/ipc';
import * as Store from '@/store';
import Logger from '@/utils/logger';

import { useSoundPlayer } from '@/providers/SoundPlayer';
import { useLoading } from '@/providers/Loading';

import { useSharedRefs } from '@/hooks/WebRTC/useSharedRefs';
import { useAudioContext } from '@/hooks/WebRTC/useAudioContext';
import { useMicAudio } from '@/hooks/WebRTC/useMicAudio';
import { useSpeakerAudio } from '@/hooks/WebRTC/useSpeakerAudio';
import { useMixAudio } from '@/hooks/WebRTC/useMixAudio';
import { useRecording } from '@/hooks/WebRTC/useRecording';
import { useSFUTransport } from '@/hooks/WebRTC/useSFUTransport';

interface WebRTCContextType {
  startSpeaking: () => void;
  stopSpeaking: () => void;
  startMixing: () => void;
  stopMixing: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  muteUser: (userId: string) => void;
  unmuteUser: (userId: string) => void;
  pressSpeakKey: () => void;
  releaseSpeakKey: () => void;
  takeMic: (channelId: string) => void;
  releaseMic: () => void;
  toggleMixMode: () => void;
  toggleRecording: () => void;
  toggleSpeakerMuted: () => void;
  toggleMicMuted: () => void;
  changeBitrate: (bitrate: number) => void;
  changeMicVolume: (volume: number) => void;
  changeMixVolume: (volume: number) => void;
  changeSpeakerVolume: (volume: number) => void;
  addSpeakerVolume: (value?: number) => void;
  subtractSpeakerVolume: (value?: number) => void;
  changeVoiceThreshold: (voiceThreshold: number) => void;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export const useWebRTC = (): WebRTCContextType => {
  const context = useContext(WebRTCContext);
  if (!context) throw new Error('useWebRTC must be used within a WebRTCProvider');
  return context;
};

interface WebRTCProviderProps {
  children: React.ReactNode;
}

const WebRTCProvider = ({ children }: WebRTCProviderProps) => {
  const { playSound } = useSoundPlayer();
  const { loadServer } = useLoading();

  const refs = useSharedRefs();
  const { initAudioContext } = useAudioContext(refs);
  const { startSpeaking, stopSpeaking, pressSpeakKey, releaseSpeakKey, changeMicVolume, toggleMicMuted } =
    useMicAudio(refs, { initAudioContext, playSound });
  const { initSpeakerAudio, removeSpeakerAudio, changeSpeakerVolume, addSpeakerVolume, subtractSpeakerVolume, toggleSpeakerMuted } =
    useSpeakerAudio(refs, { initAudioContext });
  const { startMixing, stopMixing, toggleMixMode, changeMixVolume } = useMixAudio(refs, { initAudioContext });
  const { startRecording, stopRecording, toggleRecording } = useRecording(refs, { initAudioContext });
  const { takeMic, releaseMic, muteUser, unmuteUser, changeBitrate } = useSFUTransport(refs, {
    initSpeakerAudio,
    removeSpeakerAudio,
    startSpeaking,
    stopSpeaking,
  });

  const initLocalStorage = useCallback(() => {
    const localMicVolume = window.localStorage.getItem('mic-volume') ?? '100';
    const localSpeakerVolume = window.localStorage.getItem('speaker-volume') ?? '100';
    const localIsMicMuted = window.localStorage.getItem('is-mic-mute') ?? 'false';
    const localIsSpeakerMuted = window.localStorage.getItem('is-speaker-mute') ?? 'false';
    const localMutedById = window.localStorage.getItem('muted-by-id') ?? '{}';
    const localVoiceThreshold = window.localStorage.getItem('voice-threshold') ?? '1';

    Store.store.dispatch(
      Store.setWebRTC({
        micVolume: parseInt(localMicVolume),
        speakerVolume: parseInt(localSpeakerVolume),
        isMicMuted: localIsMicMuted === 'true',
        isSpeakerMuted: localIsSpeakerMuted === 'true',
        mutedById: JSON.parse(localMutedById),
        voiceThreshold: parseInt(localVoiceThreshold),
      }),
    );
  }, []);

  const changeVoiceThreshold = useCallback((voiceThreshold: number) => {
    Store.store.dispatch(Store.setWebRTC({ voiceThreshold }));
    window.localStorage.setItem('voice-threshold', voiceThreshold.toString());
  }, []);

  useEffect(() => {
    initLocalStorage();
    initAudioContext();
  }, [initLocalStorage, initAudioContext]);

  useEffect(() => {
    const unsub = ipc.sfuDiagnosis.onRequest(async () => {
      let info: { transportId?: string; ip?: string; port?: string } | null = null;

      try {
        if (!refs.recvTransportRef.current) {
          new Logger('WebRTC').info('Not in a channel, attempting to join one for diagnosis using standard logic...');

          let targetServer = null;

          const searchResults = await ipc.api.searchServer({ query: '10' });
          targetServer = searchResults.find((s) => s.displayId === '10' || s.serverId === '10');

          if (!targetServer) {
            const userId = window.localStorage.getItem('userId');
            if (userId) {
              const servers = await ipc.api.fetchServers({ userId });
              if (servers && servers.length > 0) {
                targetServer = servers[0];
              }
            }
          }

          if (targetServer) {
            new Logger('WebRTC').info(`Standard joining server: ${targetServer.name} (${targetServer.displayId})`);

            loadServer(targetServer.specialId || targetServer.displayId);
            ipc.socket.send('connectServer', { serverId: targetServer.serverId });

            await new Promise<void>((resolve, reject) => {
              let unsub: () => void = () => {};
              const timeout = setTimeout(() => {
                if (unsub) unsub();
                reject(new Error('Timeout waiting for SFUJoined after standard join'));
              }, 10000);
              unsub = ipc.socket.on('SFUJoined', () => {
                clearTimeout(timeout);
                if (unsub) unsub();
                resolve();
              });
            }).catch((e) => new Logger('WebRTC').error(e.message));

            for (let i = 0; i < 5; i++) {
              if (refs.recvTransportRef.current) break;
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        } else {
          new Logger('WebRTC').info('Already in an SFU session, reusing existing transport for diagnosis.');
        }

        if (refs.recvTransportRef.current) {
          for (let retry = 0; retry < 10; retry++) {
            const stats = await refs.recvTransportRef.current.getStats();
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                info = {
                  transportId: refs.recvTransportRef.current?.id,
                  ip: report.remoteCandidateId ? stats.get(report.remoteCandidateId)?.ip : 'unknown',
                  port: report.remoteCandidateId ? stats.get(report.remoteCandidateId)?.port : 'unknown',
                };
                if (!info.ip || info.ip === 'unknown') {
                  const remoteCandidate = stats.get(report.remoteCandidateId);
                  if (remoteCandidate) {
                    info.ip = remoteCandidate.ip || remoteCandidate.address;
                    info.port = remoteCandidate.port;
                  }
                }
              }
            });

            // if (info && info.ip && info.ip !== 'unknown') break;
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      } catch (e) {
        new Logger('WebRTC').error(`Error getting stats or joining channel: ${e}`);
      }

      ipc.sfuDiagnosis.response(info);
    });
    return () => unsub();
  }, [loadServer, refs.recvTransportRef]);

  const contextValue = useMemo(
    () => ({
      startSpeaking,
      stopSpeaking,
      startMixing,
      stopMixing,
      startRecording,
      stopRecording,
      muteUser,
      unmuteUser,
      pressSpeakKey,
      releaseSpeakKey,
      takeMic,
      releaseMic,
      toggleMixMode,
      toggleRecording,
      toggleSpeakerMuted,
      toggleMicMuted,
      changeBitrate,
      changeMicVolume,
      changeMixVolume,
      changeSpeakerVolume,
      addSpeakerVolume,
      subtractSpeakerVolume,
      changeVoiceThreshold,
    }),
    [
      startSpeaking,
      stopSpeaking,
      startMixing,
      stopMixing,
      startRecording,
      stopRecording,
      muteUser,
      unmuteUser,
      pressSpeakKey,
      releaseSpeakKey,
      takeMic,
      releaseMic,
      toggleMixMode,
      toggleRecording,
      toggleSpeakerMuted,
      toggleMicMuted,
      changeBitrate,
      changeMicVolume,
      changeMixVolume,
      changeSpeakerVolume,
      addSpeakerVolume,
      subtractSpeakerVolume,
      changeVoiceThreshold,
    ],
  );

  return <WebRTCContext.Provider value={contextValue}>{children}</WebRTCContext.Provider>;
};

WebRTCProvider.displayName = 'WebRTCProvider';

export default WebRTCProvider;
