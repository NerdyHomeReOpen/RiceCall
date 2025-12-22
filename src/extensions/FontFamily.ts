import { Mark } from '@tiptap/core';

export const FontFamily = Mark.create({
  name: 'fontFamily',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (el) => el.style.fontFamily || null,
        renderHTML: (attrs) => (attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {}),
      },
    };
  },

  addCommands() {
    return {
      setFontFamily:
        (family) =>
        ({ chain }) =>
          chain().setMark('textStyle', { 'font-family': family }).run(),

      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain().updateAttributes('textStyle', { 'font-family': null }).run(),
    };
  },
});
