import React, { useRef, useContext, createContext, ReactNode, useCallback } from 'react';

import type { QueueUser, Channel } from '@/types';

const SHOW_FRAME_ORIGIN = 'https://show.ricecall.com/';

type PostMessagePayload = {
    uid: string;
    aid: string;
    micOff: boolean;
    gid: string;
    cid: string;
    action?: 'take' | 'release' | 'checkSelf';
};

type UpdateShowFrameStateParams = {
    userId: string;
    currentServerUuid: string;
    currentChannelId: string;
    currentChannelVoiceMode: Channel['voiceMode'];
    isCurrentChannelQueueMode: boolean;
    queueUsers: QueueUser[];
    isQueuing: boolean;
    isMicTaken: boolean;
    aid: string;
};

interface ShowFrameContextType {
    showFrameRef: React.RefObject<HTMLIFrameElement | null>;
    handleShowFrameLoad: () => void;
    updateShowFrameState: (params: UpdateShowFrameStateParams) => void;
}

const ShowFrameContext = createContext<ShowFrameContextType | null>(null);

export const useShowFrame = (): ShowFrameContextType => {
    const context = useContext(ShowFrameContext);
    if (!context) throw new Error('useShowFrame must be used within a ShowFrameProvider');
    return context;
};

interface ShowFrameProviderProps {
    children: ReactNode;
}

