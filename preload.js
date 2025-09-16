const { ipcRenderer } = require('electron');

console.log('PRELOAD INICIADO');

window.loopbackAudio = {
  enable: () => ipcRenderer.invoke('enable-loopback-audio'),
  disable: () => ipcRenderer.invoke('disable-loopback-audio'),
};
