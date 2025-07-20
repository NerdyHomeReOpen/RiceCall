/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import hljs from 'highlight.js';

// Components
import { Emoji, emojis } from '@/components/emojis';

// CSS
import 'highlight.js/styles/github.css';
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

// Providers
import { useTranslation } from 'react-i18next';

/**
 * 主處理函式
 * @param markdownText 要處理的 markdown 字串
 * @param emojis 表情符號列表
 * @param permission 權限列表
 * @returns 處理後的 HTML 字串
 */
export function sanitizeMarkdownWithSafeTags(markdownText: string, emojis: Emoji[], permission: Record<string, string>): string {
  const safeMarkdownText = typeof markdownText === 'string' ? markdownText : '';

  const escaped = safeMarkdownText.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const emojiRegex = /\[emoji_.+?\]/g;
  const userTagRegex = /(?:<|&lt;)@(.+?)(?:>|&gt;)/g;
  const ytTagRegex = /(?:<|&lt;)YT=(.+?)(?:>|&gt;)/g;

  const replaced = escaped
    // 替換 emoji
    .replace(emojiRegex, (match: string) => {
      const emoji = emojis.find((emoji) => emoji.char === match);
      if (!emoji) return match;
      return `<img class='${markdown['emoji']}' src='${emoji.path}' alt="${emoji.char}"/>`;
    })
    // 替換 <@name_gender_level>
    .replace(userTagRegex, (_, content) => {
      const [name, gender, level] = content.split('_');
      return `<span class='${markdown['user-tag']}' alt='<@${content}>'><span class='${permission[gender || 'Male']} ${permission[`lv-${level || '1'}`]}'></span>${name || 'Unknown'}</span>`;
    })
    // 替換 <YT=https://www.youtube.com/watch?v=dQw4w9WgXcQ>
    .replace(ytTagRegex, (_, content) => {
      const videoId = content.match(/v=([^&]+)/)?.[1];
      return `<iframe class='${markdown['youtube-video']}' src="https://www.youtube.com/embed/${videoId}?autoplay=1"></iframe>`;
    })
    // 處裡 <br> to \n
    .replace(/<br\s*\/?>/g, '\n');

  return replaced;
}

interface MarkdownViewerProps {
  markdownText: string;
  isGuest?: boolean;
  forbidGuestUrl?: boolean;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = React.memo(({ markdownText, isGuest = false, forbidGuestUrl = false }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [isCopied, setIsCopied] = useState(false);

  const components: Components = {
    div: ({ node, ...props }: any) => <div {...props} />,
    span: ({ node, ...props }: any) => <span {...props} />,
    h1: ({ node, ...props }: any) => <h1 {...props} />,
    h2: ({ node, ...props }: any) => <h2 {...props} />,
    h3: ({ node, ...props }: any) => <h3 {...props} />,
    p: ({ node, ...props }: any) => <p {...props} />,
    ul: ({ node, ...props }: any) => <ul {...props} />,
    ol: ({ node, ...props }: any) => <ol {...props} />,
    li: ({ node, ...props }: any) => <li {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote {...props} />,
    a: ({ node, href, ...props }: any) => {
      if (isGuest && forbidGuestUrl) return <span {...props} />;
      return <a target="_blank" href={href} {...props} />;
    },
    table: ({ node, ...props }: any) => <table className={markdown['table-wrapper']} {...props} />,
    th: ({ node, ...props }: any) => <th {...props} />,
    td: ({ node, ...props }: any) => <td {...props} />,
    hr: ({ node, ...props }: any) => <hr {...props} />,
    img: ({ node, alt, ...props }: any) => <img alt={alt} {...props} />,
    code: ({ node, className, children, ...props }: any) => {
      const language = className?.replace('language-', '') ?? '';
      const code = String(children).trim().replace(/&lt;/g, '<').replace(/&gt;/g, '>');

      const handleCopy = () => {
        navigator.clipboard.writeText(code.replace(/\n$/, ''));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      };

      if (!node.block) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      let highlightedHTML = '';
      let langClass = '';

      if (language && hljs.getLanguage(language)) {
        const result = hljs.highlight(code, { language: 'jsx' });
        highlightedHTML = result.value;
        langClass = `language-${language}`;
      } else {
        const result = hljs.highlightAuto(code);
        highlightedHTML = result.value;
        langClass = `language-${result.language}`;
      }

      return (
        <>
          <button className={markdown['copy-button']} onClick={handleCopy} aria-label={t('copy-code')}>
            {isCopied ? t('copied') : t('copy')}
          </button>
          <code className={`hljs ${langClass} ${markdown['code-wrapper']}`} dangerouslySetInnerHTML={{ __html: highlightedHTML }} {...props} />
        </>
      );
    },
    pre: ({ node, ...props }: any) => {
      node.children.forEach((child: any) => {
        if (child.tagName === 'code') {
          child.block = true;
        }
      });

      return <pre {...props} />;
    },
  };

  const sanitized = sanitizeMarkdownWithSafeTags(markdownText, emojis, permission);

  return (
    <div className={markdown['markdown-content']}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components} skipHtml={false} unwrapDisallowed={false}>
        {sanitized}
      </ReactMarkdown>
    </div>
  );
});

MarkdownViewer.displayName = 'MarkdownViewer';

export default MarkdownViewer;
