import { io, Socket } from 'socket.io-client';
import { BrowserWindow, ipcMain } from 'electron';
import type * as Types from '@/types';
import { env } from '@/env.js';
import Logger from '@/logger.js';

// Main window for sending events (set by main.ts)
let mainWindow: BrowserWindow | null = null;

export function setMainWindow(window: BrowserWindow | null) {
  mainWindow = window;
}

/**
 * Get windows that should receive socket events.
 * Only sends to the main window, not to authWindow or popups.
 */
function getTargetWindows(): BrowserWindow[] {
  return BrowserWindow.getAllWindows();
}

const ClientToServerEventWithAckNames = ['SFUCreateTransport', 'SFUConnectTransport', 'SFUCreateProducer', 'SFUCreateConsumer', 'SFUJoin', 'SFULeave'];

const ClientToServerEventNames = [
  'acceptMemberInvitation',
  'actionMessage',
  'addUserToQueue',
  'approveFriendApplication',
  'approveMemberApplication',
  'blockUser',
  'blockUserFromChannel',
  'blockUserFromServer',
  'channelMessage',
  'clearQueue',
  'connectChannel',
  'connectServer',
  'controlQueue',
  'createChannel',
  'createFriendGroup',
  'createServer',
  'deleteChannel',
  'deleteFriend',
  'deleteFriendApplication',
  'deleteFriendGroup',
  'deleteMemberApplication',
  'deleteMemberInvitation',
  'deleteServer',
  'directMessage',
  'disconnectChannel',
  'disconnectServer',
  'editChannel',
  'editChannelPermission',
  'editFriend',
  'editFriendApplication',
  'editFriendGroup',
  'editMember',
  'editMemberApplication',
  'editMemberInvitation',
  'editServer',
  'editServerPermission',
  'editUser',
  'editUserSetting',
  'favoriteServer',
  'increaseUserQueueTime',
  'joinQueue',
  'leaveQueue',
  'moveUserQueuePosition',
  'moveUserToChannel',
  'muteUserInChannel',
  'rejectFriendApplication',
  'rejectMemberApplication',
  'rejectMemberInvitation',
  'removeUserFromQueue',
  'sendFriendApplication',
  'sendMemberApplication',
  'sendMemberInvitation',
  'shakeWindow',
  'stranger',
  'terminateMember',
  'unblockUser',
  'unblockUserFromChannel',
  'unblockUserFromServer',
];

const ServerToClientEventNames = [
  'actionMessage',
  'channelAdd',
  'channelMemberUpdate',
  'channelMessage',
  'channelRemove',
  'channelUpdate',
  'directMessage',
  'error',
  'friendAdd',
  'friendApplicationAdd',
  'friendApplicationRemove',
  'friendApplicationUpdate',
  'friendGroupAdd',
  'friendGroupRemove',
  'friendGroupUpdate',
  'friendRemove',
  'friendUpdate',
  'memberInvitationAdd',
  'memberInvitationRemove',
  'memberInvitationUpdate',
  'notification', // not used yet
  'openPopup',
  'playSound',
  'queueMembersSet',
  'serverAdd',
  'serverMemberAdd',
  'serverMemberApplicationAdd',
  'serverMemberApplicationRemove',
  'serverMemberApplicationUpdate',
  'serverMemberRemove',
  'serverMemberUpdate',
  'serverOnlineMemberAdd',
  'serverOnlineMemberRemove',
  'serverOnlineMemberUpdate',
  'serverRemove',
  'serverUpdate',
  'SFUJoined',
  'SFULeft',
  'SFUNewProducer',
  'SFUProducerClosed',
  'shakeWindow',
  'userUpdate',
];

const noLogEventSet = new Set<string>(['queueMembersSet', 'serverOnlineMemberUpdate']);

export let socket: Socket | null = null;
export let seq: number = 0;
export let interval: NodeJS.Timeout | null = null;

async function emitWithRetry<T>(event: string, payload: unknown, retries = 10): Promise<Types.ACK<T>> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await new Promise<Types.ACK<T>>((resolve, reject) => {
        socket?.timeout(5000).emit(event, payload, (err: unknown, ack: Types.ACK<T>) => {
          if (err) reject(err);
          else resolve(ack);
        });
      });
    } catch (err) {
      if (i === retries) throw err;
      new Logger('Socket').warn(`Retrying(#${i}) socket.emit ${event}: ${JSON.stringify(payload)}`);
    }
  }
  throw new Error('Failed to emit event with retry');
}

