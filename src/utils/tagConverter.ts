// /utils/tagConverter.ts
import { emojis } from '@/emojis';

// CSS
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

/* ---------- forward  ---------- */
const emojiRegex = /(?<![a-zA-Z0-9]):([^:]+):(?![a-zA-Z0-9])/g; // :code:
const discordTimestampRegex = /<t:(\d+):([A-Z])>/g; // <t:timestamp:F>
const userTagRegex = /<@(.+?)(-(\d+))?(-(\w+))?>/g; // <@name-level-gender> // level and gender are optional
const ytRegex = /<&YT&(.+?)>/g; // <&YT&dQw4w9WgXcQ>
const twitchRegex = /<&TW&(.+?)>/g; // <&TW&dQw4w9WgXcQ>
const kickRegex = /<&KICK&(.+?)>/g; // <&KICK&dQw4w9WgXcQ>

/* ---------- reverse ---------- */
const emojiBackRegex = /<img[^>]+data-emoji=['"]([^'"]+)['"][^>]*>/g;
const userTagBackRegex = /<span[^>]+data-name=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/span><\/span>/g;
const ytBackRegex = /<iframe[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const twitchBackRegex = /<iframe[^>]+data-twitch=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const kickBackRegex = /<iframe[^>]+data-kick=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const pTagRegex = /<p><\/p>/g;

/* ---------- preserve ---------- */
const discordTimestampPreserveRegex = /<time[^>]+data-timestamp=['"]([^'"]+)['"][^>]*><\/time>/g;
const userTagPreserveRegex = /<tag[^>]+data-tag=['"](.+?)(-(\d+))?(-(\w+))?['"][^>]*><\/tag>/g;
const ytPreserveRegex = /<yt[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/yt>/g;
const twitchPreserveRegex = /<tw[^>]+data-tw=['"]([^'"]+)['"][^>]*><\/tw>/g;
const kickPreserveRegex = /<kick[^>]+data-kick=['"]([^'"]+)['"][^>]*><\/kick>/g;

export function escapeHtml(str: unknown): string {
  if (typeof str !== 'string') return str as string;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
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
    .replace(emojiBackRegex, (_, code) => {
      return `:${escapeHtml(code)}:`;
    })
    .replace(userTagBackRegex, (_, name) => {
      return `<@${escapeHtml(name)}>`;
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
    .replace(pTagRegex, '');
};

export const fromPreserveHtml = (raw: string) => {
  return raw
    .replace(emojiRegex, (_, code) => {
      const emoji = emojis.find((e) => e.code === code);
      if (!emoji) return code;
      return `<img data-emoji='${code}' class='${markdown['emoji']}' alt=':${code}:' src='${emoji.path}'/>`;
    })
    .replace(discordTimestampPreserveRegex, (_, timestamp) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    })
    .replace(userTagPreserveRegex, (_, name, _level, level = '2', _gender, gender = 'Male') => {
      return `<span data-name='${name}'><span class='${markdown['user-icon']} ${permission[gender]} ${permission[`lv-${level}`]}'></span><span class='${markdown['user-name']}'>${name}</span></span>`;
    })
    .replace(ytPreserveRegex, (_, videoId) => {
      return `<iframe data-yt='${videoId}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.youtube.com/embed/${videoId}?autoplay=1"></iframe>`;
    })
    .replace(twitchPreserveRegex, (_, channel) => {
      return `<iframe data-twitch='${channel}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.twitch.tv/?channel=${channel}&autoplay=true&parent=localhost"></iframe>`;
    })
    .replace(kickPreserveRegex, (_, username) => {
      return `<iframe data-kick='${username}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.kick.com/${username}"></iframe>`;
    });
};

export const toPreserveHtml = (raw: string) => {
  return raw
    .replace(discordTimestampRegex, (_, timestamp) => {
      return `<time data-timestamp='${escapeHtml(timestamp)}'></time>`;
    })
    .replace(userTagRegex, (_, name, _level, level = '2', _gender, gender = 'Male') => {
      return `<tag data-tag='${escapeHtml(name)}-${escapeHtml(level)}-${escapeHtml(gender)}'></tag>`;
    })
    .replace(ytRegex, (_, videoId) => {
      return `<yt data-yt='${escapeHtml(videoId)}'></yt>`;
    })
    .replace(twitchRegex, (_, channel) => {
      return `<tw data-tw='${escapeHtml(channel)}'></tw>`;
    })
    .replace(kickRegex, (_, username) => {
      return `<kick data-kick='${escapeHtml(username)}'></kick>`;
    });
};
