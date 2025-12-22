type StereoBuffer = { left: Float32Array; right: Float32Array };

/**
 * Encode audio data to WAV
 * @param buffers - Audio data
 * @param sampleRate - Sample rate
 * @returns Encoded audio data
 */
export function encodeAudio(buffers: StereoBuffer[], sampleRate: number): ArrayBuffer {
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

  return buffer;
}

export default encodeAudio;