function sendHeartbeat() {
  const start = Date.now();
  socket?.timeout(5000).emit('heartbeat', { seq: ++seq }, (err: unknown, ack: { seq: number; t: number }) => {
    if (err) {
      new Logger('Socket').warn(`Heartbeat ${seq} timeout`);
    } else {
      const latency = Date.now() - start;
      new Logger('Socket').info(`ACK for #${ack.seq} in ${latency} ms`);
      getTargetWindows().forEach((window) => {
        window.webContents.send('heartbeat', { seq: ack.seq, latency });
      });
    }
  });
}

export function connectSocket(token: string) {
  if (!token) return;

  if (socket) disconnectSocket();

  seq = 0;

  socket = io(env.WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 20000,
    timeout: 10000,
    autoConnect: false,
    query: { token: token },
  });

  socket.on('connect', () => {
    for (const event of ClientToServerEventNames) {
      ipcMain.removeAllListeners(event);
    }

    for (const event of ServerToClientEventNames) {
      socket?.removeAllListeners(event);
    }

    // Register event listeners
    ClientToServerEventWithAckNames.forEach((event) => {
      ipcMain.handle(event, (_, payload) => {
        new Logger('Socket').info(`socket.emit ${event}: ${JSON.stringify(payload)}`);
        return new Promise((resolve) => {
          emitWithRetry(event, payload)
            .then((ack) => {
              new Logger('Socket').info(`socket.onAck ${event}: ${JSON.stringify(ack)}`);
              resolve(ack);
            })
            .catch((err) => {
              new Logger('Socket').error(`socket.emit ${event} error: ${err.message}`);
              resolve({ ok: false, error: err.message });
            });
        });
      });
    });

    ClientToServerEventNames.forEach((event) => {
      ipcMain.on(event, (_, ...args) => {
        new Logger('Socket').info(`socket.emit ${event}: ${JSON.stringify(args)}`);
        socket?.emit(event, ...args);
      });
    });

    ServerToClientEventNames.forEach((event) => {
      socket?.on(event, async (...args) => {
        if (!noLogEventSet.has(event)) new Logger('Socket').info(`socket.on ${event}: ${JSON.stringify(args)}`);

        if (event === 'playSound') {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(event, ...args);
          }
        } else {
          getTargetWindows().forEach((window) => {
            window.webContents.send(event, ...args);
          });
        }
      });
    });

    sendHeartbeat();
    if (interval) clearInterval(interval);
    interval = setInterval(sendHeartbeat, 30000);

    new Logger('Socket').info(`Socket connected`);

    getTargetWindows().forEach((window) => {
      window.webContents.send('connect', null);
    });
  });

  socket.on('disconnect', (reason) => {
    // Clean up event listeners
    for (const event of ClientToServerEventWithAckNames) {
      ipcMain.removeHandler(event);
    }

    for (const event of ClientToServerEventNames) {
      ipcMain.removeAllListeners(event);
    }

    for (const event of ServerToClientEventNames) {
      socket?.removeAllListeners(event);
    }

    if (interval) clearInterval(interval);

    new Logger('Socket').info(`Socket disconnected, reason: ${reason}`);

    getTargetWindows().forEach((window) => {
      window.webContents.send('disconnect', reason);
    });
  });

  socket.on('connect_error', (error) => {
    new Logger('Socket').error(`Socket connect error: ${error}`);

    getTargetWindows().forEach((window) => {
      window.webContents.send('connect_error', error);
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    new Logger('Socket').info(`Socket reconnected, attempt number: ${attemptNumber}`);

    getTargetWindows().forEach((window) => {
      window.webContents.send('reconnect', attemptNumber);
    });
  });

  socket.on('reconnect_error', (error) => {
    new Logger('Socket').error(`Socket reconnect error: ${error}`);

    getTargetWindows().forEach((window) => {
      window.webContents.send('reconnect_error', error);
    });
  });

  socket.connect();
}

export function disconnectSocket() {
  if (!socket) return;

  socket.emit('disconnectUser');

  for (const event of ClientToServerEventNames) {
    ipcMain.removeAllListeners(event);
  }

  for (const event of ServerToClientEventNames) {
    socket?.removeAllListeners(event);
  }

  socket.disconnect();
  socket = null;
}
