// global.d.ts
export {};

declare global {
  interface Window {
    loopbackAudio: {
      enable: () => Promise<void>;
      disable: () => Promise<void>;
    };
  }
}
