import React from 'react';
import MarkdownViewer from './MarkdownViewer';

  function isYouTubeUrl(url: string) {
    return url.startsWith('http://www.youtube') || url.startsWith('https://www.youtube');
  }

  function isTwitchUrl(url: string) {
    return url.startsWith('http://www.twitch.tv') || url.startsWith('https://www.twitch.tv');
  }

  function getYouTubeVideoId(url: string) {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  function getTwitchChannelName(url: string) {
    const match = url.match(/twitch\.tv\/([^/?]+)/);
    return match ? match[1] : null;
  }

export default function AnnouncementRenderer({ announcement }: { announcement: string }) {
  if (announcement && isYouTubeUrl(announcement)) {
    const videoId = getYouTubeVideoId(announcement);
    if (!videoId) {
      // Cannot extract video, show normal announcement
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
  } else if (announcement && isTwitchUrl(announcement)) {
    const channelName = getTwitchChannelName(announcement);
    if (!channelName) {
      // Cannot extract video, show normal announcement
      return <MarkdownViewer markdownText={announcement} />;
    }
    return (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
        <iframe
          src={`https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}&autoplay=true`}
          title="Twitch stream player"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '400px',
          }}
          frameBorder="0"
          allowFullScreen
        />
      </div>
    );
  }

  // If not video link
  return <MarkdownViewer markdownText={announcement} />;
}
