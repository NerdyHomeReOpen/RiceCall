// src/hooks/WebRTC/useAudioContext.ts
import { useCallback, useEffect } from 'react';
import type { SharedRefs } from './useSharedRefs';
import * as Store from '@/store';

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
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    const audioContext = new AudioContext();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    await audioContext.audioWorklet.addModule(
      URL.createObjectURL(new Blob([workletCode], { type: 'text/javascript' })),
    );
    audioContextRef.current = audioContext;

    if (inputDesRef.current) inputDesRef.current.disconnect();
    inputDesRef.current = audioContext.createMediaStreamDestination();

    if (outputDesRef.current) outputDesRef.current.disconnect();
    outputDesRef.current = audioContext.createMediaStreamDestination();

    if (recorderDesRef.current) recorderDesRef.current.disconnect();
    recorderDesRef.current = audioContext.createMediaStreamDestination();

    if (inputAnalyserRef.current) inputAnalyserRef.current.disconnect();
    const inputAnalyser = audioContext.createAnalyser();
    inputAnalyserRef.current = inputAnalyser;
    inputAnalyser.fftSize = 2048;

    if (masterGainNodeRef.current) masterGainNodeRef.current.disconnect();
    const masterGainNode = audioContext.createGain();
    masterGainNodeRef.current = masterGainNode;
    masterGainNode.gain.value = Store.store.getState().webrtc.speakerVolume / 100;
    masterGainNode.connect(outputDesRef.current!);

    if (speakerRef.current) {
      speakerRef.current.srcObject = null;
      speakerRef.current.pause();
      speakerRef.current.remove();
    }
    const speaker = new Audio();
    speaker.srcObject = outputDesRef.current.stream;
    speaker.volume = 1;
    speaker.autoplay = true;
    speaker.style.display = 'none';
    speaker.play().catch(() => {});
    speakerRef.current = speaker;
    document.body.appendChild(speaker);
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
