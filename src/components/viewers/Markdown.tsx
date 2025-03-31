/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';

// Componenets
import emojis from '@/components/emojis';

interface PurifyConfig {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  ALLOWED_URI_REGEXP: RegExp;
}

const PURIFY_CONFIG: PurifyConfig = {
  ALLOWED_TAGS: [
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
  ],
  ALLOWED_ATTR: ['src', 'alt', 'class', 'href'],
  ALLOWED_URI_REGEXP: /^\/smiles\//,
};

interface MarkdownProps {
  markdownText: string;
  isGuest?: boolean;
  forbidGuestUrl?: boolean;
}

const Markdown: React.FC<MarkdownProps> = React.memo(
  ({ markdownText, isGuest = false, forbidGuestUrl = false }) => {
    const safeMarkdownText =
      typeof markdownText === 'string' ? markdownText : '';
    const withEmojis = safeMarkdownText.replace(
      /\[emoji_(\d+)\]/g,
      (match: string, id: string) => {
        const emojiId = parseInt(id);
        if (!emojis.find((emoji) => emoji.id === emojiId)) return match;
        return `<img src="/smiles/${
          emojiId + 1
        }.gif" alt="[emoji_${id}]" class="inline-block w-5 h-5 align-text-bottom" />`;
      },
    );
    const sanitized = DOMPurify.sanitize(withEmojis, PURIFY_CONFIG);
    const components: Components = {
      h1: ({ node, ...props }: any) => (
        <h1 className="text-2xl font-bold mb-2 text-gray-900" {...props} />
      ),
      h2: ({ node, ...props }: any) => (
        <h2 className="text-xl font-bold mb-1 text-gray-800" {...props} />
      ),
      h3: ({ node, ...props }: any) => (
        <h3 className="text-lg font-bold text-gray-700" {...props} />
      ),
      p: ({ node, ...props }: any) => (
        <div className="leading-relaxed text-gray-600" {...props} />
      ),
      ul: ({ node, ...props }: any) => (
        <ul className="list-disc list-inside text-gray-600" {...props} />
      ),
      li: ({ node, ...props }: any) => (
        <li className="leading-normal" {...props} />
      ),
      ol: ({ node, ...props }: any) => (
        <ol className="list-decimal list-inside text-gray-600" {...props} />
      ),
      blockquote: ({ node, ...props }: any) => (
        <blockquote
          className="border-l-4 border-gray-300 pl-4 italic text-gray-600 overflow-x-auto"
          {...props}
        />
      ),
      a: ({ node, href, ...props }: any) => {
        if (isGuest && forbidGuestUrl) {
          return <span className="text-gray-400" {...props} />;
        }
        return (
          <a
            target="_blank"
            href={href}
            className="text-blue-600 hover:text-blue-800 underline transition duration-200"
            {...props}
          />
        );
      },
      table: ({ node, ...props }: any) => (
        <div className="overflow-x-auto mb-4 max-w-full">
          <table
            className="w-full border-collapse border border-gray-200"
            {...props}
          />
        </div>
      ),
      th: ({ node, ...props }: any) => (
        <th
          className="px-4 py-2 bg-gray-50 text-left text-sm font-semibold text-gray-600 border border-gray-200"
          {...props}
        />
      ),
      td: ({ node, ...props }: any) => (
        <td
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200"
          {...props}
        />
      ),
      hr: ({ node, ...props }: any) => (
        <hr className="my-6 border-t border-gray-200" {...props} />
      ),
    };

    return (
      <ReactMarkdown
        className="markdown-content whitespace-pre-wrap"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {sanitized}
      </ReactMarkdown>
    );
  },
);

Markdown.displayName = 'Markdown';

interface MarkdownViewerProps {
  markdownText: string;
  isGuest?: boolean;
  forbidGuestUrl?: boolean;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = React.memo(
  ({ markdownText, isGuest = false, forbidGuestUrl = false }) => {
    return (
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-full overflow-x-auto">
          <Markdown
            markdownText={markdownText}
            isGuest={isGuest}
            forbidGuestUrl={forbidGuestUrl}
          />
        </div>
      </div>
    );
  },
);

MarkdownViewer.displayName = 'MarkdownViewer';

export default MarkdownViewer;
