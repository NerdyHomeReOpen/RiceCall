'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import FontSize from '@tiptap/extension-font-size';
import { TextStyle } from '@tiptap/extension-text-style';
import { t } from 'i18next';
import { useEffect } from 'react';

interface EditorProps {
  content?: string;
  onChange?: (html: string) => void;
}

export default function Editor({ content = '', onChange }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontSize.configure({
        types: ['textStyle'],
      }),
    ],
    immediatelyRender: true,
    content: content,
  });  

  if (!editor) return;

  const fontSizes = ['12px', '14px', '16px', '18px', '24px', '32px'];
  const colors = ['black', 'red', 'green', 'blue', 'orange', 'purple'];

  const setFontSize = (size: string) => {
    editor?.chain().focus().setFontSize(size).run();
  };

  const setColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
  };

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

   useEffect(() => {
    if (!editor || !onChange) return;

    editor.on('update', () => {
      const html = editor.getHTML();
      onChange(html);
    });
  }, [editor, onChange]);

 return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          style={{
            fontWeight: 'bold',
            marginRight: 5,
            backgroundColor: editor.isActive('bold') ? '#333' : '#eee',
            color: editor.isActive('bold') ? 'white' : 'black',
            border: 'none',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
          aria-label="Negrita"
        >
          B
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          style={{
            textDecoration: 'underline',
            marginRight: 5,
            backgroundColor: editor.isActive('underline') ? '#333' : '#eee',
            color: editor.isActive('underline') ? 'white' : 'black',
            border: 'none',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
          aria-label="Subrayado"
        >
          U
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          style={{
            textDecoration: 'line-through',
            marginRight: 5,
            backgroundColor: editor.isActive('strike') ? '#333' : '#eee',
            color: editor.isActive('strike') ? 'white' : 'black',
            border: 'none',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
          aria-label="Tachado"
        >
          S
        </button>
      </div>

      <div style={{ marginBottom: 10 }}>
        <span> {t('font-size')}</span>
        {fontSizes.map((size) => (
          <button
            key={size}
            onClick={() => setFontSize(size)}
            style={{
              marginRight: 5,
              padding: '4px 8px',
              cursor: 'pointer',
              backgroundColor: editor.getAttributes('textStyle').fontSize === size ? '#333' : '#eee',
              color: editor.getAttributes('textStyle').fontSize === size ? 'white' : 'black',
              border: 'none',
            }}
            aria-label={`Tamaño ${size}`}
          >
            {size}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 10 }}>
        <span>{t('font-color')}</span>
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setColor(color)}
            style={{
              backgroundColor: color,
              width: 24,
              height: 24,
              marginRight: 5,
              border: editor.getAttributes('textStyle').color === color ? '2px solid #333' : 'none',
              cursor: 'pointer',
            }}
            aria-label={`Color ${color}`}
          />
        ))}
      </div>

      <EditorContent
        editor={editor}
        style={{
          border: '1px solid #ccc',
          height: 240,
          padding: 10,
          backgroundColor: 'white',
          overflowY: 'auto',
        }}
      />
    </div>
  );
}
