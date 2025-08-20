// /utils/tagConverter.ts
import { emojis } from '@/emojis';

// CSS
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

/* ---------- forward  ---------- */
const emojiRegex = /\[emoji=(.+?)]/g; // [emoji=code]
const userIconRegex = /\[icon=(.+?)]/g; // [icon=gender-level]
const userTagRegex = /\[tag=(.+?)]/g; // [tag=name]
const ytRegex = /\[YT=(.+?)]/g; // [YT=https://www.youtube.com/watch?v=dQw4w9WgXcQ]

/* ---------- reverse ---------- */
const emojiBackRegex = /<img[^>]+data-emoji=['"]([^'"]+)['"][^>]*>/g;
const userIconBackRegex = /<span[^>]+data-icon=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/span>/g;
const userTagBackRegex = /<span[^>]+data-name=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/span>/g;
const ytBackRegex = /<iframe[^>]+data-youtube=['"]([^'"]+)['"][^>]*><\/iframe>/g;

export const fromTags = (raw: string) =>
  raw
    // Emoji
    .replace(emojiRegex, (_, code) => {
      const emoji = emojis.find((e) => e.code === code);
      if (!emoji) return code;
      return `<img data-emoji='${code}' class='${markdown['emoji']}' src='${emoji.path}'/>`;
    })
    // User Tag
    .replace(userIconRegex, (_, icon) => {
      const [gender, level] = icon.split('-');
      return `<span data-icon='${icon}' class='${markdown['user-icon']} ${permission[gender || 'Male']} ${permission[`lv-${level || '1'}`]}'></span>`;
    })
    .replace(userTagRegex, (_, tag) => {
      return `<span data-name='${tag}' class='${markdown['user-name']}'>${tag}</span>`;
    })
    // YouTube
    .replace(ytRegex, (_, videoId) => {
      return `<iframe data-youtube='${videoId}' class='${markdown['youtube-video']}' src="https://www.youtube.com/embed/${videoId}?autoplay=1" allowfullscreen="true"></iframe>`;
    });

export const toTags = (html: string) => {
  return html.replace(emojiBackRegex, '[emoji=$1]').replace(ytBackRegex, '[YT=$1]').replace(userIconBackRegex, '[icon=$1]').replace(userTagBackRegex, '[tag=$1]');
};
