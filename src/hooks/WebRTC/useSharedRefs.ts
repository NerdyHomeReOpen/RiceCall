import { useRef } from 'react';
import * as mediasoupClient from 'mediasoup-client';

export const useSharedRefs = () => {
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
  const microphoneAmplificationRef = useRef<boolean>(false);
  const inputAudioDeviceRef = useRef<string | null>(null);
  const echoCancellationRef = useRef<boolean>(false);
  const noiseCancellationRef = useRef<boolean>(false);
  const recordBuffersRef = useRef<{
    left: Float32Array<ArrayBufferLike>;
    right: Float32Array<ArrayBufferLike>;
  }[]>([]);
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
    microphoneAmplificationRef,
    inputAudioDeviceRef,
    echoCancellationRef,
    noiseCancellationRef,
    recordBuffersRef,
    recordTimerRef,
  };
};

export type SharedRefs = ReturnType<typeof useSharedRefs>;
