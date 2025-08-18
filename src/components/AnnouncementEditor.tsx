import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import { Palette } from 'lucide-react';
import MarkdownViewer from '@/components/MarkdownViewer';
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import markdown from '@/styles/markdown.module.css';
import { useTranslation } from 'react-i18next';

interface Props {
  announcement: string;
  onChange: (value: string) => void;
}

const AnnouncementEditor: React.FC<Props> = ({ announcement, onChange }) => {
  const { t } = useTranslation();

  const [showPreview, setShowPreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const applyFormat = (type: string, value?: string) => {
    const textarea = document.getElementById('announcement-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = announcement.substring(start, end) || t('your-text-here');

    let formatted = '';
    switch (type) {
      case 'bold': formatted = `**${selectedText}**`; break;
      case 'italic': formatted = `*${selectedText}*`; break;
      case 'underline': formatted = `<u>${selectedText}</u>`; break;
      case 'color': formatted = `<span style="color:${value}">${selectedText}</span>`; break;
      case 'font-family': formatted = `<span style="font-family:${value}">${selectedText}</span>`; break;
      case 'font-size': formatted = `<span style="font-size:${value}">${selectedText}</span>`; break;
      case 'link': if (!value) return; formatted = `<a href="${value}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`; break;
      case 'align-left': formatted = `<div class="align-left">${selectedText}</div>`; break;
      case 'align-center': formatted = `<div class="align-center">${selectedText}</div>`; break;
      case 'align-right': formatted = `<div class="align-right">${selectedText}</div>`; break;
      case 'emoji': formatted = `[emoji_${selectedText}]`; break;
      case 'user': formatted = `<@${selectedText}_Male_1>`; break;
      case 'yt': formatted = `<YT=https://www.youtube.com/watch?v=${selectedText}>`; break;
      default: formatted = selectedText;
    }

    const newText = announcement.substring(0, start) + formatted + announcement.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start;
      textarea.selectionEnd = start + formatted.length;
    }, 0);
  };

  return (
    <div className={popup['col']}>
      {/* Header */}
      <div className={`${popup['input-box']} ${setting['header-bar']} ${popup['row']}`}>
        <div className={popup['label']}>{t('input-announcement')}</div>
        <div className={popup['button']} onClick={() => setShowPreview(prev => !prev)}>
          {showPreview ? t('edit') : t('preview')}
        </div>
      </div>

      {/* Toolbar */}
      {!showPreview && (
        <div className={setting['toolbar']}>
          <select onChange={(e) => applyFormat('font-family', e.target.value)} defaultValue="">
            <option value="" disabled>{t('font')}</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Georgia">Georgia</option>
          </select>
          <select onChange={(e) => applyFormat('font-size', e.target.value)} defaultValue="">
            <option value="" disabled>{t('font-size')}</option>
            <option value="8px">8px</option>
            <option value="10px">10px</option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
          </select>
          <button type="button" onClick={() => applyFormat('align-left')}>⯇</button>
          <button type="button" onClick={() => applyFormat('align-center')}>≡</button>
          <button type="button" onClick={() => applyFormat('align-right')}>▶</button>
          <button type="button" onClick={() => applyFormat('bold')}>B</button>
          <button type="button" onClick={() => applyFormat('italic')}>I</button>
          <button type="button" onClick={() => applyFormat('underline')}>U̲</button>
          <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} title="Color de texto">
            <Palette size={18} />
          </button>
          {showColorPicker && (
            <div style={{ position: 'absolute', zIndex: 10 }}>
              <SketchPicker
                color={selectedColor}
                onChange={(color: any) => setSelectedColor(color.hex)}
                onChangeComplete={(color: any) => {
                  applyFormat('color', color.hex);
                  setShowColorPicker(false);
                }}
              />
            </div>
          )}
          <button type="button" onClick={() => applyFormat('emoji')}>😊</button>
          <button type="button" onClick={() => applyFormat('user')}>@User</button>
          <button type="button" onClick={() => applyFormat('yt')}>▶ YT</button>
          <button type="button" onClick={() => setShowLinkInput(prev => !prev)} title={t('insert-link')}>🌍</button>
          {showLinkInput && (
            <div style={{ position: 'absolute', zIndex: 20, background: 'white', padding: '8px', borderRadius: '6px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <input type="text" placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} style={{ marginRight: '6px', padding: '4px' }} />
              <button type="button" onClick={() => { if (linkUrl.trim()) applyFormat('link', linkUrl.trim()); setShowLinkInput(false); setLinkUrl(''); }}>
                {t('insert')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor / Preview */}
      <div className={`${popup['input-box']} ${popup['col']}`}>
        {showPreview ? (
          <div className={markdown['setting-markdown-container']} style={{ minHeight: '330px' }}>
            <MarkdownViewer markdownText={announcement} />
          </div>
        ) : (
          <textarea
            id="announcement-textarea"
            name="channel-announcement"
            style={{ minHeight: '330px' }}
            value={announcement}
            maxLength={1000}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        <div className={setting['note-text']}>{t('markdown-support-description')}</div>
      </div>
    </div>
  );
};

export default AnnouncementEditor;
