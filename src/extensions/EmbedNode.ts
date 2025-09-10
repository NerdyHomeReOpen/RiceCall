// extensions/YouTubeNode.ts
import { Node } from '@tiptap/core';

// CSS
import markdown from '@/styles/markdown.module.css';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      insertEmbed: (src: string) => ReturnType;
    };
  }
}

export const EmbedNode = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,

  addAttributes() {
    return { src: {} };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[data-embed]',
        getAttrs: (el) => ({
          src: (el as HTMLElement).dataset.embed,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'iframe',
      {
        'src': node.attrs.src,
        'data-embed': node.attrs.src,
        'allowfullscreen': 'true',
        'class': `${markdown['embed-video']}`,
      },
    ];
  },

  addCommands() {
    return {
      insertEmbed:
        (src) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { src: src } })
            .run(),
    };
  },
});
