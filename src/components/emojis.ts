import emojiData from 'emoji.json';
import twemoji from 'twemoji';

export interface Emoji {
  id: number;
  char: string;
  alt: string;
  path: string;
}

const customEmojis: Emoji[] = [
  { id: 0, char: '[emoji_1]', alt: '微笑', path: '/smiles/1.gif' },
  { id: 1, char: '[emoji_2]', alt: '開懷笑', path: '/smiles/2.gif' },
  { id: 2, char: '[emoji_3]', alt: '眨眼', path: '/smiles/3.gif' },
  { id: 3, char: '[emoji_4]', alt: '驚訝', path: '/smiles/4.gif' },
  { id: 4, char: '[emoji_5]', alt: '吐舌笑臉', path: '/smiles/5.gif' },
  { id: 5, char: '[emoji_6]', alt: '生氣', path: '/smiles/6.gif' },
  { id: 6, char: '[emoji_7]', alt: '怕怕', path: '/smiles/7.gif' },
  { id: 7, char: '[emoji_8]', alt: '尷尬', path: '/smiles/8.gif' },
  { id: 8, char: '[emoji_9]', alt: '難過', path: '/smiles/9.gif' },
  { id: 9, char: '[emoji_10]', alt: '哭泣', path: '/smiles/10.gif' },
  { id: 10, char: '[emoji_11]', alt: '失望', path: '/smiles/11.gif' },
  { id: 11, char: '[emoji_12]', alt: '困了', path: '/smiles/12.gif' },
  { id: 12, char: '[emoji_13]', alt: '好好笑', path: '/smiles/13.gif' },
  { id: 13, char: '[emoji_14]', alt: '啵', path: '/smiles/14.gif' },
  { id: 14, char: '[emoji_15]', alt: '電到了', path: '/smiles/15.gif' },
  { id: 15, char: '[emoji_16]', alt: '汗', path: '/smiles/16.gif' },
  { id: 16, char: '[emoji_17]', alt: '流口水', path: '/smiles/17.gif' },
  { id: 17, char: '[emoji_18]', alt: '我吐', path: '/smiles/18.gif' },
  { id: 18, char: '[emoji_19]', alt: '???', path: '/smiles/19.gif' },
  { id: 19, char: '[emoji_20]', alt: '噓', path: '/smiles/20.gif' },
  { id: 20, char: '[emoji_21]', alt: '不說', path: '/smiles/21.gif' },
  { id: 21, char: '[emoji_22]', alt: '色迷迷', path: '/smiles/22.gif' },
  { id: 22, char: '[emoji_23]', alt: '可愛', path: '/smiles/23.gif' },
  { id: 23, char: '[emoji_24]', alt: 'YEAH', path: '/smiles/24.gif' },
  { id: 24, char: '[emoji_25]', alt: '崩潰', path: '/smiles/25.gif' },
  { id: 25, char: '[emoji_26]', alt: '鄙視你', path: '/smiles/26.gif' },
  { id: 26, char: '[emoji_27]', alt: '開心', path: '/smiles/27.gif' },
  // { id: 27, char: '[emoji_28]', alt: '暈', path: '/smiles/28.gif' },
  { id: 28, char: '[emoji_29]', alt: '挖鼻孔', path: '/smiles/29.gif' },
  { id: 29, char: '[emoji_30]', alt: '撒嬌', path: '/smiles/30.gif' },
  { id: 30, char: '[emoji_31]', alt: '鼓掌', path: '/smiles/31.gif' },
  { id: 31, char: '[emoji_32]', alt: '害羞', path: '/smiles/32.gif' },
  { id: 32, char: '[emoji_33]', alt: '欠揍', path: '/smiles/33.gif' },
  { id: 33, char: '[emoji_34]', alt: '飛吻', path: '/smiles/34.gif' },
  { id: 34, char: '[emoji_35]', alt: '大哭', path: '/smiles/35.gif' },
  { id: 35, char: '[emoji_36]', alt: '偷偷笑', path: '/smiles/36.gif' },
  { id: 36, char: '[emoji_37]', alt: '送花給你', path: '/smiles/37.gif' },
  { id: 37, char: '[emoji_38]', alt: '拍桌子', path: '/smiles/38.gif' },
  { id: 38, char: '[emoji_39]', alt: '拜拜', path: '/smiles/39.gif' },
  { id: 39, char: '[emoji_40]', alt: '抓狂', path: '/smiles/40.gif' },
  { id: 40, char: '[emoji_41]', alt: '扭捏', path: '/smiles/41.gif' },
  { id: 41, char: '[emoji_42]', alt: '嗷嗷嗷', path: '/smiles/42.gif' },
  { id: 42, char: '[emoji_43]', alt: '啾啾', path: '/smiles/43.gif' },
  { id: 43, char: '[emoji_44]', alt: '耍酷', path: '/smiles/44.gif' },
  { id: 44, char: '[emoji_45]', alt: '睫毛彎彎', path: '/smiles/45.gif' },
  { id: 45, char: '[emoji_46]', alt: '好愛你', path: '/smiles/46.gif' },
  { id: 46, char: '[emoji_47]', alt: 'NO', path: '/smiles/47.gif' },
  { id: 47, char: '[emoji_48]', alt: 'YES', path: '/smiles/48.gif' },
  { id: 48, char: '[emoji_49]', alt: '握個手', path: '/smiles/49.gif' },
  { id: 49, char: '[emoji_50]', alt: '便便', path: '/smiles/50.gif' },
  { id: 50, char: '[emoji_51]', alt: '砸死你', path: '/smiles/51.gif' },
  { id: 51, char: '[emoji_52]', alt: '工作忙', path: '/smiles/52.gif' },
  { id: 52, char: '[emoji_53]', alt: '阿彌陀佛', path: '/smiles/53.gif' },
  { id: 53, char: '[emoji_54]', alt: '玫瑰', path: '/smiles/54.gif' },
  { id: 54, char: '[emoji_55]', alt: '約會', path: '/smiles/55.gif' },
  { id: 55, char: '[emoji_56]', alt: '西瓜', path: '/smiles/56.gif' },
  { id: 56, char: '[emoji_57]', alt: '禮物', path: '/smiles/57.gif' },
  { id: 57, char: '[emoji_58]', alt: '音樂', path: '/smiles/58.gif' },
  { id: 58, char: '[emoji_59]', alt: '抱抱', path: '/smiles/59.gif' },
  { id: 59, char: '[emoji_60]', alt: '帶血的刀', path: '/smiles/60.gif' },
];

const unicodeEmojis: Emoji[] = emojiData
  .filter((e) => e.codes.length <= 5)
  .map((emoji, index) => {
    const code = twemoji.convert.toCodePoint(emoji.char);
    return {
      id: index + customEmojis.length,
      char: `[emoji_${code}]`,
      alt: emoji.name,
      path: `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${code}.png`,
    };
  });

export const emojis = [...customEmojis, ...unicodeEmojis];
