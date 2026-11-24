import { useRef } from 'react';
import type { RefObject } from 'react';
import * as mediasoupClient from 'mediasoup-client';

export type SharedRefs = {
  rafIdListRef: RefObject<{ [userId: string]: number }>;
  audioContextRef: RefObject<AudioContext | null>;
  audioProducerRef: RefObject<mediasoupClient.types.Producer<mediasoupClient.types.AppData> | null>;
  speakerRef: RefObject<HTMLAudioElement | null>;
  micNodesRef: RefObject<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null }>;
  mixNodesRef: RefObject<{ stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null }>;
  speakerNodesRef: RefObject<{ [id: string]: { stream: MediaStream | null; source: MediaStreamAudioSourceNode | null; gain: GainNode | null; analyser: AnalyserNode | null } }>;
  masterGainNodeRef: RefObject<GainNode | null>;
  inputAnalyserRef: RefObject<AnalyserNode | null>;
  inputDesRef: RefObject<MediaStreamAudioDestinationNode | null>;
  outputDesRef: RefObject<MediaStreamAudioDestinationNode | null>;
  recorderDesRef: RefObject<MediaStreamAudioDestinationNode | null>;
  recorderGainRef: RefObject<GainNode | null>;
  bitrateRef: RefObject<number>;
  deviceRef: RefObject<mediasoupClient.types.Device>;
  sendTransportRef: RefObject<mediasoupClient.types.Transport<mediasoupClient.types.AppData> | null>;
  recvTransportRef: RefObject<mediasoupClient.types.Transport<mediasoupClient.types.AppData> | null>;
  consumersRef: RefObject<{ [producerId: string]: mediasoupClient.types.Consumer<mediasoupClient.types.AppData> }>;
  isMicrophoneAmplificationEnabledRef: RefObject<boolean>;
  inputAudioDeviceRef: RefObject<string | null>;
  isEchoCancellationEnabledRef: RefObject<boolean>;
  isNoiseCancellationEnabledRef: RefObject<boolean>;
  recordBuffersRef: RefObject<{ left: Float32Array<ArrayBufferLike>; right: Float32Array<ArrayBufferLike> }[]>;
  recordTimerRef: RefObject<NodeJS.Timeout | null>;
};

export const useSharedRefs = (): SharedRefs => {
  const rafIdListRef = useRef<{ [userId: string]: number }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioProducerRef = useRef<mediasoupClient.types.Producer | null>(null);
  const speakerRef = useRef<HTMLAudioElement | null>(null);

  const micNodesRef = useRef<{
    stream: MediaStream | null;
    source: MediaStreamAudioSourceNode | null;
    gain: GainNode | null;
  }>({ stream: null, source: null, gain: null });

  const mixNodesRef = useRef<{
    stream: MediaStream | null;
    source: MediaStreamAudioSourceNode | null;
    gain: GainNode | null;
  }>({ stream: null, source: null, gain: null });

  const speakerNodesRef = useRef<{
    [id: string]: {
      stream: MediaStream | null;
      source: MediaStreamAudioSourceNode | null;
      gain: GainNode | null;
      analyser: AnalyserNode | null;
    };
  }>({});

  const masterGainNodeRef = useRef<GainNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const inputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const outputDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderDesRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const recorderGainRef = useRef<GainNode | null>(null);
  const bitrateRef = useRef<number>(64000);
  const deviceRef = useRef<mediasoupClient.Device>(new mediasoupClient.Device());
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const consumersRef = useRef<{ [producerId: string]: mediasoupClient.types.Consumer }>({});
  const isMicrophoneAmplificationEnabledRef = useRef<boolean>(false);
  const inputAudioDeviceRef = useRef<string | null>(null);
  const isEchoCancellationEnabledRef = useRef<boolean>(false);
  const isNoiseCancellationEnabledRef = useRef<boolean>(false);

  const recordBuffersRef = useRef<
    {
      left: Float32Array<ArrayBufferLike>;
      right: Float32Array<ArrayBufferLike>;
    }[]
  >([]);

  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);

  return {
    rafIdListRef,
    audioContextRef,
    audioProducerRef,
    speakerRef,
    micNodesRef,
    mixNodesRef,
    speakerNodesRef,
    masterGainNodeRef,
    inputAnalyserRef,
    inputDesRef,
    outputDesRef,
    recorderDesRef,
    recorderGainRef,
    bitrateRef,
    deviceRef,
    sendTransportRef,
    recvTransportRef,
    consumersRef,
    isMicrophoneAmplificationEnabledRef,
    inputAudioDeviceRef,
    isEchoCancellationEnabledRef,
    isNoiseCancellationEnabledRef,
    recordBuffersRef,
    recordTimerRef,
  };
};