const ShowFrameProvider = ({ children }: ShowFrameProviderProps) => {
    // Refs
    const showFrameRef = useRef<HTMLIFrameElement>(null);
    const prevChannelQueueModeRef = useRef<boolean>(false);
    const prevIsMicTakenRef = useRef<boolean>(false);
    const prevIsQueuingRef = useRef<boolean>(false);
    const prevChannelIdRef = useRef<string>('');
    const prevVoiceModeRef = useRef<string>('');
    const prevUserPositionRef = useRef<number | undefined>(undefined);
    const prevServerUuidRef = useRef<string>('');
    const lastChannelSwitchTimeRef = useRef<number>(0);
    const prevQueueUsersRef = useRef<QueueUser[]>([]);
    const prevFirstQueueUserIdRef = useRef<string>('');
    const lastStateRef = useRef<{
        userId: string;
        currentServerUuid: string;
        currentChannelId: string;
        currentChannelVoiceMode: Channel['voiceMode'];
        isCurrentChannelQueueMode: boolean;
        queueUsers: QueueUser[];
        isQueuing: boolean;
        isMicTaken: boolean;
        aid: string;
    } | null>(null);

    const handleShowFrameLoad = useCallback(() => {
        if (!showFrameRef.current?.contentWindow || !lastStateRef.current) return;
        const state = lastStateRef.current;
        showFrameRef.current.contentWindow.postMessage(
            {
                uid: state.userId,
                aid: state.aid,
                micOff: !state.isCurrentChannelQueueMode,
                gid: state.currentServerUuid,
                cid: state.currentChannelId,
            },
            SHOW_FRAME_ORIGIN
        );
        if (state.currentChannelId && state.isCurrentChannelQueueMode) {
            const firstQueueUser = state.queueUsers.find(u => u.position === 0);
            const firstQueueUserId = firstQueueUser?.userId || '';
            showFrameRef.current.contentWindow.postMessage(
                {
                    uid: state.userId,
                    aid: firstQueueUserId,
                    gid: state.currentServerUuid,
                    cid: state.currentChannelId,
                    action: 'checkSelf',
                    micOff: false,
                },
                SHOW_FRAME_ORIGIN
            );
        }
    }, []);

    const updateShowFrameState = useCallback(
        (params: UpdateShowFrameStateParams) => {
            if (!showFrameRef.current?.contentWindow) return;

            const sendMessage = (payload: PostMessagePayload) => {
                showFrameRef.current?.contentWindow?.postMessage(payload, SHOW_FRAME_ORIGIN);
            };

            const updateRefs = (
                currentChannelId: string,
                currentChannelVoiceMode: Channel['voiceMode'],
                isCurrentChannelQueueMode: boolean,
                isMicTaken: boolean,
                isQueuing: boolean,
                currentServerUuid: string,
                userPosition?: number,
                queueUsers?: QueueUser[]
            ) => {
                if (currentChannelId) {
                    prevChannelQueueModeRef.current = isCurrentChannelQueueMode;
                }
                prevIsMicTakenRef.current = isMicTaken;
                prevIsQueuingRef.current = isQueuing;
                prevChannelIdRef.current = currentChannelId;
                prevVoiceModeRef.current = currentChannelVoiceMode;
                prevUserPositionRef.current = userPosition;
                prevServerUuidRef.current = currentServerUuid;
                if (queueUsers !== undefined) {
                    prevQueueUsersRef.current = [...queueUsers];
                    const firstQueueUser = queueUsers.find(u => u.position === 0);
                    prevFirstQueueUserIdRef.current = firstQueueUser?.userId || '';
                }
            };

            const resetRefs = (currentServerUuid: string) => {
                prevChannelQueueModeRef.current = false;
                prevIsMicTakenRef.current = false;
                prevIsQueuingRef.current = false;
                prevChannelIdRef.current = '';
                prevVoiceModeRef.current = '';
                prevUserPositionRef.current = undefined;
                prevServerUuidRef.current = currentServerUuid;
                prevQueueUsersRef.current = [];
                prevFirstQueueUserIdRef.current = '';
            };

            const createReleasePayload = (
                userId: string,
                gid: string,
                cid: string,
                micOff: boolean
            ): PostMessagePayload & { action: 'release' } => ({
                uid: userId,
                aid: '',
                micOff,
                gid,
                cid,
                action: 'release',
            });

            const {
                userId,
                currentServerUuid,
                currentChannelId,
                currentChannelVoiceMode,
                isCurrentChannelQueueMode,
                queueUsers,
                isQueuing,
                isMicTaken,
                aid,
            } = params;

            lastStateRef.current = {
                userId,
                currentServerUuid,
                currentChannelId,
                currentChannelVoiceMode,
                isCurrentChannelQueueMode,
                queueUsers,
                isQueuing,
                isMicTaken,
                aid,
            };

            const userInQueue = queueUsers.find((m) => m.userId === userId);
            const isActuallyInQueue = !!(userInQueue && userInQueue.position >= 0);
            const wasActuallyInQueue = prevUserPositionRef.current !== undefined && prevUserPositionRef.current >= 0;

            const prevChannelId = prevChannelIdRef.current;
            const prevChannelQueueMode = prevChannelQueueModeRef.current;
            const prevServerUuid = prevServerUuidRef.current;
            const prevQueueUsers = prevQueueUsersRef.current;

            const prevQueueUserIds = new Set(prevQueueUsers.map(u => u.userId));
            const currentQueueUserIds = new Set(queueUsers.map(u => u.userId));
            const firstQueueUser = queueUsers.find(u => u.position === 0);
            const firstQueueUserId = firstQueueUser?.userId || '';

            const isLeavingChannel = !currentChannelId && prevChannelId;
            const isEnteringChannel = currentChannelId && !prevChannelId;
            const isChannelChanged = currentChannelId && prevChannelId && currentChannelId !== prevChannelId;
            const isLeavingServer = prevServerUuid && (!currentServerUuid || currentServerUuid !== prevServerUuid);
            const isMicStatusChanged = isActuallyInQueue !== wasActuallyInQueue;
            const isVoiceModeChanged = currentChannelVoiceMode !== prevVoiceModeRef.current;

            const shouldSendRelease = wasActuallyInQueue || aid !== '' || (prevChannelId && prevChannelQueueMode);
            const shouldSendMessage = isLeavingChannel || isEnteringChannel || isChannelChanged || isMicStatusChanged || isVoiceModeChanged;

            const queueUsersChanged = prevQueueUsers.length !== queueUsers.length ||
                queueUsers.some(u => !prevQueueUserIds.has(u.userId)) ||
                prevQueueUsers.some(u => !currentQueueUserIds.has(u.userId));
            const shouldSendCheckSelf = queueUsersChanged && currentChannelId && isCurrentChannelQueueMode && firstQueueUserId;

            if (!shouldSendMessage) {
                if (shouldSendCheckSelf) {
                    sendMessage({
                        uid: userId,
                        aid: firstQueueUserId,
                        gid: currentServerUuid,
                        cid: currentChannelId,
                        action: 'checkSelf',
                        micOff: false,
                    });
                }
                updateRefs(currentChannelId, currentChannelVoiceMode, isCurrentChannelQueueMode, isMicTaken, isQueuing, currentServerUuid, userInQueue?.position, queueUsers);
                return;
            }

            const hasNoAction = !isActuallyInQueue && aid === '' && !isChannelChanged && !isVoiceModeChanged && !isLeavingChannel && !isEnteringChannel && !isMicStatusChanged;
            if (hasNoAction) {
                if (shouldSendCheckSelf) {
                    sendMessage({
                        uid: userId,
                        aid: firstQueueUserId,
                        gid: currentServerUuid,
                        cid: currentChannelId,
                        action: 'checkSelf',
                        micOff: false,
                    });
                }
                updateRefs(currentChannelId, currentChannelVoiceMode, isCurrentChannelQueueMode, isMicTaken, isQueuing, currentServerUuid, userInQueue?.position, queueUsers);
                return;
            }

            if (isLeavingServer) {
                if (shouldSendRelease && prevChannelId) {
                    const prevChannelMicOff = !prevChannelQueueMode;
                    sendMessage(createReleasePayload(userId, prevServerUuid, prevChannelId, prevChannelMicOff));
                }
                resetRefs(currentServerUuid);
                return;
            }

            if (isLeavingChannel) {
                if (shouldSendRelease) {
                    const prevChannelMicOff = !prevChannelQueueMode;
                    sendMessage(createReleasePayload(userId, currentServerUuid, prevChannelId, prevChannelMicOff));
                }
                resetRefs(currentServerUuid);
                return;
            }

            if (isChannelChanged) {
                if (wasActuallyInQueue) {
                    const prevChannelMicOff = !prevChannelQueueMode;
                    sendMessage(createReleasePayload(userId, currentServerUuid, prevChannelId, prevChannelMicOff));
                }

                const newChannelIsQueueMode = currentChannelVoiceMode === 'queue';
                sendMessage({
                    uid: userId,
                    aid: '',
                    micOff: !newChannelIsQueueMode,
                    gid: currentServerUuid,
                    cid: currentChannelId,
                });

                if (shouldSendCheckSelf) {
                    sendMessage({
                        uid: userId,
                        aid: firstQueueUserId,
                        gid: currentServerUuid,
                        cid: currentChannelId,
                        action: 'checkSelf',
                        micOff: false,
                    });
                }

                updateRefs(currentChannelId, currentChannelVoiceMode, newChannelIsQueueMode, isMicTaken, isQueuing, currentServerUuid, undefined, queueUsers);
                lastChannelSwitchTimeRef.current = Date.now();
                return;
            } else {
                const timeSinceChannelSwitch = Date.now() - lastChannelSwitchTimeRef.current;
                const isRecentChannelSwitch = timeSinceChannelSwitch < 1000;
                const isLikelyChannelSwitchEffect = isRecentChannelSwitch &&
                    isMicStatusChanged &&
                    wasActuallyInQueue &&
                    !isMicTaken &&
                    isCurrentChannelQueueMode &&
                    currentChannelId !== '';

                let action: 'take' | 'release' | undefined;
                if (isEnteringChannel) {
                    action = isActuallyInQueue ? 'take' : undefined;
                } else if (isMicStatusChanged) {
                    action = isActuallyInQueue ? 'take' : 'release';
                }

                if (isLikelyChannelSwitchEffect && action === 'release') {
                    updateRefs(currentChannelId, currentChannelVoiceMode, isCurrentChannelQueueMode, true, isQueuing, currentServerUuid, userInQueue?.position, queueUsers);
                    return;
                }

                const finalAid = currentChannelId ? aid : '';
                const micOff = currentChannelId ? !isCurrentChannelQueueMode : !prevChannelQueueMode;
                const targetCid = isLeavingChannel ? prevChannelId : currentChannelId;

                const messagePayload: PostMessagePayload = {
                    uid: userId,
                    aid: finalAid,
                    micOff,
                    gid: currentServerUuid,
                    cid: targetCid,
                };

                if (action) {
                    messagePayload.action = action;
                    if (action === 'release') {
                        messagePayload.aid = '';
                    }
                } else if (isMicStatusChanged && !isActuallyInQueue && wasActuallyInQueue) {
                    messagePayload.action = 'release';
                    messagePayload.aid = '';
                }

                sendMessage(messagePayload);
            }

            if (shouldSendCheckSelf) {
                sendMessage({
                    uid: userId,
                    aid: firstQueueUserId,
                    gid: currentServerUuid,
                    cid: currentChannelId,
                    action: 'checkSelf',
                    micOff: false,
                });
            }

            updateRefs(currentChannelId, currentChannelVoiceMode, isCurrentChannelQueueMode, isMicTaken, isQueuing, currentServerUuid, userInQueue?.position, queueUsers);
        },
        []
    );


    return (
        <ShowFrameContext.Provider
            value={{
                showFrameRef,
                handleShowFrameLoad,
                updateShowFrameState,
            }}
        >
            {children}
        </ShowFrameContext.Provider>
    );
};

ShowFrameProvider.displayName = 'ShowFrameProvider';

export default ShowFrameProvider;

