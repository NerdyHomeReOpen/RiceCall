import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { EmojiNode } from '@/extensions/EmojiNode';
import { YouTubeNode } from '@/extensions/YouTubeNode';
import { UserName } from '@/extensions/UserName';
import { UserIcon } from '@/extensions/UserIcon';
import { FontSize } from '@/extensions/FontSize';
import { FontFamily } from '@/extensions/FontFamily';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import markdown from '@/styles/markdown.module.css';

// Components
import MarkdownContent from '@/components/MarkdownContent';

// Providers
import { useContextMenu } from '@/providers/ContextMenu';
import { useTranslation } from 'react-i18next';

// Utils
import { fromTags, toTags } from '@/utils/tagConverter';

interface AnnouncementEditorProps {
  announcement: string;
  showPreview?: boolean;
  onChange: (value: string) => void;
}

const AnnouncementEditor: React.FC<AnnouncementEditorProps> = React.memo(({ announcement, showPreview = false, onChange }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();
  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color, TextAlign.configure({ types: ['paragraph', 'heading'] }), FontSize, FontFamily, EmojiNode, YouTubeNode, UserName, UserIcon],
    content: fromTags(announcement),
    onUpdate: ({ editor }) => onChange(toTags(editor.getHTML())),
    immediatelyRender: false,
  });

  // States
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isTextAlignLeft, setIsTextAlignLeft] = useState(false);
  const [isTextAlignCenter, setIsTextAlignCenter] = useState(false);
  const [isTextAlignRight, setIsTextAlignRight] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  // Handlers
  const syncStyles = useCallback(() => {
    setIsBold(editor?.isActive('bold') || false);
    setIsItalic(editor?.isActive('italic') || false);
    setIsUnderline(editor?.isActive('underline') || false);
    setIsTextAlignLeft(editor?.isActive({ textAlign: 'left' }) || false);
    setIsTextAlignCenter(editor?.isActive({ textAlign: 'center' }) || false);
    setIsTextAlignRight(editor?.isActive({ textAlign: 'right' }) || false);
  }, [editor]);

  // Effects
  useEffect(() => {
    editor?.on('selectionUpdate', syncStyles);
  }, [editor, syncStyles]);

  return (
    <div className={popup['input-box']}>
      {/* Editor / Preview */}
      {!showPreview ? (
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #ccc', height: '380px' }}>
          {/* Toolbar */}
          <div className={setting['toolbar']}>
            <div className={popup['select-box']}>
              <select onChange={(e) => editor?.chain().setMark('textStyle', { fontFamily: e.target.value }).focus().run()}>
                <option value="" disabled>
                  {t('font')}
                </option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
              </select>
            </div>
            <div className={popup['select-box']}>
              <select onChange={(e) => editor?.chain().setMark('textStyle', { fontSize: e.target.value }).focus().run()}>
                <option value="" disabled>
                  {t('font-size')}
                </option>
                {Array.from({ length: 17 }, (_, i) => (
                  <option key={i} value={`${i + 8}px`}>
                    {i + 8}px
                  </option>
                ))}
              </select>
            </div>
            <div
              className={`${setting['button']} ${isTextAlignLeft ? setting['active'] : ''}`}
              onClick={(e) => {
                e.preventDefault();
                editor?.chain().setTextAlign('left').focus().run();
                setIsTextAlignLeft(editor?.isActive({ textAlign: 'left' }) || false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path
                  fillRule="evenodd"
                  d="M2 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m0-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"
                />
              </svg>
            </div>
            <div
              className={`${setting['button']} ${isTextAlignCenter ? setting['active'] : ''}`}
              onClick={(e) => {
                e.preventDefault();
                editor?.chain().setTextAlign('center').focus().run();
                setIsTextAlignCenter(editor?.isActive({ textAlign: 'center' }) || false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path
                  fillRule="evenodd"
                  d="M4 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"
                />
              </svg>
            </div>
            <div
              className={`${setting['button']} ${isTextAlignRight ? setting['active'] : ''}`}
              onClick={(e) => {
                e.preventDefault();
                editor?.chain().setTextAlign('right').focus().run();
                setIsTextAlignRight(editor?.isActive({ textAlign: 'right' }) || false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path
                  fillRule="evenodd"
                  d="M6 12.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5m4-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-4-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"
                />
              </svg>
            </div>
            <div
              className={`${setting['button']} ${isBold ? setting['active'] : ''}`}
              onClick={(e) => {
                e.preventDefault();
                editor?.chain().toggleBold().focus().run();
                setIsBold(editor?.isActive('bold') || false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.21 13c2.106 0 3.412-1.087 3.412-2.823 0-1.306-.984-2.283-2.324-2.386v-.055a2.176 2.176 0 0 0 1.852-2.14c0-1.51-1.162-2.46-3.014-2.46H3.843V13zM5.908 4.674h1.696c.963 0 1.517.451 1.517 1.244 0 .834-.629 1.32-1.73 1.32H5.908V4.673zm0 6.788V8.598h1.73c1.217 0 1.88.492 1.88 1.415 0 .943-.643 1.449-1.832 1.449H5.907z" />
              </svg>
            </div>
            <div
              className={`${setting['button']} ${isItalic ? setting['active'] : ''}`}
              onClick={(e) => {
                e.preventDefault();
                editor?.chain().toggleItalic().focus().run();
                setIsItalic(editor?.isActive('italic') || false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.991 11.674 9.53 4.455c.123-.595.246-.71 1.347-.807l.11-.52H7.211l-.11.52c1.06.096 1.128.212 1.005.807L6.57 11.674c-.123.595-.246.71-1.346.806l-.11.52h3.774l.11-.52c-1.06-.095-1.129-.211-1.006-.806z" />
              </svg>
            </div>
            <div
              className={`${setting['button']} ${isUnderline ? setting['active'] : ''}`}
              onClick={(e) => {
                e.preventDefault();
                editor?.chain().toggleUnderline().focus().run();
                setIsUnderline(editor?.isActive('underline') || false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.313 3.136h-1.23V9.54c0 2.105 1.47 3.623 3.917 3.623s3.917-1.518 3.917-3.623V3.136h-1.23v6.323c0 1.49-.978 2.57-2.687 2.57s-2.687-1.08-2.687-2.57zM12.5 15h-9v-1h9z" />
              </svg>
            </div>
            <div
              className={setting['button']}
              onClick={(e) => {
                e.preventDefault();
                const x = e.currentTarget.getBoundingClientRect().left;
                const y = e.currentTarget.getBoundingClientRect().bottom;
                contextMenu.showColorPicker(x, y, 'right-bottom', (color) => {
                  editor?.chain().setColor(color).focus().run();
                });
              }}
            >
              <div style={{ backgroundColor: editor?.getAttributes('textStyle').color || '#FFFFFF', width: '16px', height: '16px', borderRadius: '2px' }} />
            </div>

            <div
              className={setting['button']}
              onClick={(e) => {
                e.preventDefault();
                const x = e.currentTarget.getBoundingClientRect().left;
                const y = e.currentTarget.getBoundingClientRect().bottom;
                contextMenu.showEmojiPicker(x, y, 'right-bottom', (code) => {
                  editor?.chain().insertEmoji({ code }).focus().run();
                });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
                <path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683M7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5m4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5" />
              </svg>
            </div>
            <div
              className={setting['button']}
              onClick={(e) => {
                e.preventDefault();
                editor?.chain().insertUserIcon({ gender: 'Male', level: '1' }).insertUserName({ name: 'Unknown' }).focus().run();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914" />
              </svg>
            </div>
            <div
              className={setting['button']}
              onClick={(e) => {
                e.preventDefault();
                const videoId = linkUrl.trim().split('v=')[1].split('&')[0];
                if (videoId && videoId.match(/^[\w-]+$/)) {
                  editor?.chain().insertYouTube(videoId).focus().run();
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z" />
              </svg>
            </div>
            <input type="text" placeholder="https://youtube.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} style={{ maxWidth: '150px' }} />
          </div>

          <EditorContent editor={editor} className={markdown['setting-markdown-container']} style={{ wordBreak: 'break-all' }} maxLength={1000} />
        </div>
      ) : (
        <div className={markdown['setting-markdown-container']} style={{ height: '380px' }}>
          <MarkdownContent markdownText={announcement} escapeHtml={false} />
        </div>
      )}
    </div>
  );
});

AnnouncementEditor.displayName = 'AnnouncementEditor';

export default AnnouncementEditor;
