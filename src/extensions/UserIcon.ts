import { Node } from '@tiptap/core';

// CSS
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    userIcon: {
      insertUserIcon: (attrs: Record<string, string>) => ReturnType;
    };
  }
}

export const UserIcon = Node.create({
  name: 'userIcon',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      gender: { default: 'Male' },
      level: { default: '1' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-icon]',
        getAttrs: (el) => ({
          gender: (el as HTMLElement).dataset.icon?.split('-')[0],
          level: (el as HTMLElement).dataset.icon?.split('-')[1],
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'span',
      {
        'data-icon': `${node.attrs.gender}-${node.attrs.level}`,
        'class': `${markdown['user-icon']} ${permission[node.attrs.gender]} ${permission[`lv-${node.attrs.level}`]}`,
      },
    ];
  },

  addCommands() {
    return {
      insertUserIcon:
        (attrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).run(),
    };
  },
});
