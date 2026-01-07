import emojiData from 'emoji.json';
import twemoji from 'twemoji';

import type * as Types from '@/types';

export const defEmojis: Types.Emoji[] = [
  { code: '1', alt: '微笑', path: '/smiles/1.gif' },
  { code: '2', alt: '開懷笑', path: '/smiles/2.gif' },
  { code: '3', alt: '眨眼', path: '/smiles/3.gif' },
  { code: '4', alt: '驚訝', path: '/smiles/4.gif' },
  { code: '5', alt: '吐舌笑臉', path: '/smiles/5.gif' },
  { code: '6', alt: '生氣', path: '/smiles/6.gif' },
  { code: '7', alt: '怕怕', path: '/smiles/7.gif' },
  { code: '8', alt: '尷尬', path: '/smiles/8.gif' },
  { code: '9', alt: '難過', path: '/smiles/9.gif' },
  { code: '10', alt: '哭泣', path: '/smiles/10.gif' },
  { code: '11', alt: '失望', path: '/smiles/11.gif' },
  { code: '12', alt: '困了', path: '/smiles/12.gif' },
  { code: '13', alt: '好好笑', path: '/smiles/13.gif' },
  { code: '14', alt: '啵', path: '/smiles/14.gif' },
  { code: '15', alt: '電到了', path: '/smiles/15.gif' },
  { code: '16', alt: '汗', path: '/smiles/16.gif' },
  { code: '17', alt: '流口水', path: '/smiles/17.gif' },
  { code: '18', alt: '我吐', path: '/smiles/18.gif' },
  { code: '19', alt: '???', path: '/smiles/19.gif' },
  { code: '20', alt: '噓', path: '/smiles/20.gif' },
  { code: '21', alt: '不說', path: '/smiles/21.gif' },
  { code: '22', alt: '色迷迷', path: '/smiles/22.gif' },
  { code: '23', alt: '可愛', path: '/smiles/23.gif' },
  { code: '24', alt: 'YEAH', path: '/smiles/24.gif' },
  { code: '25', alt: '崩潰', path: '/smiles/25.gif' },
  { code: '26', alt: '鄙視你', path: '/smiles/26.gif' },
  { code: '27', alt: '開心', path: '/smiles/27.gif' },
  { code: '29', alt: '暈', path: '/smiles/29.gif' },
  { code: '30', alt: '挖鼻孔', path: '/smiles/30.gif' },
  { code: '31', alt: '撒嬌', path: '/smiles/31.gif' },
  { code: '32', alt: '鼓掌', path: '/smiles/32.gif' },
  { code: '33', alt: '害羞', path: '/smiles/33.gif' },
  { code: '34', alt: '欠揍', path: '/smiles/34.gif' },
  { code: '35', alt: '飛吻', path: '/smiles/35.gif' },
  { code: '36', alt: '大哭', path: '/smiles/36.gif' },
  { code: '37', alt: '偷偷笑', path: '/smiles/37.gif' },
  { code: '38', alt: '送花給你', path: '/smiles/38.gif' },
  { code: '39', alt: '拍桌子', path: '/smiles/39.gif' },
  { code: '40', alt: '拜拜', path: '/smiles/40.gif' },
  { code: '41', alt: '抓狂', path: '/smiles/41.gif' },
  { code: '42', alt: '扭捏', path: '/smiles/42.gif' },
  { code: '43', alt: '嗷嗷嗷', path: '/smiles/43.gif' },
  { code: '44', alt: '啾啾', path: '/smiles/44.gif' },
  { code: '45', alt: '耍酷', path: '/smiles/45.gif' },
  { code: '46', alt: '睫毛彎彎', path: '/smiles/46.gif' },
  { code: '47', alt: '好愛你', path: '/smiles/47.gif' },
  { code: '48', alt: 'NO', path: '/smiles/48.gif' },
  { code: '49', alt: 'YES', path: '/smiles/49.gif' },
  { code: '50', alt: '握個手', path: '/smiles/50.gif' },
  { code: '51', alt: '便便', path: '/smiles/51.gif' },
  { code: '52', alt: '砸死你', path: '/smiles/52.gif' },
  { code: '53', alt: '工作忙', path: '/smiles/53.gif' },
  { code: '54', alt: '阿彌陀佛', path: '/smiles/54.gif' },
  { code: '55', alt: '玫瑰', path: '/smiles/55.gif' },
  { code: '56', alt: '約會', path: '/smiles/56.gif' },
  { code: '57', alt: '西瓜', path: '/smiles/57.gif' },
  { code: '58', alt: '禮物', path: '/smiles/58.gif' },
  { code: '59', alt: '音樂', path: '/smiles/59.gif' },
  { code: '60', alt: '抱抱', path: '/smiles/60.gif' },
  { code: '61', alt: '帶血的刀', path: '/smiles/61.gif' },
];

export const otherEmojis: Array<Emoji & { char: string }> = emojiData
  .filter((e) => e.codes.length <= 5)
  .map((emoji) => {
    const code = twemoji.convert.toCodePoint(emoji.char);
    return {
      code,
      alt: emoji.name,
      path: `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${code}.png`,
      char: emoji.char,
    };
  });

export const emojis: Emoji[] = [...defEmojis, ...otherEmojis.map(({ code, alt, path }) => ({ code, alt, path }))];
