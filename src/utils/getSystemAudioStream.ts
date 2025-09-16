export async function getSystemAudioStream(): Promise<MediaStream> {
  // 1) pide al main que active loopback
  await window.loopbackAudio.enable();

  // 2) getDisplayMedia debe pedir también video:true en la mayoría de casos
  const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: true,
    video: true,
  });

  // 3) quita las pistas de vídeo (recomendado por la lib)
  for (const track of stream.getVideoTracks()) {
    track.stop();
    stream.removeTrack(track);
  }

  // 4) desactiva loopback para no afectar otros usos de getDisplayMedia
  await window.loopbackAudio.disable();

  return stream; // solo con audio del sistema
}
