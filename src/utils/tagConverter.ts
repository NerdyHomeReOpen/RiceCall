// /utils/tagConverter.ts
import { emojis } from '@/emojis';

// CSS
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

/* ---------- forward  ---------- */
const emojiRegex = /(?<![a-zA-Z0-9]):([^:]+):(?![a-zA-Z0-9])/g; // :code:
const userTagRegex = /<@(.+?)(-(\d+))?(-(\w+))?>/g; // <@name-level-gender> // level and gender are optional
const ytRegex = /<&YT&(.+?)>/g; // <&YT&dQw4w9WgXcQ>
const twitchRegex = /<&TW&(.+?)>/g; // <&TW&dQw4w9WgXcQ>
const kickRegex = /<&KICK&(.+?)>/g; // <&KICK&dQw4w9WgXcQ>
const discordTimestampRegex = /<t:(\d+):([A-Z])>/g; // <t:timestamp:F>

/* ---------- reverse ---------- */
const emojiBackRegex = /<img[^>]+data-emoji=['"]([^'"]+)['"][^>]*>/g;
const userTagBackRegex = /<span[^>]+data-name=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/span><\/span>/g;
const ytBackRegex = /<iframe[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const twitchBackRegex = /<iframe[^>]+data-twitch=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const kickBackRegex = /<iframe[^>]+data-kick=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const pTagRegex = /<p><\/p>/g;

export function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return str as string;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export const fromTags = (raw: string) =>
  raw
    // Discord Timestamp
    .replace(discordTimestampRegex, (_, timestamp) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    })
    // Emoji
    .replace(emojiRegex, (_, code) => {
      const emoji = emojis.find((e) => e.code === code);
      if (!emoji) return code;
      return `<img data-emoji='${code}' class='${markdown['emoji']}' alt=':${code}:' src='${emoji.path}'/>`;
    })
    // User Tag
    .replace(userTagRegex, (_, tag, _level, level = '2', _gender, gender = 'Male') => {
      return `<span data-name='${tag}'><span class='${markdown['user-icon']} ${permission[gender]} ${permission[`lv-${level}`]}'></span><span class='${markdown['user-name']}'>${tag}</span></span>`;
    })
    // YouTube
    .replace(ytRegex, (_, videoId) => {
      return `<iframe data-yt='${videoId}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.youtube.com/embed/${videoId}?autoplay=1"></iframe>`;
    })
    // Twitch
    .replace(twitchRegex, (_, channel) => {
      return `<iframe data-twitch='${channel}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.twitch.tv/?channel=${channel}&autoplay=true&parent=localhost"></iframe>`;
    })
    // Kick
    .replace(kickRegex, (_, username) => {
      return `<iframe data-kick='${username}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.kick.com/${username}"></iframe>`;
    });

export const toTags = (html: string) => {
  console.log(html);
  return html
    .replace(emojiBackRegex, (_, code) => {
      return `:${escapeHtml(code)}:`;
    })
    .replace(ytBackRegex, (_, videoId) => {
      return `<&YT&${escapeHtml(videoId)}>`;
    })
    .replace(twitchBackRegex, (_, channel) => {
      return `<&TW&${escapeHtml(channel)}>`;
    })
    .replace(kickBackRegex, (_, username) => {
      return `<&KICK&${escapeHtml(username)}>`;
    })
    .replace(userTagBackRegex, (_, tag) => {
      return `<@${escapeHtml(tag)}>`;
    })
    .replace(pTagRegex, '');
};
