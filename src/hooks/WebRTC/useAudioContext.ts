import { useCallback, useEffect } from 'react';

import * as Store from '@/store';

import type { SharedRefs } from './useSharedRefs';

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
  const {
    audioContextRef,
    inputDesRef,
    outputDesRef,
    recorderDesRef,
    inputAnalyserRef,
    masterGainNodeRef,
    speakerRef,
  } = refs;

  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) audioContextRef.current.close();
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

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    await audioContext.audioWorklet.addModule(
      URL.createObjectURL(new Blob([workletCode], { type: 'text/javascript' })),
    );

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
    speakerRef.current.play().catch(() => { });
    document.body.appendChild(speakerRef.current);
  }, [audioContextRef, inputDesRef, outputDesRef, recorderDesRef, inputAnalyserRef, masterGainNodeRef, speakerRef]);

  useEffect(() => {
    const initAudioOnInteraction = async () => {
      if (!audioContextRef.current) await initAudioContext();
      else if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    };
    document.addEventListener('click', initAudioOnInteraction, { once: true });
    document.addEventListener('keydown', initAudioOnInteraction, { once: true });
    return () => {
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };
  }, [initAudioContext, audioContextRef]);

  return { initAudioContext };
};
