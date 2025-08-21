/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import hljs from 'highlight.js';

// CSS
import 'highlight.js/styles/github.css';
import markdown from '@/styles/markdown.module.css';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { fromTags } from '@/utils/tagConverter';

interface MarkdownContentProps {
  markdownText: string;
  escapeHtml?: boolean;
}

const MarkdownContent: React.FC<MarkdownContentProps> = React.memo(({ markdownText, escapeHtml = true }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [isCopied, setIsCopied] = useState(false);

  const components: Components = {
    div: ({ node, className, ...props }: any) => <div className={className} {...props} />,
    span: ({ node, ...props }: any) => <span {...props} />,
    h1: ({ node, ...props }: any) => <h1 {...props} />,
    h2: ({ node, ...props }: any) => <h2 {...props} />,
    h3: ({ node, ...props }: any) => <h3 {...props} />,
    p: ({ node, ...props }: any) => <p {...props} />,
    ul: ({ node, ...props }: any) => <ul {...props} />,
    ol: ({ node, ...props }: any) => <ol {...props} />,
    li: ({ node, ...props }: any) => <li {...props} />,
    blockquote: ({ node, ...props }: any) => <blockquote {...props} />,
    a: ({ node, href, ...props }: any) => <a target="_blank" href={href} {...props} />,
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

  if (escapeHtml) {
    markdownText = markdownText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const sanitized = fromTags(markdownText);

  return (
    <div className={markdown['markdown-content']}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components} skipHtml={false} unwrapDisallowed={false}>
        {sanitized}
      </ReactMarkdown>
    </div>
  );
});

MarkdownContent.displayName = 'MarkdownContent';

export default MarkdownContent;
