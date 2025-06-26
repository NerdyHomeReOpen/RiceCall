import { TFunction } from 'i18next';
import i18n from '@/i18n';

// Types
import { Permission } from '@/types';

export const getPermissionText = (t: TFunction<'translation', undefined>, permission: number): string => {
  const permissionMap: Record<number, string> = {
    [Permission.Guest]: t('guest'), // 1
    [Permission.Member]: t('member'), // 2
    [Permission.ChannelAdmin]: t('channelAdmin'), // 3
    [Permission.ChannelManager]: t('channelManager'), // 4
    [Permission.ServerAdmin]: t('serverAdmin'), // 5
    [Permission.ServerOwner]: t('serverOwner'), // 6
    [Permission.Official]: t('official'), // 7
    [Permission.EventStaff]: t('eventStaff'), // 8
  };
  return permissionMap[permission] || t('unknownUser');
};

export const getFormatTimeDiff = (t: TFunction<'translation', undefined>, timestamp: number): string => {
  const now = Date.now();
  const diff = Math.floor((timestamp - now) / 1000);
  const isFuture = diff > 0;
  const absDiff = Math.abs(diff);

  const intervals = [
    { label: t('year'), seconds: 31536000 },
    { label: t('month'), seconds: 2592000 },
    { label: t('week'), seconds: 604800 },
    { label: t('day'), seconds: 86400 },
    { label: t('hour'), seconds: 3600 },
    { label: t('minute'), seconds: 60 },
    { label: t('second'), seconds: 1 },
  ];

  if (absDiff > 10) {
    for (const interval of intervals) {
      const count = Math.floor(absDiff / interval.seconds);
      if (count >= 1) {
        const label = interval.label;
        const timesAgo = t('timesAgo');
        const timesFuture = t('timesFuture');
        return isFuture ? timesFuture.replace('{0}', `${count}${label}`) : timesAgo.replace('{0}', `${count}${label}`);
      }
    }
  }

  return t('justNow');
};

