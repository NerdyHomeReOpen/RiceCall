import { Extension } from '@tiptap/react';
import { splitBlock } from 'prosemirror-commands';

export const ChatEnter = Extension.create({
  name: 'chatEnter',

  addOptions() {
    return {
      onSend: null as null | ((msg: string) => void),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Shift-Enter': ({ editor }) => {
        return splitBlock(editor.state, editor.view.dispatch);
      },

      'Enter': ({ editor }) => {
        return true;
      },
    };
  },
});
