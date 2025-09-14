// /utils/tagConverter.ts
import { emojis } from '@/emojis';

// CSS
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

/* ---------- forward  ---------- */
const emojiRegex = /\[emoji=(.+?)]/g; // [emoji=code]
const userIconRegex = /\[icon=(.+?)]/g; // [icon=gender-level]
const userTagRegex = /\[tag=(.+?)]/g; // [tag=name]
const embedRegex = /\[embed=(.+?)]/g; // [embed=https://www.youtube.com/embed/dQw4w9WgXcQ]
const discordTimestampRegex = /&lt;t:(\d+):[A-Z]&gt;/g; // <t:timestamp:F>

/* ---------- reverse ---------- */
const emojiBackRegex = /<img[^>]+data-emoji=['"]([^'"]+)['"][^>]*>/g;
const userIconBackRegex = /<span[^>]+data-icon=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/span>/g;
const userTagBackRegex = /<span[^>]+data-name=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/span>/g;
const embedBackRegex = /<iframe[^>]+data-embed=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const pTagRegex = /<p><\/p>/g;

export const fromTags = (raw: string) =>
  raw
    // Emoji
    .replace(emojiRegex, (_, code) => {
      const emoji = emojis.find((e) => e.code === code);
      if (!emoji) return code;
      return `<img data-emoji='${code}' class='${markdown['emoji']}' alt='[emoji=${code}]' src='${emoji.path}'/>`;
    })
    // User Tag
    .replace(userIconRegex, (_, icon) => {
      const [gender, level] = icon.split('-');
      return `<span data-icon='${icon}' class='${markdown['user-icon']} ${permission[gender || 'Male']} ${permission[`lv-${level || '1'}`]}'></span>`;
    })
    .replace(userTagRegex, (_, tag) => {
      return `<span data-name='${tag}' class='${markdown['user-name']}'>${tag}</span>`;
    })
    // Embed
    .replace(embedRegex, (_, src) => {
      return `<iframe data-embed='${src}' class='${markdown['embed-video']}' src="${src}"></iframe>`;
    })
    // Discord Timestamp
    .replace(discordTimestampRegex, (_, timestamp) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    });

export const toTags = (html: string) => {
  return html.replace(emojiBackRegex, '[emoji=$1]').replace(embedBackRegex, '[embed=$1]').replace(userIconBackRegex, '[icon=$1]').replace(userTagBackRegex, '[tag=$1]').replace(pTagRegex, '');
};
