import { io, Socket } from 'socket.io-client';
import { BrowserWindow, ipcMain } from 'electron';
import { createPopup } from '../../main.js';
import { env } from './env.js';

import type * as Types from '@/types';

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
      console.warn(`${new Date().toLocaleString()} | Retrying(#${retries}) socket.emit `, event, payload);
    }
  }
  throw new Error('Failed to emit event with retry');
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
        console.log(`${new Date().toLocaleString()} | socket.emit`, event, payload);
        return new Promise((resolve) => {
          emitWithRetry(event, payload)
            .then((ack) => {
              console.log(`${new Date().toLocaleString()} | socket.onAck`, event, ack);
              resolve(ack);
            })
            .catch((err) => {
              console.error(`${new Date().toLocaleString()} | socket.emit error`, event, err);
              resolve({ ok: false, error: err.message });
            });
        });
      });
    });

    ClientToServerEventNames.forEach((event) => {
      ipcMain.on(event, (_, ...args) => {
        console.log(`${new Date().toLocaleString()} | socket.emit`, event, ...args);
        socket?.emit(event, ...args);
      });
    });

    ServerToClientEventNames.forEach((event) => {
      socket?.on(event, async (...args) => {
        if (event !== 'queueMembersSet' && event !== 'serverOnlineMemberUpdate') console.log(`${new Date().toLocaleString()} | socket.on`, event, ...args);
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send(event, ...args);
        });
        // Handle special events
        if (event === 'shakeWindow') {
          const initialData: Record<string, unknown> | undefined = args[0].initialData;
          if (!initialData) return;
          const title = initialData.name as string;
          createPopup('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event, message: args[0] }, false, title);
        }
        if (event === 'directMessage') {
          const initialData: Record<string, unknown> | undefined = args[0].initialData;
          if (!initialData) return;
          const title = initialData.name as string;
          createPopup('directMessage', `directMessage-${initialData.targetId}`, { ...initialData, event, message: args[0] }, false, title);
        }
      });
    });

    console.info(`${new Date().toLocaleString()} | Socket connected`);

    BrowserWindow.getAllWindows().forEach((window) => {
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

    console.info(`${new Date().toLocaleString()} | Socket disconnected, reason:`, reason);

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('disconnect', reason);
    });
  });

  socket.on('connect_error', (error) => {
    console.error(`${new Date().toLocaleString()} | Socket connect error:`, error);

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect_error', error);
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    console.info(`${new Date().toLocaleString()} | Socket reconnected, attempt number:`, attemptNumber);

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect', attemptNumber);
    });
  });

  socket.on('reconnect_error', (error) => {
    console.error(`${new Date().toLocaleString()} | Socket reconnect error:`, error);

    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('reconnect_error', error);
    });
  });

  interval = setInterval(() => {
    const start = Date.now();
    socket?.timeout(5000).emit('heartbeat', { seq: ++seq }, (err: unknown, ack: { seq: number; t: number }) => {
      if (err) {
        console.warn(`${new Date().toLocaleString()} | Heartbeat ${seq} timeout`);
      } else {
        const latency = Date.now() - start;

        console.log(`${new Date().toLocaleString()} | ACK for #${ack.seq} in ${latency} ms`);

        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send('heartbeat', { seq: ack.seq, latency });
        });
      }
    });
  }, 30000);

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
