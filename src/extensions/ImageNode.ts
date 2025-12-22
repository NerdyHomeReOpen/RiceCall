import { Node } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      insertImage: (attrs: Record<string, string>) => ReturnType;
    };
  }
}

export const ImageNode = Node.create({
  name: 'image',
  group: 'block',
  atom: true,

  addAttributes() {
    return { src: {}, alt: {} };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-image]',
        getAttrs: (el) => ({
          src: (el as HTMLElement).dataset.image,
          alt: (el as HTMLElement).dataset.alt,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'img',
      {
        'src': node.attrs.src,
        'data-image': node.attrs.src,
        'alt': node.attrs.alt,
      },
    ];
  },

  addCommands() {
    return {
      insertImage:
        (attrs) =>
        ({ chain }) =>
          chain()
            .insertContent({ type: this.name, attrs: { src: attrs.src, alt: attrs.alt } })
            .run(),
    };
  },
});
