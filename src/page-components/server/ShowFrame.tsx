import React, { useCallback, useEffect, useRef } from 'react';
import { shallowEqual } from 'react-redux';

import * as ipc from '@/main/ipc';
import { SHOW_FRAME_ORIGIN } from '@/constants';
import { useAppSelector } from '@/hooks/useStore';

type ShowMessage = { type: 'ricecall-show:gift'; channelId: string; action: 'heart' | 'flower'; requestId: string };

const ShowFrame: React.FC = React.memo(() => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const channelId = useAppSelector((state) => state.currentChannel.data.channelId, shallowEqual);
  const channelIdRef = useRef(channelId);
  channelIdRef.current = channelId;

  const postToShow = useCallback((message: unknown) => {
    frameRef.current?.contentWindow?.postMessage(message, SHOW_FRAME_ORIGIN);
  }, []);

  const sendViewer = useCallback(async () => {
    const activeChannelId = channelIdRef.current;
    if (!activeChannelId) return;
    try {
      const { viewer } = await ipc.socket.emit('showViewer', { channelId: activeChannelId });
      if (activeChannelId === channelIdRef.current) postToShow({ type: 'ricecall-show:viewer', channelId: activeChannelId, viewer });
    } catch {
      // Show can keep displaying the public channel stream while the socket reconnects.
    }
  }, [postToShow]);

  useEffect(() => {
    void sendViewer();
    const timer = setInterval(() => void sendViewer(), 15_000);
    return () => clearInterval(timer);
  }, [channelId, sendViewer]);

  useEffect(() => {
    const offConnect = ipc.socket.on('connect', () => void sendViewer());
    const offDisconnect = ipc.socket.on('disconnect', () => postToShow({ type: 'ricecall-show:viewer', channelId: channelIdRef.current, viewer: null }));
    return () => {
      offConnect();
      offDisconnect();
    };
  }, [postToShow, sendViewer]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== SHOW_FRAME_ORIGIN || event.source !== frameRef.current?.contentWindow) return;
      const message = event.data as Partial<ShowMessage>;
      if (!message || typeof message !== 'object') return;
      if (message.type !== 'ricecall-show:gift' || (message.action !== 'heart' && message.action !== 'flower') || typeof message.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(message.requestId))
        return;
      const activeChannelId = channelIdRef.current;
      if (!activeChannelId || message.channelId !== activeChannelId) return;
      const action = message.action;
      const requestId = message.requestId;
      void ipc.socket.emit('showGift', { channelId: activeChannelId, action, requestId }).then(
        ({ viewer }) => {
          if (activeChannelId !== channelIdRef.current) return;
          postToShow({ type: 'ricecall-show:viewer', channelId: activeChannelId, viewer });
          postToShow({ type: 'ricecall-show:gift-result', channelId: activeChannelId, requestId, ok: true });
        },
        (error: unknown) => {
          if (activeChannelId !== channelIdRef.current) return;
          postToShow({ type: 'ricecall-show:gift-result', channelId: activeChannelId, requestId, ok: false, error: error instanceof Error ? error.message : 'SHOW_GIFT_FAILED' });
          void sendViewer();
        },
      );
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [postToShow, sendViewer]);

  const src = new URL(SHOW_FRAME_ORIGIN);
  if (channelId) src.searchParams.set('channelId', channelId);
  return <iframe key={channelId} ref={frameRef} id="showFrame" src={src.toString()} height="100%" width="100%" onLoad={() => void sendViewer()} />;
});

ShowFrame.displayName = 'ShowFrame';

export default ShowFrame;
