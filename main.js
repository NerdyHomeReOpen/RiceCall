/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');
const { app, BrowserWindow, ipcMain, session } = require('electron');
const serve = require('electron-serve');
const net = require('net');
const DiscordRPC = require('discord-rpc');
const { io } = require('socket.io-client');

let isDev = process.argv.includes('--dev');

const appServe = app.isPackaged
  ? serve({
      directory: path.join(__dirname, './out'),
    })
  : !isDev
  ? serve({
      directory: path.join(__dirname, './out'),
    })
  : null;

let baseUri = '';

if (isDev) {
  baseUri = 'http://127.0.0.1:3000';
}

// Track windows
let mainWindow = null;
let authWindow = null;
let popups = {};

// Socket connection
const WS_URL = 'http://localhost:4500';
let socketInstance = null;

// Disocrd RPC
const clientId = '1242441392341516288';
DiscordRPC.register(clientId);
let rpc = new DiscordRPC.Client({ transport: 'ipc' });

const defaultPrecence = {
  details: '正在使用應用',
  state: '準備中',
  startTimestamp: Date.now(),
  largeImageKey: 'app_icon',
  largeImageText: '應用名稱',
  smallImageKey: 'status_icon',
  smallImageText: '狀態說明',
  instance: false,
  buttons: [
    {
      label: '加入我們的Discord伺服器',
      url: 'https://discord.gg/adCWzv6wwS',
    },
  ],
};

function waitForPort(port) {
  return new Promise((resolve, reject) => {
    let timeout = 30000; // 30 seconds timeout
    let timer;

    function tryConnect() {
      const client = new net.Socket();

      client.once('connect', () => {
        clearTimeout(timer);
        client.destroy();
        resolve();
      });

      client.once('error', (error) => {
        client.destroy();

        if (timeout <= 0) {
          clearTimeout(timer);
          reject(new Error('Timeout waiting for port'));
          return;
        }

        setTimeout(tryConnect, 1000);
        timeout -= 1000;
      });

      client.connect({ port: port, host: '127.0.0.1' });
    }

    tryConnect();
  });
}

async function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return mainWindow;
  }

  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  mainWindow = new BrowserWindow({
    minWidth: 1400,
    minHeight: 800,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(mainWindow).then(() => {
      mainWindow.loadURL('app://-');
    });
  } else {
    mainWindow.loadURL(`${baseUri}`);
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send(
      mainWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
  });

  mainWindow.webContents.on('close', () => {
    app.quit();
  });

  return mainWindow;
}

async function createAuthWindow() {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus();
    return authWindow;
  }

  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  authWindow = new BrowserWindow({
    width: 610,
    height: 450,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(authWindow).then(() => {
      authWindow.loadURL('app://./auth.html');
    });
  } else {
    authWindow.loadURL(`${baseUri}/auth`);
    // Open DevTools in development mode
    authWindow.webContents.openDevTools();
  }

  authWindow.webContents.on('did-finish-load', () => {
    authWindow.webContents.send(
      authWindow.isMaximized() ? 'window-maximized' : 'window-unmaximized',
    );
  });

  authWindow.webContents.on('close', () => {
    app.quit();
  });

  return authWindow;
}

