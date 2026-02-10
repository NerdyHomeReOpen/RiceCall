/* eslint-disable @next/next/no-img-element */
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';

import ActionLink from '@/components/ActionLink';

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
  'customlink',
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
    div: ({ ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
    span: ({ ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props} />,
    h1: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props} />,
    h2: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 {...props} />,
    h3: ({ ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 {...props} />,
    p: ({ ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props} />,
    ul: ({ ...props }: React.HTMLAttributes<HTMLUListElement>) => <ul {...props} />,
    ol: ({ ...props }: React.HTMLAttributes<HTMLOListElement>) => <ol {...props} />,
    li: ({ ...props }: React.HTMLAttributes<HTMLLIElement>) => <li {...props} />,
    blockquote: ({ ...props }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => <blockquote {...props} />,
    a: ({ ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      if (!props.href) return <a {...props} target="_blank" rel="noreferrer" />;
      const isInvitelink = /^https?:\/\/ricecall(\.com|\.com\.tw)\/join(?:\?|$)/.test(props.href);
      if (!isInvitelink) return <a {...props} target="_blank" rel="noreferrer" />;
      return <ActionLink href={props.href} />;
    },
    table: ({ ...props }: React.TableHTMLAttributes<HTMLTableElement>) => <table className={markdown['table-wrapper']} {...props} />,
    th: ({ ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => <th {...props} />,
    td: ({ ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td {...props} />,
    hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => <hr {...props} />,
    img: ({ alt, src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img
        loading="lazy"
        alt={alt}
        src={src}
        {...props}
        onClick={() => {
          if (typeof src !== 'string') return;
          selectImage(src);
        }}
      />
    ),
    code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => <code {...props}>{children}</code>,
    pre: ({ ...props }: React.HTMLAttributes<HTMLPreElement>) => <pre {...props} />,
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
