// extensions/YouTubeNode.ts
import { Node } from '@tiptap/core';

// CSS
import markdown from '@/styles/markdown.module.css';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      insertYouTube: (id: string) => ReturnType;
    };
  }
}

export const YouTubeNode = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,

  addAttributes() {
    return { videoId: {} };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[data-youtube]',
        getAttrs: (el) => ({
          videoId: (el as HTMLElement).dataset.youtube,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'iframe',
      {
        'src': `https://www.youtube.com/embed/${node.attrs.videoId}?autoplay=1`,
        'data-youtube': node.attrs.videoId,
        'allowfullscreen': 'true',
        'class': `${markdown['youtube-video']}`,
      },
    ];
  },

  addCommands() {
    return {
      insertYouTube:
        (id) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { videoId: id } })
            .run(),
    };
  },
});
