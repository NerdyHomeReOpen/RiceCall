import { Node } from '@tiptap/core';

// CSS
import markdown from '@/styles/markdown.module.css';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    userName: {
      insertUserName: (attrs: Record<string, string>) => ReturnType;
    };
  }
}

export const UserName = Node.create({
  name: 'userName',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      name: { default: 'Unknown' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-name]',
        getAttrs: (el) => ({
          name: (el as HTMLElement).dataset.name,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'span',
      {
        'data-name': `${node.attrs.name}`,
        'class': `${markdown['user-name']}`,
      },
      node.attrs.name,
    ];
  },

  addCommands() {
    return {
      insertUserName:
        (attrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});
