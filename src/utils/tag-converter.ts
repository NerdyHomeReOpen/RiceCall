import { EMOJIS } from '@/constants';

const emojiRegex = /(?<![a-zA-Z0-9]):([^:]+):(?![a-zA-Z0-9])/g;
const discordTimestampRegex = /<time[^>]+data-timestamp=['"]([^'"]+)['"][^>]*><\/time>/g;
const userTagRegex = /<tag[^>]+data-tag=['"](.+?)(-(\d+))?(-(\w+))?['"][^>]*><\/tag>/g;
const ytRegex = /<yt[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/yt>/g;
const twitchRegex = /<tw[^>]+data-tw=['"]([^'"]+)['"][^>]*><\/tw>/g;
const kickRegex = /<kick[^>]+data-kick=['"]([^'"]+)['"][^>]*><\/kick>/g;
const emojiBackRegex = /<img[^>]+data-emoji=['"]([^'"]+)['"][^>]*>/g;
const userTagBackRegex = /<span[^>]+data-name=['"]([^'"]+)['"][^>]*>(?:<span[^>]*?permission-([a-z]+)[^>]*?permission-lv-(\d+)[^>]*><\/span>)?[\s\S]*?<\/span><\/span>/g;
const ytBackRegex = /<iframe[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const twitchBackRegex = /<iframe[^>]+data-tw=['"]([^'"]+)['"][^>]*><\/iframe>/g;
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

export function fromTags(raw: string): string {
  return raw
    .replace(emojiRegex, (match, code) => {
      const emoji = EMOJIS.find((e) => e.code === code);
      if (!emoji) return match;
      return `<img data-emoji='${code}' loading='lazy' class='markdown-emoji' alt=':${code}:' src='${emoji.path}'/>`;
    })
    .replace(discordTimestampRegex, (_, timestamp) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    })
    .replace(userTagRegex, (_, name, _level, level = '2', _gender, gender = 'male') => {
      return `<span data-name='${name}'><span class='markdown-user-icon permission-${gender} permission-lv-${level}'></span><span class='markdown-user-name'>${name}</span></span>`;
    })
    .replace(ytRegex, (_, videoId) => {
      return `<iframe data-yt='${videoId}' class='markdown-embed-video' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.youtube.com/embed/${videoId}?autoplay=1"></iframe>`;
    })
    .replace(twitchRegex, (_, channel) => {
      return `<iframe data-tw='${channel}' class='markdown-embed-video' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.twitch.tv/?channel=${channel}&autoplay=true&parent=localhost"></iframe>`;
    })
    .replace(kickRegex, (_, username) => {
      return `<iframe data-kick='${username}' class='markdown-embed-video' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.kick.com/${username}"></iframe>`;
    });
}

export function toTags(raw: string): string {
  return raw
    .replace(emojiBackRegex, (_: string, code: string) => {
      return `:${escapeHtml(code)}:`;
    })
    .replace(discordTimestampRegex, (_, timestamp) => {
      return `<time data-timestamp='${escapeHtml(timestamp)}'></time>`;
    })
    .replace(userTagBackRegex, (_: string, name: string, gender: string = 'male', level: string = '2') => {
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
}
