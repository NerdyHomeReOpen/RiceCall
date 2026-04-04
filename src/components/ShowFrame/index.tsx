import React, { useEffect, useRef, useCallback } from 'react';
import { shallowEqual } from 'react-redux';

import type * as Types from '@/types';

import { SHOW_FRAME_ORIGIN } from '@/constants';

import { useAppSelector } from '@/hooks/Store';

import styles from '@/styles/Server.module.css';

const ShowFrame: React.FC = React.memo(() => {
  const showFrameRef = useRef<HTMLIFrameElement>(null);
  const prevStateRef = useRef<{ userId: string; anchorId: string | null; channelMode: Types.Channel['voiceMode'] }>({ userId: '', anchorId: null, channelMode: 'free' });

  const user = useAppSelector(
    (state) => ({
      userId: state.user.data.userId,
      permissionLevel: state.user.data.permissionLevel,
    }),
    shallowEqual,
  );

  const currentChannel = useAppSelector(
    (state) => ({
      channelId: state.currentChannel.data.channelId,
      permissionLevel: state.currentChannel.data.permissionLevel,
      voiceMode: state.currentChannel.data.voiceMode,
    }),
    shallowEqual,
  );

  const queueUsers = useAppSelector((state) => state.queueUsers.data, shallowEqual);

  const updateShowFrameState = useCallback(
    (userId: string, anchorId: string | null, channelMode: Types.Channel['voiceMode']) => {
      if (!showFrameRef.current?.contentWindow) return;
      prevStateRef.current = { userId, anchorId, channelMode };
      showFrameRef.current.contentWindow.postMessage({ uid: userId, aid: anchorId, channelMode: channelMode }, SHOW_FRAME_ORIGIN);
    },
    [showFrameRef],
  );

  const handleShowFrameLoad = () => {
    const anchorId = queueUsers.find((u) => u.position === 0)?.userId || null;
    updateShowFrameState(user.userId, anchorId, currentChannel.voiceMode);
  };

  useEffect(() => {
    const anchorId = queueUsers.find((u) => u.position === 0)?.userId || null;
    if (prevStateRef.current.userId === user.userId && prevStateRef.current.anchorId === anchorId && prevStateRef.current.channelMode === currentChannel.voiceMode) return;
    updateShowFrameState(user.userId, anchorId, currentChannel.voiceMode);
  }, [user.userId, queueUsers, currentChannel.voiceMode, updateShowFrameState]);

  return <iframe ref={showFrameRef} className={styles['rcshow-area']} id="showFrame" src={SHOW_FRAME_ORIGIN} height="100%" width="100%" onLoad={handleShowFrameLoad} />;
});

ShowFrame.displayName = 'ShowFrame';

export default ShowFrame;
