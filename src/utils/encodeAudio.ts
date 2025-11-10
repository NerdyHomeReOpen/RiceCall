type StereoBuffer = { left: Float32Array; right: Float32Array };
type AudioFormat = 'wav' | 'mp3';

/**
 * Encode audio data to specified format (WAV or MP3)
 * @param buffers - Audio data
 * @param sampleRate - Sample rate
 * @param format - Audio format
 * @returns Encoded audio data
 */
export function encodeAudio(buffers: StereoBuffer[], sampleRate: number, format: AudioFormat = 'wav'): Blob {
  if (format === 'wav') return encodeWAV(buffers, sampleRate);
  if (format === 'mp3') return encodeMP3(buffers, sampleRate);
  throw new Error('Unsupported format');
}

function encodeWAV(buffers: StereoBuffer[], sampleRate: number): Blob {
  const left = buffers.flatMap((b) => Array.from(b.left));
  const right = buffers.flatMap((b) => Array.from(b.right));
  const length = left.length + right.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (let i = 0; i < left.length; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l * 0x7fff, true);
    view.setInt16(offset + 2, r * 0x7fff, true);
    offset += 4;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function encodeMP3(buffers: StereoBuffer[], sampleRate: number): Blob {
  // TODO: Implement encodeMP3
  console.warn('encodeMP3 is not implemented, using encodeWAV instead');

  const left = buffers.flatMap((b) => Array.from(b.left));
  const right = buffers.flatMap((b) => Array.from(b.right));
  const length = left.length + right.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, length * 2, true);

  let offset = 44;
  for (let i = 0; i < left.length; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l * 0x7fff, true);
    view.setInt16(offset + 2, r * 0x7fff, true);
    offset += 4;
  }

  return new Blob([], { type: 'audio/mpeg' });
}
