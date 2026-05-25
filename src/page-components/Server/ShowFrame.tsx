import React, { useEffect, useRef, useCallback } from 'react';
import { shallowEqual } from 'react-redux';

import * as Types from '@/types';

import { SHOW_FRAME_ORIGIN } from '@/constants';

import { useAppSelector } from '@/hooks/useStore';

const ShowFrame: React.FC = React.memo(() => {
  const showFrameRef = useRef<HTMLIFrameElement>(null);
  const prevStateRef = useRef<{ userId: string; anchorId: string | null; channelMode: Types.Channel['voiceMode'] }>({ userId: '', anchorId: null, channelMode: 'free' });

  const userId = useAppSelector((state) => state.user.data.userId);
  const currentChannelVoiceMode = useAppSelector((state) => state.currentChannel.data.voiceMode);

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
    updateShowFrameState(userId, anchorId, currentChannelVoiceMode);
  };

  useEffect(() => {
    const anchorId = queueUsers.find((u) => u.position === 0)?.userId || null;
    if (prevStateRef.current.userId === userId && prevStateRef.current.anchorId === anchorId && prevStateRef.current.channelMode === currentChannelVoiceMode) return;
    updateShowFrameState(userId, anchorId, currentChannelVoiceMode);
  }, [userId, queueUsers, currentChannelVoiceMode, updateShowFrameState]);

  return <iframe ref={showFrameRef} id="showFrame" src={SHOW_FRAME_ORIGIN} height="100%" width="100%" onLoad={handleShowFrameLoad} />;
});

ShowFrame.displayName = 'ShowFrame';

export default ShowFrame;
