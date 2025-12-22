/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';

import { useImageViewer } from '@/providers/ImageViewer';

import { fromTags } from '@/utils/tagConverter';

import 'highlight.js/styles/github.css';
import markdown from '@/styles/markdown.module.css';

// DOMPurify
const ALLOWED_TAGS = [
  'span',
  'img',
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'u',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
  'strong',
  'em',
  'code',
  'pre',
  'yt',
  'tw',
  'kick',
  'tag',
  'time',
];
const ALLOWED_ATTR: string[] = [
  'id',
  'src',
  'alt',
  'class',
  'href',
  'controls',
  'width',
  'height',
  'allowfullscreen',
  'loading',
  'type',
  'style',
  'data-yt',
  'data-tw',
  'data-kick',
  'data-tag',
  'data-timestamp',
];

interface MarkdownContentProps {
  markdownText: string;
  selectable?: boolean;
  imageSize?: 'small' | 'medium' | 'big';
}

const MarkdownContent: React.FC<MarkdownContentProps> = React.memo(({ markdownText, selectable = true, imageSize = 'small' }) => {
  // Hooks
  const { selectImage } = useImageViewer();

  const components: Components = {
    div: ({ ...props }: any) => <div {...props} />,
    span: ({ ...props }: any) => <span {...props} />,
    h1: ({ ...props }: any) => <h1 {...props} />,
    h2: ({ ...props }: any) => <h2 {...props} />,
    h3: ({ ...props }: any) => <h3 {...props} />,
    p: ({ ...props }: any) => <p {...props} />,
    ul: ({ ...props }: any) => <ul {...props} />,
    ol: ({ ...props }: any) => <ol {...props} />,
    li: ({ ...props }: any) => <li {...props} />,
    blockquote: ({ ...props }: any) => <blockquote {...props} />,
    a: ({ href, ...props }: any) => <a target="_blank" href={href} {...props} />,
    table: ({ ...props }: any) => <table className={markdown['table-wrapper']} {...props} />,
    th: ({ ...props }: any) => <th {...props} />,
    td: ({ ...props }: any) => <td {...props} />,
    hr: ({ ...props }: any) => <hr {...props} />,
    img: ({ alt, src, ...props }: any) => <img loading="lazy" alt={alt} src={src} {...props} onClick={() => selectImage(src)} />,
    code: ({ children, ...props }: any) => <code {...props}>{children}</code>,
    pre: ({ ...props }: any) => <pre {...props} />,
  };

  // Variables
  // Parse <@username-level-gender> to <tag data-tag='username-level-gender'></tag> and <t:timestamp:format> to <time data-timestamp='timestamp'></time>
  const parsed = markdownText.replace(/<@([^>]+)-([^>]+)-([^>]+)>/g, '<tag data-tag="$1-$2-$3"></tag>').replace(/<t:(\d+):(.*?)>/g, '<time data-timestamp="$1"></time>');
  const sanitized = useMemo(() => DOMPurify.sanitize(parsed, { ALLOWED_TAGS, ALLOWED_ATTR }), [parsed]);
  const converted = useMemo(() => fromTags(sanitized), [sanitized]);

  return (
    <div className={`${markdown['markdown-content']} ${markdown[`image-size-${imageSize}`]}`} style={{ userSelect: selectable ? 'text' : 'none' }}>
      <ReactMarkdown remarkPlugins={[]} rehypePlugins={[rehypeRaw, rehypeHighlight]} components={components} skipHtml={false} unwrapDisallowed={false}>
        {converted}
      </ReactMarkdown>
    </div>
  );
});

MarkdownContent.displayName = 'MarkdownContent';

export default MarkdownContent;
