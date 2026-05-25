import { useCallback, useEffect, useRef } from 'react';

import * as Store from '@/store';

import type { SharedRefs } from './useSharedRefs';

import Logger from '@/utils/logger';

const workletCode = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffers = [];
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const left = input[0];
    const right = input[1] || input[0];
    this.port.postMessage({ left, right });
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);
`;

export const useAudioContext = (refs: SharedRefs) => {
  const { audioContextRef, inputDesRef, outputDesRef, recorderDesRef, inputAnalyserRef, masterGainNodeRef, speakerRef } = refs;

  const initPromiseRef = useRef<Promise<void> | null>(null);

  const initAudioContext = useCallback(async (): Promise<void> => {
    if (initPromiseRef.current) return initPromiseRef.current;

    const run = async () => {
      if (audioContextRef.current) await audioContextRef.current.close();
      if (inputDesRef.current) inputDesRef.current.disconnect();
      if (outputDesRef.current) outputDesRef.current.disconnect();
      if (recorderDesRef.current) recorderDesRef.current.disconnect();
      if (inputAnalyserRef.current) inputAnalyserRef.current.disconnect();
      if (masterGainNodeRef.current) masterGainNodeRef.current.disconnect();
      if (speakerRef.current) {
        speakerRef.current.srcObject = null;
        speakerRef.current.pause();
        speakerRef.current.remove();
      }

      const audioContext = new AudioContext();

      // if (audioContext.state === 'suspended') {
      //   await audioContext.resume();
      // }

      await audioContext.audioWorklet.addModule(URL.createObjectURL(new Blob([workletCode], { type: 'text/javascript' })));

      audioContextRef.current = audioContext;
      inputDesRef.current = audioContext.createMediaStreamDestination();
      outputDesRef.current = audioContext.createMediaStreamDestination();
      recorderDesRef.current = audioContext.createMediaStreamDestination();
      inputAnalyserRef.current = audioContext.createAnalyser();
      inputAnalyserRef.current.fftSize = 2048;
      masterGainNodeRef.current = audioContext.createGain();
      masterGainNodeRef.current.gain.value = Store.store.getState().webrtc.speakerVolume / 100;
      masterGainNodeRef.current.connect(outputDesRef.current!);

      speakerRef.current = new Audio();
      speakerRef.current.srcObject = outputDesRef.current.stream;
      speakerRef.current.volume = 1;
      speakerRef.current.autoplay = true;
      speakerRef.current.style.display = 'none';
      speakerRef.current.play().catch(() => {});
      document.body.appendChild(speakerRef.current);

      new Logger('WebRTC').info('Initialized audio context');
    };

    initPromiseRef.current = run().finally(() => {
      initPromiseRef.current = null;
    });

    return initPromiseRef.current;
  }, [audioContextRef, inputDesRef, outputDesRef, recorderDesRef, inputAnalyserRef, masterGainNodeRef, speakerRef]);

  useEffect(() => {
    const initAudioOnInteraction = () => {
      if (!audioContextRef.current || !speakerRef.current) initAudioContext();
      else {
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
        speakerRef.current.play();
      }
    };
    document.addEventListener('click', initAudioOnInteraction, { capture: true });
    document.addEventListener('keydown', initAudioOnInteraction, { capture: true });
    return () => {
      document.removeEventListener('click', initAudioOnInteraction, { capture: true });
      document.removeEventListener('keydown', initAudioOnInteraction, { capture: true });
    };
  }, [initAudioContext, audioContextRef, speakerRef]);

  return { initAudioContext };
};