export const getFormatTimestamp = (t: TFunction<'translation', undefined>, timestamp: number): string => {
  const timezoneLang = i18n.language;
  const now = new Date();
  const messageDate = new Date(timestamp);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const hours = messageDate.getHours().toString().padStart(2, '0');
  const minutes = messageDate.getMinutes().toString().padStart(2, '0');
  const seconds = messageDate.getSeconds().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}:${seconds}`;

  if (messageDay.getTime() === today.getTime()) {
    return timeString;
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return `${t('yesterday')} ${timeString}`;
  }
  return `${messageDate.toLocaleDateString(timezoneLang)} ${timeString}`;
};

export const getTranslatedMessage = (
  t: TFunction<'translation', undefined>,
  content: string,
  params?: Record<string, string> | undefined,
) => {
  if (content.includes(' ')) {
    //     const [key, ...params] = content.split(' ');
    //     if (Object.prototype.hasOwnProperty.call(translation, key)) {
    //       let translatedText = translation[key as keyof typeof translation];
    //       params.forEach((param, index) => {
    //         translatedText = translatedText.replace(`{${index}}`, param);
    //       });
    //       content = translatedText;
    //     }
    //   } else {
    //     content = Object.prototype.hasOwnProperty.call(translation, content)
    //       ? translation[content as keyof typeof translation]
    //       : content;
  }

  //   // Dialog Message
  //   content = content.replace('blockedSelfMessage', '你已被該語音群封鎖，無法加入群組');
  //   content = content.replace('blockedSelfWithTimeMessage', '你已被該語音群踢出，無法加入群組，直到');
  //   content = content.replace('kickedSelfMessage', '你已被踢出群組');
  //   content = content.replace('permissionsDenied', '許可權不足');

  //   // Direct Event Message
  //   content = content.replace('receiveShakeWindowMessage', '對方向您發送了一次視窗震動');
  //   content = content.replace('sendShakeWindowMessage', '您向對方發送了一次視窗震動');

  //   // Action Event Messages

  //   content = content.replace('removeFromMemberMessage', '移除了你的會員身份。');
  //   content = content.replace('removeFromChannelManagerMessage', '移除了你的頻道管理員身份。');
  //   content = content.replace('removeFromServerManagerMessage', '移除了你的群管理員身份。');

  //   content = content.replace('upgradeServerManagerMessage', '您已被提升為本群的管理員。');
  //   content = content.replace('upgradeChannelManagerMessage', '您已被提升為本頻道的管理員。');
  //   content = content.replace('upgradeMemberMessage', '您已加入成為本群會員。');

  //   // Action Warn Messages

  //   content = content.replace('forbidVoiceMessage', '您被管理員【{operator}】禁止語音');
  //   content = content.replace('unForbidVoiceMessage', '您被管理員【{operator}】重新開啟語音');
  //   content = content.replace('forbidTextMessage', '您被管理員【{operator}】禁止傳送文字訊息');
  //   content = content.replace('unForbidTextMessage', '您被管理員【{operator}】重新開啟傳送文字訊息');
  //   content = content.replace(
  //     'timeoutChannelWithTimeMessage',
  //     '您在【{channel}】頻道被管理員【{operator}】踢出 {time} 分鐘',
  //   );

  //   content = content.replace('timeoutChannelMessage', '您在【{channel}】頻道被管理員【{operator}】踢出');

  //   // Channel Event Messages
  //   content = content.replace('setMemberMessage', '加入了群，成為本群會員。');
  //   content = content.replace('setChannelManagerMessage', '被提升為本頻道的頻道管理員。');
  //   content = content.replace('setServerManagerMessage', '被提升為本群的管理員。');

  //   // Channel Warn Messages
  //   content = content.replace('forbidVoiceMemberMessage', '【{target}】被管理員【{operator}】禁止語音');
  //   content = content.replace('unForbidVoiceMemberMessage', '【{target}】被管理員【{operator}】重新開啟語音');
  //   content = content.replace('forbidTextMemberMessage', '【{target}】被管理員【{operator}】禁止傳送文字訊息');
  //   content = content.replace('unForbidTextMemberMessage', '【{target}】被管理員【{operator}】重新開啟傳送文字訊息');
  //   content = content.replace('timeoutMemberChannelMessage', '【{target}】被管理員【{operator}】踢出頻道');
  //   content = content.replace('timeoutMemberMessage', '【{target}】被管理員【{operator}】踢出群');
  //   content = content.replace('blockedMemberMessage', '【{target}】被管理員【{operator}】封鎖');

  //   // Alert Messages
  //   content = content.replace('channelAlert', '頻道廣播');
  //   content = content.replace('serverAlert', '群廣播');

  //   // Replace Params
  //   content = content.replace(/{(\w+)}/gm, (match, p1) => params?.[p1] || match);

  // Dialog Message
  content = content.replace('blockedSelfMessage', t('blockedSelfMessage'));
  content = content.replace('blockedSelfWithTimeMessage', t('blockedSelfWithTimeMessage'));
  content = content.replace('kickedSelfMessage', t('kickedSelfMessage'));
  content = content.replace('permissionsDenied', t('permissionsDeniedMessage')); // Change to permissionsDeniedMessage

  // Direct Event Message
  content = content.replace('receiveShakeWindowMessage', t('receiveShakeWindowMessage'));
  content = content.replace('sendShakeWindowMessage', t('sendShakeWindowMessage'));

  // Action Event Messages

  content = content.replace('removeFromMemberMessage', t('removeFromMemberMessage'));
  content = content.replace('removeFromChannelManagerMessage', t('removeFromChannelManagerMessage'));
  content = content.replace('removeFromServerManagerMessage', t('removeFromServerManagerMessage'));

  content = content.replace('upgradeServerManagerMessage', t('upgradeServerManagerMessage'));
  content = content.replace('upgradeChannelManagerMessage', t('upgradeChannelManagerMessage'));
  content = content.replace('upgradeMemberMessage', t('upgradeMemberMessage'));

  // Action Warn Messages

  content = content.replace('forbidVoiceMessage', t('forbidVoiceMessage'));
  content = content.replace('unForbidVoiceMessage', t('unForbidVoiceMessage'));
  content = content.replace('forbidTextMessage', t('forbidTextMessage'));
  content = content.replace('unForbidTextMessage', t('unForbidTextMessage'));
  content = content.replace('timeoutChannelWithTimeMessage', t('timeoutChannelWithTimeMessage'));

  content = content.replace('timeoutChannelMessage', t('timeoutChannelMessage'));

  // Channel Event Messages
  content = content.replace('setMemberMessage', t('setMemberMessage'));
  content = content.replace('setChannelManagerMessage', t('setChannelManagerMessage'));
  content = content.replace('setServerManagerMessage', t('setServerManagerMessage'));

  // Channel Warn Messages
  content = content.replace('forbidVoiceMemberMessage', t('forbidVoiceMemberMessage'));
  content = content.replace('unForbidVoiceMemberMessage', t('unForbidVoiceMemberMessage'));
  content = content.replace('forbidTextMemberMessage', t('forbidTextMemberMessage'));
  content = content.replace('unForbidTextMemberMessage', t('unForbidTextMemberMessage'));
  content = content.replace('timeoutMemberChannelMessage', t('timeoutMemberChannelMessage'));
  content = content.replace('timeoutMemberMessage', t('timeoutMemberMessage'));
  content = content.replace('blockedMemberMessage', t('blockedMemberMessage'));

  // Alert Messages
  content = content.replace('channelAlert', t('channelAlert'));
  content = content.replace('serverAlert', t('serverAlert'));

  // Replace Params
  content = content.replace(/{(\w+)}/gm, (match, p1) => params?.[p1] || match);

  const isPlainText = !/[#>*\-\[\]`|!_~]/.test(content);
  return isPlainText ? content.replace(/\n/g, '<br />') : content;
};