async function createPopup(type, height, width) {
  // Track popup windows
  if (popups[type] && !popups[type].isDestroyed()) {
    popups[type].focus();
    return popups[type];
  }

  if (isDev) {
    try {
      await waitForPort(3000);
    } catch (err) {
      console.error('Failed to connect to Next.js server:', err);
      app.quit();
      return;
    }
  }

  popups[type] = new BrowserWindow({
    width: width ?? 800,
    height: height ?? 600,
    resizable: false,
    frame: false,
    transparent: true,
    hasShadow: true,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (app.isPackaged || !isDev) {
    appServe(popups[type]).then(() => {
      popups[type].loadURL(`app://./popup.html?type=${type}`);
    });
  } else {
    popups[type].loadURL(`${baseUri}/popup?type=${type}`);
    // Open DevTools in development mode
    popups[type].webContents.openDevTools();
  }

  popups[type].webContents.on('closed', () => {
    popups[type] = null;
  });

  return popups[type];
}

function connectSocket(token) {
  const socket = io(WS_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: false,
    query: {
      jwt: token,
    },
  });

  socket.on('connect', () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('connect', socket.id);
    });
    socket.on('connect_error', (error) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('connect_error', error),
      );
    });
    socket.on('error', (error) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('error', error),
      );
    });
    socket.on('disconnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('disconnect', data),
      );
    });
    socket.on('userConnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('userConnect', data),
      );
    });
    socket.on('userDisconnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('userDisconnect', data),
      );
    });
    socket.on('userUpdate', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('userUpdate', data),
      );
    });
    socket.on('serverConnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('serverConnect', data),
      );
    });
    socket.on('serverDisconnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('serverDisconnect', data),
      );
    });
    socket.on('serverUpdate', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('serverUpdate', data),
      );
    });
    socket.on('serverSearch', (data) => {
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send('serverSearch', data);
      });
    });
    socket.on('channelConnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('channelConnect', data),
      );
    });
    socket.on('channelDisconnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('channelDisconnect', data),
      );
    });
    socket.on('channelUpdate', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('channelUpdate', data),
      );
    });
    socket.on('RTCConnect', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('RTCConnect', data),
      );
    });
    socket.on('RTCOffer', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('RTCOffer', data),
      );
    });
    socket.on('RTCAnswer', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('RTCAnswer', data),
      );
    });
    socket.on('RTCIceCandidate', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('RTCIceCandidate', data),
      );
    });
    socket.on('RTCJoin', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('RTCJoin', data),
      );
    });
    socket.on('RTCLeave', (data) => {
      BrowserWindow.getAllWindows().forEach((window) =>
        window.webContents.send('RTCLeave', data),
      );
    });

    // Socket IPC event handling
    ipcMain.on('refreshUser', (_) => socket.emit('refreshUser'));
    ipcMain.on('connectUser', (_, data) => socket.emit('connectUser', data));
    ipcMain.on('updateUser', (_, data) => socket.emit('updateUser', data));
    ipcMain.on('connectServer', (_, data) =>
      socket.emit('connectServer', data),
    );
    ipcMain.on('searchServer', (_, data) => socket.emit('searchServer', data));
    ipcMain.on('disconnectServer', (_, data) =>
      socket.emit('disconnectServer', data),
    );
    ipcMain.on('createServer', (_, data) => socket.emit('createServer', data));
    ipcMain.on('updateServer', (_, data) => socket.emit('updateServer', data));
    ipcMain.on('deleteServer', (_, data) => socket.emit('deleteServer', data));
    ipcMain.on('updateMember', (_, data) => socket.emit('updateMember', data));
    ipcMain.on('connectChannel', (_, data) =>
      socket.emit('connectChannel', data),
    );
    ipcMain.on('disconnectChannel', (_, data) =>
      socket.emit('disconnectChannel', data),
    );
    ipcMain.on('updateChannel', (_, data) =>
      socket.emit('updateChannel', data),
    );
    ipcMain.on('createChannel', (_, data) =>
      socket.emit('createChannel', data),
    );
    ipcMain.on('deleteChannel', (_, data) =>
      socket.emit('deleteChannel', data),
    );
    ipcMain.on('message', (_, data) => socket.emit('message', data));
    ipcMain.on('directMessage', (_, data) =>
      socket.emit('directMessage', data),
    );
    ipcMain.on('RTCOffer', (_, data) => socket.emit('RTCOffer', data));
    ipcMain.on('RTCAnswer', (_, data) => socket.emit('RTCAnswer', data));
    ipcMain.on('RTCIceCandidate', (_, data) =>
      socket.emit('RTCIceCandidate', data),
    );

    mainWindow?.show();
    authWindow?.hide();
  });

  return socket;
}

function disconnectSocket(socket) {
  socket?.disconnect();
  return null;
}

async function setActivity(activity) {
  if (!rpc) return;
  try {
    rpc.setActivity(activity);
  } catch (error) {
    console.error('設置Rich Presence時出錯:', error);
    rpc.setActivity(defaultPrecence);
  }
}

rpc.on('ready', () => {
  setActivity(defaultPrecence);
});

app.on('ready', async () => {
  await createAuthWindow();
  await createMainWindow();

  mainWindow.hide();
  authWindow.show();

  app.on('before-quit', () => {
    if (rpc) rpc.destroy().catch(console.error);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  ipcMain.on('login', (_, token) => {
    mainWindow.show();
    authWindow.hide();
    if (!socketInstance) socketInstance = connectSocket(token);
    socketInstance.connect();
  });

  ipcMain.on('logout', () => {
    mainWindow.hide();
    authWindow.show();
    socketInstance = disconnectSocket(socketInstance);
  });

  // Initial data request handlers
  ipcMain.on('request-initial-data', (_, to) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('request-initial-data', to);
    });
  });
  ipcMain.on('response-initial-data', (_, from, data) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('response-initial-data', from, data);
    });
  });

  // Popup submit handlers
  ipcMain.on('popup-submit', (_, to) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send('popup-submit', to);
    });
  });

  // Popup handlers
  ipcMain.on('open-popup', async (_, type, height, width) => {
    createPopup(type, height, width);
  });

  // Window control event handlers
  ipcMain.on('window-control', (event, command) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    switch (command) {
      case 'minimize':
        window.minimize();
        break;
      case 'maximize':
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
        break;
      case 'unmaximize':
        window.unmaximize();
        break;
      case 'close':
        window.close();
        break;
    }
  });

  // Discord RPC handlers
  ipcMain.on('update-discord-presence', (_, updatePresence) => {
    setActivity(updatePresence);
  });

  ipcMain.on('openDevtool', () => {
    if (isDev) {
      const currentWindow = BrowserWindow.getFocusedWindow();

      if (currentWindow)
        currentWindow.webContents.openDevTools({ mode: 'detach' });
    }
  });
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createAuthWindow();
    await createMainWindow();

    mainWindow.hide();
    authWindow.show();
  }
});

rpc.login({ clientId }).catch(() => {
  console.log('Discord RPC登錄失敗, 將不會顯示Discord Rich Presence');
  rpc = null;
});
