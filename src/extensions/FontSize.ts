import { Mark } from '@tiptap/core';

export const FontSize = Mark.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (el) => el.style.fontSize || null,
        renderHTML: (attrs) => (attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {}),
      },
    };
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { 'font-size': size }).run(),

      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().updateAttributes('textStyle', { 'font-size': null }).run(),
    };
  },
});
