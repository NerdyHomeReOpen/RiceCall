/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Children, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

// Components
import { emojis } from '@/components/emojis';

// CSS
import 'highlight.js/styles/github.css';
import markdown from '@/styles/markdown.module.css';
import message from '@/styles/message.module.css';
import permission from '@/styles/permission.module.css';

// Providers
import { useLanguage } from '@/providers/Language';

interface PurifyConfig {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  ALLOWED_URI_REGEXP: RegExp;
}

const PURIFY_CONFIG: PurifyConfig = {
  ALLOWED_TAGS: [
    'div',
    'span',
    'img',
    'p',
    'h1',
    'h2',
    'h3',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
    'br',
    'strong',
    'em',
    'code',
    'pre',
    'video',
    'source',
    'audio',
    'iframe',
  ],
  ALLOWED_ATTR: [
    'id',
    'src',
    'alt',
    'class',
    'href',
    'controls',
    'width',
    'height',
    'allowfullscreen',
    'type',
    'style',
  ],
  ALLOWED_URI_REGEXP: /^(https?:\/\/)|^\/smiles\//,
};

interface MarkdownViewerProps {
  markdownText: string;
  isGuest?: boolean;
  forbidGuestUrl?: boolean;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = React.memo(
  ({ markdownText, isGuest = false, forbidGuestUrl = false }) => {
    const safeMarkdownText =
      typeof markdownText === 'string' ? markdownText : '';

    const processedLines = safeMarkdownText
      .replace(/\[emoji_[\w-]+\]/g, (match: string) => {
        const emoji = emojis.find((emoji) => emoji.char === match);
        if (!emoji) return match;
        return `<img id='${emoji.char}' src='${emoji.path}' alt="${emoji.char}" style="width: 19px; height: 19px;" />`;
      })
      .replace(/<@([^>]+)>/g, (_, content) => {
        const [name, gender, level] = content.split('_');
        return `<span class='${permission[gender || 'Male']} ${
          permission[`lv-${level || '1'}`]
        }'></span> <span class='${message.username}'>${
          name || 'Unknown'
        }</span>`;
      })
      .split('\n');

    // Hooks
    const lang = useLanguage();

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
      table: ({ node, ...props }: any) => (
        <div className={markdown.tableWrapper}>
          <table {...props} />
        </div>
      ),
      th: ({ node, ...props }: any) => <th {...props} />,
      td: ({ node, ...props }: any) => <td {...props} />,
      hr: ({ node, ...props }: any) => <hr {...props} />,
      img: ({ node, ...props }: any) => <img {...props} />,
      code: ({ node, className, children, ...props }: any) => {
        const language = className?.replace('language-', '') ?? '';
        const code = String(children).trim();

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
          const result = hljs.highlight(code, { language });
          highlightedHTML = result.value;
          langClass = `language-${language}`;
        } else {
          const result = hljs.highlightAuto(code);
          highlightedHTML = result.value;
          langClass = `language-${result.language}`;
        }

        return (
          <>
            <button
              className={markdown.copyButton}
              onClick={handleCopy}
              aria-label={lang.tr.copyCode}
            >
              {isCopied ? lang.tr.copied : lang.tr.copy}
            </button>
            <code
              className={`hljs ${langClass} ${markdown.codeWrapper}`}
              dangerouslySetInnerHTML={{ __html: highlightedHTML }}
              {...props}
            />
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

    return (
      <div className={markdown.markdownContent}>
        {processedLines.map((line, index) => {
          const sanitized = DOMPurify.sanitize(line, PURIFY_CONFIG);
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={components}
              skipHtml={false}
              unwrapDisallowed={false}
            >
              {sanitized}
            </ReactMarkdown>
          );
        })}
      </div>
    );
  },
);

MarkdownViewer.displayName = 'MarkdownViewer';

export default MarkdownViewer;
