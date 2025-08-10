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
        style={{
          top: 0,
          left: 0,
          width: '100%',
          height: '98%',
        }}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // If not youtube link
  return <MarkdownViewer markdownText={announcement} />;
}
