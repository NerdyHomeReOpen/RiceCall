// /utils/tagConverter.ts
import { emojis } from '@/emojis';

// CSS
import markdown from '@/styles/markdown.module.css';
import permission from '@/styles/permission.module.css';

/* ---------- forward  ---------- */
const emojiRegex = /(?<![a-zA-Z]):([^:]+):/g; // :code:
const discordTimestampRegex = /<t:(\d+):([A-Z])>/g; // <t:timestamp:F>
const userTagRegex = /<@(.+?)(-(\d+))?(-(\w+))?>/g; // <@name-level-gender> // level and gender are optional
const ytRegex = /<&YT&(.+?)>/g; // <&YT&dQw4w9WgXcQ>
const twitchRegex = /<&TW&(.+?)>/g; // <&TW&dQw4w9WgXcQ>
const kickRegex = /<&KICK&(.+?)>/g; // <&KICK&dQw4w9WgXcQ>
const styleRegex = /<style data-font-size="([^"]+)" data-text-color="([^"]+)">([\s\S]*?)<\/style>/g; // <style data-font-size="small" data-text-color="#000000">content</style>

/* ---------- reverse ---------- */
const emojiBackRegex = /<(?:img|div|span)[^>]*data-emoji=['"]([^'"]+)['"][^>]*>(?:<\/div>)?/g;
const userTagBackRegex = /<span[^>]+data-name=['"]([^'"]+)['"][^>]*>[\s\S]*?<\/span><\/span>/g;
const ytBackRegex = /<iframe[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const twitchBackRegex = /<iframe[^>]+data-twitch=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const kickBackRegex = /<iframe[^>]+data-kick=['"]([^'"]+)['"][^>]*><\/iframe>/g;
const pTagRegex = /<p><\/p>/g;
const styleBackRegex = /<span[^>]*data-font-size=['"]([^'"]+)['"][^>]*data-text-color=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/span>/g;

/* ---------- preserve ---------- */
const discordTimestampPreserveRegex = /<time[^>]+data-timestamp=['"]([^'"]+)['"][^>]*><\/time>/g;
const userTagPreserveRegex = /<tag[^>]+data-tag=['"](.+?)(-(\d+))?(-(\w+))?['"][^>]*><\/tag>/g;
const ytPreserveRegex = /<yt[^>]+data-yt=['"]([^'"]+)['"][^>]*><\/yt>/g;
const twitchPreserveRegex = /<tw[^>]+data-tw=['"]([^'"]+)['"][^>]*><\/tw>/g;
const kickPreserveRegex = /<kick[^>]+data-kick=['"]([^'"]+)['"][^>]*><\/kick>/g;
const stylePreserveRegex = /<span[^>]*data-font-size=['"]([^'"]+)['"][^>]*data-text-color=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/span>/g;

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
    .replace(styleRegex, (_, fontSize, textColor, content) => {
      const fontSizeMap = { small: '14px', medium: '18px', large: '25px' };
      const processedContent = content.replace(emojiRegex, (_: string, code: string) => {
        const emoji = emojis.find((e) => e.code === code);
        if (!emoji) return code;
        return `<span data-emoji-wrapper class='${markdown['emoji-wrapper']}' contenteditable='false'><div data-emoji='${code}' class='${markdown['emoji']}' style='background-image:url(${emoji.path})' draggable='false'></div></span>`;
      });
      if (processedContent.includes('data-emoji-wrapper')) {
        const parts = processedContent.split(/(<span data-emoji-wrapper[^>]*>[\s\S]*?<\/span>)/g);
        const styledParts = parts.map((part: string) => {
          if (part.includes('data-emoji-wrapper')) {
            return part;
          } else if (part.trim()) {
            return `<span data-font-size="${fontSize}" data-text-color="${textColor}" style="font-size: ${fontSizeMap[fontSize as keyof typeof fontSizeMap]}; color: ${textColor};">${part}</span>`;
          }
          return part;
        });
        return styledParts.join('');
      } else {
        return `<span data-font-size="${fontSize}" data-text-color="${textColor}" style="font-size: ${fontSizeMap[fontSize as keyof typeof fontSizeMap]}; color: ${textColor};">${processedContent}</span>`;
      }
    })
    .replace(emojiRegex, (_, code) => {
      const emoji = emojis.find((e) => e.code === code);
      if (!emoji) return code;
      return `<span data-emoji-wrapper class='${markdown['emoji-wrapper']}' contenteditable='false'><div data-emoji='${code}' class='${markdown['emoji']}' style='background-image:url(${emoji.path})' draggable='false'></div></span>`;
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
    .replace(/<(?:div|span)[^>]*data-emoji-wrapper[^>]*>([\s\S]*?)<\/(?:div|span)>/g, '$1')
    .replace(styleBackRegex, (_: string, fontSize: string, textColor: string, content: string) => {
      return `<style data-font-size="${fontSize}" data-text-color="${textColor}">${content}</style>`;
    })
    .replace(userTagBackRegex, (_: string, name: string) => {
      return `<@${escapeHtml(name)}>`;
    })
    .replace(ytBackRegex, (_: string, videoId: string) => {
      return `<&YT&${escapeHtml(videoId)}>`;
    })
    .replace(twitchBackRegex, (_: string, channel: string) => {
      return `<&TW&${escapeHtml(channel)}>`;
    })
    .replace(kickBackRegex, (_: string, username: string) => {
      return `<&KICK&${escapeHtml(username)}>`;
    })
    .replace(pTagRegex, '');
};

export const fromPreserveHtml = (raw: string) => {
  let processed = raw.replace(stylePreserveRegex, (_: string, fontSize: string, textColor: string, content: string) => {
    const fontSizeMap = { small: '14px', medium: '18px', large: '25px' };
    const processedContent = content.replace(emojiRegex, (_: string, code: string) => {
      const emoji = emojis.find((e) => e.code === code);
      if (!emoji) return code;
      return `<span data-emoji-wrapper class='${markdown['emoji-wrapper']}' contenteditable='false'><div data-emoji='${code}' class='${markdown['emoji']}' style='background-image:url(${emoji.path})' draggable='false'></div></span>`;
    });

    if (processedContent.includes('data-emoji-wrapper')) {
      const parts = processedContent.split(/(<span data-emoji-wrapper[^>]*>[\s\S]*?<\/span>)/g);
      const styledParts = parts.map((part: string) => {
        if (part.includes('data-emoji-wrapper')) {
          return part;
        } else if (part.trim()) {
          return `<span data-font-size="${fontSize}" data-text-color="${textColor}" style="font-size: ${fontSizeMap[fontSize as keyof typeof fontSizeMap]}; color: ${textColor};">${part}</span>`;
        }
        return part;
      });
      return styledParts.join('');
    } else {
      return `<span data-font-size="${fontSize}" data-text-color="${textColor}" style="font-size: ${fontSizeMap[fontSize as keyof typeof fontSizeMap]}; color: ${textColor};">${processedContent}</span>`;
    }
  });

  processed = processed.replace(emojiRegex, (_: string, code: string) => {
    const emoji = emojis.find((e) => e.code === code);
    if (!emoji) return code;
    return `<span data-emoji-wrapper class='${markdown['emoji-wrapper']}' contenteditable='false'><div data-emoji='${code}' class='${markdown['emoji']}' style='background-image:url(${emoji.path})' draggable='false'></div></span>`;
  });

  return processed
    .replace(discordTimestampPreserveRegex, (_: string, timestamp: string) => {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleString();
    })
    .replace(userTagPreserveRegex, (_: string, name: string, _level: string, level: string = '2', _gender: string, gender: string = 'Male') => {
      return `<span data-name='${name}'><span class='${markdown['user-icon']} ${permission[gender]} ${permission[`lv-${level}`]}'></span><span class='${markdown['user-name']}'>${name}</span></span>`;
    })
    .replace(ytPreserveRegex, (_: string, videoId: string) => {
      return `<iframe data-yt='${videoId}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://www.youtube.com/embed/${videoId}?autoplay=1"></iframe>`;
    })
    .replace(twitchPreserveRegex, (_: string, channel: string) => {
      return `<iframe data-twitch='${channel}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.twitch.tv/?channel=${channel}&autoplay=true&parent=localhost"></iframe>`;
    })
    .replace(kickPreserveRegex, (_: string, username: string) => {
      return `<iframe data-kick='${username}' class='${markdown['embed-video']}' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" src="https://player.kick.com/${username}"></iframe>`;
    });
};

export const toPreserveHtml = (raw: string) => {
  return raw
    .replace(styleRegex, (_, fontSize, textColor, content) => {
      return `<span data-font-size="${escapeHtml(fontSize)}" data-text-color="${escapeHtml(textColor)}">${content}</span>`;
    })
    .replace(emojiRegex, (_, code) => {
      return `:${escapeHtml(code)}:`;
    })
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
