import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// CSS
import messageInputBox from '@/styles/messageInputBox.module.css';

// Providers
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '@/providers/ContextMenu';

// Styles
import emoji from '@/styles/emoji.module.css';

// Services
import api from '@/services/api.service';

// Utils
import { handleOpenAlertDialog } from '@/utils/popup';
import { fromTags, toTags } from '@/utils/tagConverter';

interface MessageInputBoxProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const MessageInputBox: React.FC<MessageInputBoxProps> = React.memo(({ onSend, disabled = false, placeholder = '', maxLength = 2000 }) => {
  // Hooks
  const { t } = useTranslation();
  const contextMenu = useContextMenu();

  // Refs
  const isUploadingRef = useRef<boolean>(false);
  const isComposingRef = useRef<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [contentHtml, setContentHtml] = useState<string>('');

  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('small');
  const [textColor, setTextColor] = useState<string>('#000000');

  useEffect(() => {
    const savedFontSize = localStorage.getItem('messageInputBox-fontSize') as 'small' | 'medium' | 'large';
    const savedTextColor = localStorage.getItem('messageInputBox-textColor');

    if (savedFontSize) setFontSize(savedFontSize);
    if (savedTextColor) setTextColor(savedTextColor);
  }, []);

  const updateFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    localStorage.setItem('messageInputBox-fontSize', size);
  }, []);

  const updateTextColor = useCallback((color: string) => {
    setTextColor(color);
    localStorage.setItem('messageInputBox-textColor', color);
  }, []);

  // Handlers
  const handlePaste = async (imageData: string, fileName: string) => {
    isUploadingRef.current = true;
    if (imageData.length > 5 * 1024 * 1024) {
      handleOpenAlertDialog(t('image-too-large', { '0': '5MB' }), () => {});
      isUploadingRef.current = false;
      return;
    }
    const formData = new FormData();
    formData.append('_type', 'message');
    formData.append('_fileName', `fileName-${Date.now()}`);
    formData.append('_file', imageData);
    const response = await api.post('/upload', formData);
    if (response) {
      editorRef.current?.focus();
      document.execCommand('insertText', false, `![${fileName}](${response.avatarUrl})`);
    }
    isUploadingRef.current = false;
  };

  const insertHtmlAtCaret = useCallback((html: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      editorRef.current?.appendChild(document.createTextNode(''));
      return;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const fragment = document.createDocumentFragment();
    let node: ChildNode | null;
    let lastNode: ChildNode | null = null;
    while ((node = temp.firstChild)) {
      lastNode = fragment.appendChild(node);
    }
    range.insertNode(fragment);
    if (lastNode) {
      const newRange = document.createRange();
      newRange.setStartAfter(lastNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }, []);

  const valueAsCode = useMemo(() => toTags(contentHtml || ''), [contentHtml]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    const handleInput = () => setContentHtml(el.innerHTML);
    el.addEventListener('input', handleInput);
    return () => {
      el.removeEventListener('input', handleInput);
    };
  }, []);

  return (
    <div className={`${messageInputBox['messageinput-box']} ${disabled ? messageInputBox['disabled'] : ''}`}>
      <div
        className={emoji['emoji-icon']}
        onMouseDown={(e) => {
          e.preventDefault();
          const x = e.currentTarget.getBoundingClientRect().left;
          const y = e.currentTarget.getBoundingClientRect().top;
          contextMenu.showEmojiPicker(
            x,
            y,
            'right-top',
            (_, full) => {
              editorRef.current?.focus();
              const html = fromTags(full);
              insertHtmlAtCaret(html);
              if (editorRef.current) setContentHtml(editorRef.current.innerHTML);
            },
            e.currentTarget as HTMLElement,
            true,
            false,
            fontSize,
            textColor,
            updateFontSize,
            updateTextColor,
          );
        }}
      />
      <div
        ref={editorRef}
        contentEditable={!disabled}
        role="textbox"
        aria-multiline="true"
        aria-label={t('message-input-box')}
        data-placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.shiftKey) return;
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (isComposingRef.current) return;
          if (disabled) return;
          let html = editorRef.current?.innerHTML || '';
          html = html.replace(/^(?:<br\s*\/>|<br>)+/gi, '').replace(/(?:<br\s*\/>|<br>)+$/gi, '');
          const value = toTags(html).trim();
          if (!value) return;
          if (value.length > maxLength) return;

          const styledValue = `<style data-font-size="${fontSize}" data-text-color="${textColor}">${value}</style>`;
          onSend?.(styledValue);
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
            setContentHtml('');
          }
        }}
        onPaste={(e) => {
          const items = e.clipboardData.items;
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              const file = item.getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => handlePaste(reader.result as string, file.name);
                reader.readAsDataURL(file);
              }
            }
          }
        }}
        onCompositionStart={() => (isComposingRef.current = true)}
        onCompositionEnd={() => (isComposingRef.current = false)}
        className={messageInputBox['contenteditable']}
        style={{
          outline: 'none',
          whiteSpace: 'pre-wrap',
          width: '100%',
          fontSize: fontSize === 'small' ? '14px' : fontSize === 'medium' ? '18px' : '25px',
          color: textColor,
        }}
        suppressContentEditableWarning
      />
      <div className={messageInputBox['message-input-length-text']}>
        {valueAsCode.length}/{maxLength}
      </div>
    </div>
  );
});

MessageInputBox.displayName = 'MessageInputBox';

export default MessageInputBox;
