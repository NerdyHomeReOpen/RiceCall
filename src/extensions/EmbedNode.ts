import { Node } from '@tiptap/core';

import markdownStyles from '@/styles/markdown.module.css';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    yt: {
      insertYouTube: (videoId: string) => ReturnType;
    };
    tw: {
      insertTwitch: (channel: string) => ReturnType;
    };
    kick: {
      insertKick: (username: string) => ReturnType;
    };
  }
}

export const YouTubeNode = Node.create({
  name: 'yt',
  group: 'block',
  atom: true,

  addAttributes() {
    return { videoId: {} };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[data-yt]',
        getAttrs: (el) => ({
          videoId: (el as HTMLElement).dataset.yt,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'iframe',
      {
        'src': `https://www.youtube.com/embed/${node.attrs.videoId}`,
        'data-yt': node.attrs.videoId,
        'allowfullscreen': 'true',
        'class': `${markdownStyles['embed-video']}`,
      },
    ];
  },

  addCommands() {
    return {
      insertYouTube:
        (videoId) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { videoId: videoId } })
            .run(),
    };
  },
});

export const TwitchNode = Node.create({
  name: 'tw',
  group: 'block',
  atom: true,

  addAttributes() {
    return { channel: {} };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[data-tw]',
        getAttrs: (el) => ({
          channel: (el as HTMLElement).dataset.tw,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'iframe',
      {
        'src': `https://player.twitch.tv/?channel=${node.attrs.channel}&autoplay=true&parent=localhost`,
        'data-tw': node.attrs.channel,
        'allowfullscreen': 'true',
        'class': `${markdownStyles['embed-video']}`,
      },
    ];
  },

  addCommands() {
    return {
      insertTwitch:
        (channel) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { channel: channel } })
            .run(),
    };
  },
});

export const KickNode = Node.create({
  name: 'kick',
  group: 'block',
  atom: true,

  addAttributes() {
    return { username: {} };
  },

  renderHTML({ node }) {
    return [
      'iframe',
      {
        'src': `https://player.kick.com/${node.attrs.username}`,
        'data-kick': node.attrs.username,
        'allowfullscreen': 'true',
        'class': `${markdownStyles['embed-video']}`,
      },
    ];
  },

  addCommands() {
    return {
      insertKick:
        (username) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { username: username } })
            .run(),
    };
  },
});
