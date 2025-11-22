// /utils/tagConverter.ts
import { emojis } from '@/emojis';

// CSS
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

/* ---------- forward  ---------- */
const emojiRegex = /(?<![a-zA-Z0-9]):([^:]+):(?![a-zA-Z0-9])/g; // :code:
const discordTimestampRegex = /<time[^>]+data-timestamp=['"]([^'"]+)['"][^>]*><\/time>/g; // <time data-timestamp='1716537600'>
const userTagRegex = /<tag[^>]+data-tag=['"](.+?)(-(\d+))?(-(\w+))?['"][^>]*><\/tag>/g; // <tag data-tag='name-level-gender'> // level and gender are optional
const ytRegex = /<yt[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/yt>/g; // <yt data-yt='dQw4w9WgXcQ'>
const twitchRegex = /<tw[^>]+data-tw=['"]([^'"]+)['"][^>]*><\/tw>/g; // <tw data-tw='dQw4w9WgXcQ'>
const kickRegex = /<kick[^>]+data-kick=['"]([^'"]+)['"][^>]*><\/kick>/g; // <kick data-kick='dQw4w9WgXcQ'>

/* ---------- reverse ---------- */
const emojiBackRegex = /<img[^>]+data-emoji=['"]([^'"]+)['"][^>]*>/g;
const userTagBackRegex = /<span[^>]+data-name=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/span><\/span>/g;
const ytBackRegex = /<iframe[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const twitchBackRegex = /<iframe[^>]+data-twitch=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const kickBackRegex = /<iframe[^>]+data-kick=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const pTagRegex = /<p><\/p>/g;

export function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return str as string;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(^|\n)&gt;\s/g, '$1> ');
}

export const fromTags = (raw: string) => {
  return raw
    .replace(emojiRegex, (_, code) => {
      const emoji = emojis.find((e) => e.code === code);
      if (!emoji) return code;
      return `<img data-emoji='${code}' class='${markdown['emoji']}' alt=':${code}:' src='${emoji.path}'/>`;
    })
    .replace(discordTimestampRegex, (_, timestamp) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    })
    .replace(userTagRegex, (_, name, _level, level = '2', _gender, gender = 'Male') => {
      return `<span data-name='${name}'><span class='${markdown['user-icon']} ${permission[gender]} ${permission[`lv-${level}`]}'></span><span class='${markdown['user-name']}'>${name}</span></span>`;
    })
    .replace(ytRegex, (_, videoId) => {
      return `<iframe data-yt='${videoId}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.youtube.com/embed/${videoId}?autoplay=1"></iframe>`;
    })
    .replace(twitchRegex, (_, channel) => {
      return `<iframe data-twitch='${channel}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.twitch.tv/?channel=${channel}&autoplay=true&parent=localhost"></iframe>`;
    })
    .replace(kickRegex, (_, username) => {
      return `<iframe data-kick='${username}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.kick.com/${username}"></iframe>`;
    });
};

export const toTags = (raw: string) => {
  return raw
    .replace(emojiBackRegex, (_: string, code: string) => {
      return `:${escapeHtml(code)}:`;
    })
    .replace(discordTimestampRegex, (_, timestamp) => {
      return `<time data-timestamp='${escapeHtml(timestamp)}'></time>`;
    })
    .replace(userTagBackRegex, (_: string, name: string, _level: string, level: string = '2', _gender: string, gender: string = 'Male') => {
      return `<tag data-tag='${escapeHtml(name)}-${escapeHtml(level)}-${escapeHtml(gender)}'></tag>`;
    })
    .replace(ytBackRegex, (_: string, videoId: string) => {
      return `<yt data-yt='${escapeHtml(videoId)}'></yt>`;
    })
    .replace(twitchBackRegex, (_: string, channel: string) => {
      return `<tw data-tw='${escapeHtml(channel)}'></tw>`;
    })
    .replace(kickBackRegex, (_: string, username: string) => {
      return `<kick data-kick='${escapeHtml(username)}'></kick>`;
    })
    .replace(pTagRegex, '');
};
