import React from 'react';
import MarkdownViewer from './MarkdownViewer';

 function isYouTubeUrl(url: string) {
    return url.startsWith('http://www.youtube') || url.startsWith('https://www.youtube');
  }

  function getYouTubeVideoId(url: string) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

export default function AnnouncementRenderer({ announcement }: { announcement: string }) {
  if (announcement && isYouTubeUrl(announcement)) {
    const videoId = getYouTubeVideoId(announcement);
    if (!videoId) {
      // No pudo extraer videoId, muestra el texto normal
      return <MarkdownViewer markdownText={announcement} />;
    }

    return (
      <iframe
        width="560"
        height="315"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Si no es link youtube, mostrar markdown normal
  return <MarkdownViewer markdownText={announcement} />;
}
