import { Node } from '@tiptap/core';

// CSS
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    userTag: {
      insertUserTag: (attrs: Record<string, string>) => ReturnType;
    };
  }
}

export const UserTag = Node.create({
  name: 'userTag',
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
        'data-name': node.attrs.name,
      },

      [
        'span',
        {
          class: `${markdown['user-icon']} ${permission['Male']} ${permission['lv-2']}`,
        },
        '',
      ],

      [
        'span',
        {
          class: markdown['user-name'],
        },
        node.attrs.name,
      ],
    ];
  },

  addCommands() {
    return {
      insertUserTag:
        (attrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});
