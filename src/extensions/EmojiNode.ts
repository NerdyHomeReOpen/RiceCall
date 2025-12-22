import { Node } from '@tiptap/core';

import { emojis } from '@/emojis';

import markdownStyles from '@/styles/markdown.module.css';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    emoji: {
      insertEmoji: (attrs: Record<string, string>) => ReturnType;
    };
  }
}

export const EmojiNode = Node.create({
  name: 'emoji',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      code: { default: '' },
      src: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-emoji]',
        getAttrs: (el) => ({
          code: (el as HTMLElement).dataset.emoji,
          src: (el as HTMLImageElement).src,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'img',
      {
        'data-emoji': node.attrs.code,
        'src': emojis.find((e) => e.code === node.attrs.code)?.path,
        'class': `${markdownStyles['emoji']}`,
      },
    ];
  },

  addCommands() {
    return {
      insertEmoji:
        (attrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});
