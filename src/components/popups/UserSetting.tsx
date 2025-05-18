import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';

// Types
import { Server, User, UserServer, PopupType, Friend } from '@/types';

// Components
import BadgeListViewer from '@/components/viewers/BadgeList';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import refreshService from '@/services/refresh.service';
import apiService from '@/services/api.service';

// CSS
import setting from '@/styles/popups/editProfile.module.css';
import grade from '@/styles/grade.module.css';
import popup from '@/styles/popup.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Utils
import { createDefault } from '@/utils/createDefault';

interface Emoji {
  id: string | number;
  name: string;
  src: string;
}

const emojiList: Emoji[] = [
  { id: 1, name: '微笑', src: 'smile' },
  { id: 2, name: '臉紅', src: 'blush' },
  { id: 3, name: '害羞', src: 'relaxed' },
  { id: 4, name: '眨眼', src: 'wink' },
  { id: 5, name: '色', src: 'heart_eyes' },
  { id: 6, name: '親吻', src: 'kissing_heart' },
  { id: 7, name: '調皮', src: 'stuck_out_tongue_winking_eye' },
  { id: 8, name: '吐舌', src: 'stuck_out_tongue_closed_eyes' },
  { id: 9, name: '露齒笑', src: 'grin' },
  { id: 10, name: '悲傷', src: 'pensive' },
  { id: 11, name: '欣慰', src: 'relieved' },
  { id: 12, name: '失望', src: 'disappointed' },
  { id: 13, name: '哭泣', src: 'sob' },
  { id: 14, name: '眼困', src: 'sleepy' },
  { id: 15, name: '冷汗', src: 'cold_sweat' },
  { id: 16, name: '厭倦', src: 'weary' },
  { id: 17, name: '害怕', src: 'fearful' },
  { id: 18, name: '驚叫', src: 'scream' },
  { id: 19, name: '生氣', src: 'angry' },
  { id: 20, name: '憤怒', src: 'rage' },
  { id: 21, name: '口罩', src: 'mask' },
  { id: 22, name: '墨鏡', src: 'sunglasses' },
  { id: 23, name: '睡覺', src: 'sleeping' },
  { id: 24, name: '輕蔑', src: 'smirk' },
  { id: 25, name: '痛苦', src: 'anguished' },
  { id: 26, name: '惡魔', src: 'imp' },
  { id: 27, name: '男孩', src: 'boy' },
  { id: 28, name: '女孩', src: 'girl' },
  { id: 29, name: '男士', src: 'man' },
  { id: 30, name: '女士', src: 'woman' },
  { id: 31, name: '老男人', src: 'older_man' },
  { id: 32, name: '老女人', src: 'older_woman' },
  { id: 33, name: '嬰兒', src: 'baby' },
  { id: 34, name: '天使', src: 'angel' },
  { id: 35, name: '發炎', src: 'anger' },
  { id: 36, name: '沖', src: 'dash' },
  { id: 37, name: '耳朵', src: 'ear' },
  { id: 38, name: '眼睛', src: 'eyes' },
  { id: 39, name: '舌頭', src: 'tongue' },
  { id: 40, name: '嘴唇', src: 'lips' },
  { id: 41, name: '鼻子', src: 'nose' },
  { id: 42, name: '肌肉', src: 'muscle' },
  { id: 43, name: '拳頭', src: 'facepunch' },
  { id: 44, name: '手', src: 'hand' },
  { id: 45, name: '鼓掌', src: 'clap' },
  { id: 46, name: '弱', src: '-1' },
  { id: 47, name: '讚', src: '+1' },
  { id: 48, name: 'ok', src: 'ok_hand' },
  { id: 49, name: 'v', src: 'v' },
  { id: 50, name: '祈禱', src: 'pray' },
  { id: 51, name: '新娘', src: 'bride_with_veil' },
  { id: 52, name: '家庭', src: 'family' },
  { id: 53, name: '情侶', src: 'couple' },
  { id: 54, name: '按摩', src: 'massage' },
  { id: 55, name: '舉手', src: 'raising_hand' },
  { id: 56, name: '紅心', src: 'heart' },
  { id: 57, name: '丘比特', src: 'cupid' },
  { id: 58, name: '愛心', src: 'gift_heart' },
  { id: 59, name: '心動', src: 'heartbeat' },
  { id: 60, name: '心碎', src: 'broken_heart' },
];

const convertHtmlToEmojiPlaceholder = (html: string): string => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const images = tempDiv.querySelectorAll('img[data-emoji-src]');
  images.forEach((img) => {
    const emojiSrc = img.getAttribute('data-emoji-src');
    if (emojiSrc) {
      const textNode = document.createTextNode(`[:${emojiSrc}]`);
      img.parentNode?.replaceChild(textNode, img);
    }
  });
  return tempDiv.innerHTML;
};

const convertEmojiPlaceholderToHtml = (
  textWithPlaceholders: string,
  emojis: typeof emojiList,
): string => {
  let html = textWithPlaceholders;
  if (!html) return '';
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  emojis.forEach((emoji) => {
    const escapedEmojiSrc = escapeRegExp(emoji.src);
    const placeholderPattern = `\\[:${escapedEmojiSrc}\\]`;
    const imgTag = `<img src="/vipemotions/${emoji.src}.png" alt="${emoji.name}" data-emoji-name="${emoji.name}" data-emoji-src="${emoji.src}" style="width: 17px; height: 17px; vertical-align: middle; margin: 0 1px;" contenteditable="false" draggable="false" />`;
    try {
      html = html.replace(new RegExp(placeholderPattern, 'g'), imgTag);
    } catch (e) {
      console.error(
        'Error replacing emoji placeholder:',
        e,
        'Pattern:',
        placeholderPattern,
      );
    }
  });
  return html;
};

interface UserSettingPopupProps {
  userId: User['userId'];
  targetId: string;
}

const UserSettingPopup: React.FC<UserSettingPopupProps> = React.memo(
  (initialData: UserSettingPopupProps) => {
    // Props
    const socket = useSocket();
    const lang = useLanguage();

    // Refs
    const refreshRef = useRef(false);
    const isSelectingRef = useRef(false);
    const isLoading = useRef(false);
    const signatureDivRef = useRef<HTMLDivElement>(null);
    const emojiBoxContainerRef = useRef<HTMLDivElement>(null);
    const lastCursorPosition = useRef<number | null>(null);
    const emojiIconsWrapperRef = useRef<HTMLDivElement>(null);

    // Constants
    const TODAY = useMemo(() => new Date(), []);
    const CURRENT_YEAR = TODAY.getFullYear();
    const CURRENT_MONTH = TODAY.getMonth() + 1;
    const CURRENT_DAY = TODAY.getDate();

    // States
    const [user, setUser] = useState<User>(createDefault.user());
    const [friend, setFriend] = useState<Friend>(createDefault.friend());
    const [servers, setServers] = useState<UserServer[]>([]);
    const [serversView, setServersView] = useState('joined');
    const [selectedTabId, setSelectedTabId] = useState<
      'about' | 'groups' | 'userSetting'
    >('about');
    const [isEmojiBoxVisible, setIsEmojiBoxVisible] = useState(false);
    const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

    // Variables
    const { userId, targetId } = initialData;
    const {
      name: userName,
      avatar: userAvatar,
      avatarUrl: userAvatarUrl,
      gender: userGender,
      signature: userSignature,
      level: userLevel,
      xp: userXP,
      requiredXp: userRequiredXP,
      vip: userVip,
      birthYear: userBirthYear,
      birthMonth: userBirthMonth,
      birthDay: userBirthDay,
      country: userCountry,
      badges: userBadges,
    } = user;
    const isSelf = targetId === userId;
    const isFriend = !!friend.targetId;
    const isProfilePrivate = false; // TODO: 隱私設定開關，等設定功能完工
    const joinedServers = servers
      .filter((s) => s.permissionLevel > 1 && s.permissionLevel < 7)
      .sort((a, b) => b.permissionLevel - a.permissionLevel);
    const favoriteServers = servers
      .filter((s) => s.favorite)
      .filter((s) => s.permissionLevel > 1 && s.permissionLevel < 7)
      .sort((a, b) => b.permissionLevel - a.permissionLevel);
    const recentServers = servers
      .filter((s) => s.recent)
      .filter((s) => s.permissionLevel > 1 && s.permissionLevel < 7)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 4);

    const isFutureDate = useCallback(
      (year: number, month: number, day: number) => {
        if (year > CURRENT_YEAR) return true;
        if (year === CURRENT_YEAR && month > CURRENT_MONTH) return true;
        if (
          year === CURRENT_YEAR &&
          month === CURRENT_MONTH &&
          day > CURRENT_DAY
        )
          return true;
        return false;
      },
      [CURRENT_YEAR, CURRENT_MONTH, CURRENT_DAY],
    );

    const calculateAge = (
      birthYear: number,
      birthMonth: number,
      birthDay: number,
    ) => {
      const birthDate = new Date(birthYear, birthMonth - 1, birthDay);
      let age = CURRENT_YEAR - birthDate.getFullYear();
      const monthDiff = CURRENT_MONTH - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && CURRENT_DAY < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    };

    const userAge = calculateAge(userBirthYear, userBirthMonth, userBirthDay);

    const yearOptions = useMemo(
      () =>
        Array.from(
          { length: CURRENT_YEAR - 1900 + 1 },
          (_, i) => CURRENT_YEAR - i,
        ),
      [CURRENT_YEAR],
    );

    const monthOptions = useMemo(
      () => Array.from({ length: 12 }, (_, i) => i + 1),
      [],
    );

    const dayOptions = useMemo(
      () =>
        Array.from(
          { length: new Date(userBirthYear, userBirthMonth, 0).getDate() },
          (_, i) => i + 1,
        ),
      [userBirthYear, userBirthMonth],
    );

    // Handlers
    const handleUpdateUser = (userData: Partial<User>) => {
      if (!socket) return;
      const signatureWithPlaceholders = convertHtmlToEmojiPlaceholder(
        userData.signature || '',
      );
      socket.send.updateUser({
        user: {
          ...userData,
          signature: signatureWithPlaceholders,
        },
        userId,
      });
    };

    const handleOpenApplyFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.APPLY_FRIEND, 'applyFriend');
      ipcService.initialData.onRequest('applyFriend', {
        userId,
        targetId,
      });
    };

    const handleMinimize = () => {
      ipcService.window.minimize();
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleServerSelect = (userId: User['userId'], server: Server) => {
      if (isSelectingRef.current || isLoading.current || isSelectingRef.current)
        return;
      isSelectingRef.current = true;
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 3000);
      window.localStorage.setItem(
        'trigger-handle-server-select',
        JSON.stringify({
          serverDisplayId: server.displayId,
          timestamp: Date.now(),
        }),
      );
      setTimeout(() => {
        socket.send.connectServer({ userId, serverId: server.serverId });
      }, 1500);
    };

    const handleSignatureKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Backspace' && signatureDivRef.current) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        let imageToDelete: HTMLImageElement | null = null;
        if (range.collapsed) {
          const container = range.startContainer;
          const offset = range.startOffset;
          if (container.nodeType === Node.ELEMENT_NODE && offset > 0) {
            const nodeBeforeCursor = container.childNodes[offset - 1];
            if (
              nodeBeforeCursor &&
              nodeBeforeCursor.nodeName === 'IMG' &&
              (nodeBeforeCursor as HTMLImageElement).hasAttribute(
                'data-emoji-src',
              )
            ) {
              imageToDelete = nodeBeforeCursor as HTMLImageElement;
            }
          } else if (container.nodeType === Node.TEXT_NODE && offset === 0) {
            if (
              container.previousSibling &&
              container.previousSibling.nodeName === 'IMG' &&
              (container.previousSibling as HTMLImageElement).hasAttribute(
                'data-emoji-src',
              )
            ) {
              imageToDelete = container.previousSibling as HTMLImageElement;
            }
          }
        } else {
          if (
            range.startContainer === range.endContainer &&
            range.endOffset === range.startOffset + 1
          ) {
            const selectedNode =
              range.startContainer.childNodes[range.startOffset];
            if (
              selectedNode &&
              selectedNode.nodeName === 'IMG' &&
              (selectedNode as HTMLImageElement).hasAttribute('data-emoji-src')
            ) {
              imageToDelete = selectedNode as HTMLImageElement;
            }
          }
        }
        if (imageToDelete) {
          e.preventDefault();
          imageToDelete.parentNode?.removeChild(imageToDelete);
          const newHtml = signatureDivRef.current.innerHTML;
          setUser((prev) => ({
            ...prev,
            signature: newHtml,
          }));
          lastCursorPosition.current = null;
          if (signatureDivRef.current) {
            signatureDivRef.current.focus();
          }
          return;
        }
      }
      if (e.type === 'dragstart') {
        e.preventDefault();
        return;
      }
    };

    // Effects
    useEffect(() => {
      if (!targetId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.user({
            userId: targetId,
          }),
          refreshService.userServers({
            userId: targetId,
          }),
          refreshService.friend({
            userId: userId,
            targetId: targetId,
          }),
        ]).then(([userData, serversData, friendData]) => {
          if (userData) {
            const signatureAsHtml = convertEmojiPlaceholderToHtml(
              userData.signature || '',
              emojiList,
            );
            setUser({
              ...userData,
              signature: signatureAsHtml,
            });
          }
          if (serversData) {
            setServers(serversData);
          }
          if (friendData) {
            setFriend(friendData);
          }
        });
      };
      refresh();
    }, [userId, targetId]);

    useEffect(() => {
      const daysInMonth = new Date(userBirthYear, userBirthMonth, 0).getDate();
      if (userBirthDay > daysInMonth) {
        setUser((prev) => ({ ...prev, birthDay: daysInMonth }));
      }
      if (isFutureDate(userBirthYear, userBirthMonth, userBirthDay)) {
        setUser((prev) => ({
          ...prev,
          birthYear: CURRENT_YEAR,
          birthMonth: CURRENT_MONTH,
          birthDay: CURRENT_DAY,
        }));
      }
    }, [
      userBirthYear,
      userBirthMonth,
      userBirthDay,
      CURRENT_YEAR,
      CURRENT_MONTH,
      CURRENT_DAY,
      isFutureDate,
    ]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          isEmojiPickerVisible &&
          emojiIconsWrapperRef.current &&
          !emojiIconsWrapperRef.current.contains(event.target as Node) &&
          emojiBoxContainerRef.current &&
          !emojiBoxContainerRef.current.contains(event.target as Node)
        ) {
          setIsEmojiPickerVisible(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isEmojiPickerVisible]);

    useEffect(() => {
      if (
        signatureDivRef.current &&
        signatureDivRef.current.innerHTML !== userSignature
      ) {
        signatureDivRef.current.innerHTML = userSignature;
        if (document.activeElement === signatureDivRef.current) {
        }
      }
    }, [userSignature]);

    useEffect(() => {
      const handleSelectionChange = () => {
        if (!signatureDivRef.current) {
          return;
        }
        const allEmojiImages =
          signatureDivRef.current.querySelectorAll<HTMLImageElement>(
            'img[data-emoji-src]',
          );
        allEmojiImages.forEach((img) => {
          img.classList.remove(setting['selectedEmojiImage']);
        });
        if (document.activeElement !== signatureDivRef.current) {
          return;
        }
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          return;
        }
        const range = selection.getRangeAt(0);
        if (!signatureDivRef.current.contains(range.commonAncestorContainer)) {
          return;
        }
        allEmojiImages.forEach((img) => {
          if (selection.containsNode(img, true)) {
            img.classList.add(setting['selectedEmojiImage']);
          }
        });
      };
      document.addEventListener('selectionchange', handleSelectionChange);
      const currentSignatureDiv = signatureDivRef.current;
      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        if (currentSignatureDiv) {
          const allEmojiImages =
            currentSignatureDiv.querySelectorAll<HTMLImageElement>(
              'img[data-emoji-src]',
            );
          allEmojiImages.forEach((img) => {
            img.classList.remove(setting['selectedEmojiImage']);
          });
        }
      };
    }, []);

    const PrivateElement = (text: React.ReactNode) => {
      return <div className={setting['userRecentVisitsPrivate']}>{text}</div>;
    };

    return (
      <div className={`${popup['popupContainer']} ${setting['userProfile']}`}>
        <div className={setting['profileBox']}>
          {/* Header */}
          <div className={setting['header']}>
            <div className={setting['windowActionButtons']}>
              <div
                className={setting['minimizeBtn']}
                onClick={() => handleMinimize()}
              />
              <div
                className={setting['closeBtn']}
                onClick={() => handleClose()}
              />
            </div>

            <div
              className={`${setting['avatar']} ${
                isSelf ? setting['editable'] : ''
              }`}
              style={{ backgroundImage: `url(${userAvatarUrl})` }}
              onClick={() => {
                if (!isSelf) return;
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    const formData = new FormData();
                    formData.append('_type', 'user');
                    formData.append('_fileName', userId);
                    formData.append('_file', reader.result as string);
                    const data = await apiService.post('/upload', formData);
                    if (data) {
                      setUser((prev) => ({
                        ...prev,
                        avatar: data.avatar,
                        avatarUrl: data.avatarUrl,
                      }));
                    }
                  };
                  reader.readAsDataURL(file);
                };
                fileInput.click();
              }}
            />

            <div
              className={`${popup['row']} ${setting['noDrag']}`}
              style={{ gap: '2px' }}
            >
              <div className={setting['userName']}>{userName}</div>
              {userVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${vip[`vip-small-${userVip}`]}`}
                />
              )}
              <div
                className={`
                  ${grade['grade']} 
                  ${grade[`lv-${Math.min(56, userLevel)}`]}
                `}
                title={
                  `${lang.tr.level}：${userLevel}，${lang.tr.xp}：${userXP}，${lang.tr.xpDifference}：${userRequiredXP}` /** LEVEL:{userLevel} EXP:{userXP} LEVEL UP REQUIRED:{userRequiredXP}**/
                }
              />
            </div>

            <div
              className={setting['userAccount']}
              onClick={() => {
                navigator.clipboard.writeText(userId);
              }}
            >
              @{userName}
            </div>

            <div className={setting['userContent']}>
              {lang.tr[userGender === 'Male' ? 'male' : 'female']} . {userAge} .
              {lang.tr[userCountry as keyof typeof lang.tr]}
            </div>

            <div
              className={setting['userSignature']}
              dangerouslySetInnerHTML={{ __html: userSignature }}
            />

            <div className={setting['tab']}>
              <div
                className={`${setting['item']} ${setting['about']}
                ${
                  selectedTabId === 'userSetting'
                    ? `${setting['selected']} ${setting['editable']}`
                    : ''
                }
                ${selectedTabId === 'about' ? setting['selected'] : ''}`}
                onClick={() => {
                  if (selectedTabId !== 'userSetting') {
                    setSelectedTabId('about');
                  }
                }}
              >
                {lang.tr.about}
              </div>
              <div
                className={`${setting['item']} ${setting['groups']}
                ${selectedTabId === 'userSetting' ? setting['editable'] : ''}
                ${selectedTabId === 'groups' ? setting['selected'] : ''}`}
                onClick={() => {
                  if (selectedTabId !== 'userSetting') {
                    setSelectedTabId('groups');
                  }
                }}
              >
                {lang.tr.servers}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={setting['editTabBar']}
            style={
              isSelf && selectedTabId !== 'groups' ? {} : { display: 'none' }
            }
          >
            {selectedTabId === 'userSetting' ? (
              <>
                <div
                  className={`${setting['confirmedButton']} ${
                    setting['blueBtn']
                  } ${
                    !userName ||
                    !userGender ||
                    !userCountry ||
                    !userBirthYear ||
                    !userBirthMonth ||
                    !userBirthDay
                      ? setting['disabled']
                      : ''
                  }`}
                  onClick={() => {
                    handleUpdateUser({
                      avatar: userAvatar,
                      avatarUrl: userAvatarUrl,
                      name: userName,
                      gender: userGender,
                      country: userCountry,
                      birthYear: userBirthYear,
                      birthMonth: userBirthMonth,
                      birthDay: userBirthDay,
                      signature: userSignature,
                    });
                    setSelectedTabId('about');
                  }}
                >
                  {lang.tr.confirm}
                </div>
                <div
                  className={setting['button']}
                  onClick={() => setSelectedTabId('about')}
                >
                  {lang.tr.cancel}
                </div>
              </>
            ) : (
              <div
                className={setting['button']}
                onClick={() => setSelectedTabId('userSetting')}
              >
                {lang.tr.editProfile}
              </div>
            )}
          </div>

          {/* Body */}
          <div
            className={`${setting['body']} ${
              isSelf ? setting['canEditeable'] : ''
            }`}
            style={selectedTabId === 'about' ? {} : { display: 'none' }}
          >
            {userSignature && (
              <div className={setting['userAboutMeShow']}>
                <div dangerouslySetInnerHTML={{ __html: userSignature }} />
              </div>
            )}
            <div className={setting['userProfileContent']}>
              <div className={setting['title']}>
                {lang.tr.recentlyJoinServer}
              </div>
              <div className={setting['serverItems']}>
                {isProfilePrivate
                  ? PrivateElement(
                      <>
                        {lang.tr.notPublicRecentServersTop}
                        <br />
                        {lang.tr.notPublicRecentServersBottom}
                      </>,
                    )
                  : recentServers.length === 0
                  ? PrivateElement(lang.tr.noRecentServers)
                  : recentServers.map((server) => (
                      <div
                        key={server.serverId}
                        className={setting['serverItem']}
                        onClick={() => handleServerSelect(userId, server)}
                      >
                        <div
                          className={setting['serverAvatarPicture']}
                          style={{
                            backgroundImage: `url(${server.avatarUrl})`,
                          }}
                        />
                        <div className={setting['serverBox']}>
                          <div className={setting['serverName']}>
                            {server.name}
                          </div>
                          <div className={setting['serverInfo']}>
                            <div
                              className={`${
                                isSelf && server.ownerId === userId
                                  ? setting['isOwner']
                                  : ''
                              }`}
                            />
                            <div className={setting['id']} />
                            <div className={setting['displayId']}>
                              {server.displayId}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
            <div className={`${setting['userProfileContent']}`}>
              <div className={setting['title']}>
                {lang.tr.recentlyEarnedBadges}
              </div>
              <div className={setting['badgeViewer']}>
                <BadgeListViewer badges={userBadges} maxDisplay={13} />
              </div>
            </div>
          </div>

          <div
            className={setting['body']}
            style={selectedTabId === 'groups' ? {} : { display: 'none' }}
          >
            <div className={setting['userProfileContent']}>
              <div className={`${popup['inputBox']}`}>
                <div className={`${popup['selectBox']}`}>
                  <select
                    value={serversView}
                    onChange={(e) => setServersView(e.target.value)}
                  >
                    <option value="joined">{lang.tr.joinedServers}</option>
                    <option value="favorite">{lang.tr.favoritedServers}</option>
                  </select>
                </div>
              </div>
              <div
                className={setting['serverItems']}
                style={serversView === 'joined' ? {} : { display: 'none' }}
              >
                {isProfilePrivate
                  ? PrivateElement(
                      <>
                        {lang.tr.notPublicJoinedServersTop}
                        <br />
                        {lang.tr.notPublicJoinedServersBottom}
                      </>,
                    )
                  : joinedServers.length === 0
                  ? PrivateElement(lang.tr.noJoinedServers)
                  : joinedServers.map((server) => (
                      <div
                        key={server.serverId}
                        className={setting['serverItem']}
                        onClick={() => handleServerSelect(userId, server)}
                      >
                        <div
                          className={setting['serverAvatarPicture']}
                          style={{
                            backgroundImage: `url(${server.avatarUrl})`,
                          }}
                        />
                        <div className={setting['serverBox']}>
                          <div className={setting['serverName']}>
                            {server.name}
                          </div>
                          <div
                            className={`${setting['serverInfo']} ${setting['around']}`}
                          >
                            <div
                              className={`
                                ${setting['permission']}
                                ${permission[userGender]} 
                                ${
                                  server.ownerId === targetId
                                    ? permission[`lv-6`]
                                    : permission[`lv-${server.permissionLevel}`]
                                }`}
                            />
                            <div className={setting['contributionBox']}>
                              <div className={setting['contributionIcon']} />
                              <div className={setting['contributionValue']}>
                                {server.contribution}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
              <div
                className={setting['serverItems']}
                style={serversView === 'favorite' ? {} : { display: 'none' }}
              >
                {isProfilePrivate
                  ? PrivateElement(
                      <>
                        {lang.tr.notPublicFavoriteServersTop}
                        <br />
                        {lang.tr.notPublicFavoriteServersBottom}
                      </>,
                    )
                  : favoriteServers.length === 0
                  ? PrivateElement(lang.tr.noFavoriteServers)
                  : favoriteServers.map((server) => (
                      <div
                        key={server.serverId}
                        className={setting['serverItem']}
                        onClick={() => handleServerSelect(userId, server)}
                      >
                        <div
                          className={setting['serverAvatarPicture']}
                          style={{
                            backgroundImage: `url(${server.avatarUrl})`,
                          }}
                        />
                        <div className={setting['serverBox']}>
                          <div className={setting['serverName']}>
                            {server.name}
                          </div>
                          <div
                            className={`${setting['serverInfo']} ${setting['around']}`}
                          >
                            <div
                              className={`
                              ${setting['permission']}
                              ${permission[userGender]} 
                              ${
                                server.ownerId === targetId
                                  ? permission[`lv-6`]
                                  : permission[`lv-${server.permissionLevel}`]
                              }`}
                            />
                            <div className={setting['contributionBox']}>
                              <div className={setting['contributionIcon']} />
                              <div className={setting['contributionValue']}>
                                {server.contribution}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          </div>

          <div
            className={setting['body']}
            style={selectedTabId === 'userSetting' ? {} : { display: 'none' }}
          >
            <div className={setting['userProfileContent']}>
              <div className={popup['col']}>
                <div className={popup['row']}>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <label
                      className={popup['label']}
                      htmlFor="profile-form-nickname"
                    >
                      {lang.tr.nickname}
                    </label>
                    <input
                      name="name"
                      type="text"
                      value={userName}
                      maxLength={32}
                      onChange={(e) =>
                        setUser((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <label
                      className={popup['label']}
                      htmlFor="profile-form-gender"
                    >
                      {lang.tr.gender}
                    </label>
                    <div
                      className={`${popup['selectBox']} ${popup['selectBoxMax']}`}
                    >
                      <select
                        value={userGender}
                        onChange={(e) =>
                          setUser((prev) => ({
                            ...prev,
                            gender: e.target.value as User['gender'],
                          }))
                        }
                      >
                        <option value="Male">{lang.tr.male}</option>
                        <option value="Female">{lang.tr.female}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className={popup['row']}>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <label
                      className={popup['label']}
                      htmlFor="profile-form-country"
                    >
                      {lang.tr.country}
                    </label>
                    <div className={popup['selectBox']}>
                      <select
                        value={userCountry}
                        onChange={(e) =>
                          setUser((prev) => ({
                            ...prev,
                            country: e.target.value,
                          }))
                        }
                      >
                        <option value="taiwan">{lang.tr.taiwan}</option>
                        <option value="china">{lang.tr.china}</option>
                        <option value="japan">{lang.tr.japan}</option>
                        <option value="korea">{lang.tr.korea}</option>
                        <option value="usa">{lang.tr.usa}</option>
                        <option value="uk">{lang.tr.uk}</option>
                        <option value="france">{lang.tr.france}</option>
                        <option value="germany">{lang.tr.germany}</option>
                        <option value="italy">{lang.tr.italy}</option>
                        <option value="spain">{lang.tr.spain}</option>
                        <option value="portugal">{lang.tr.portugal}</option>
                        <option value="brazil">{lang.tr.brazil}</option>
                        <option value="argentina">{lang.tr.argentina}</option>
                        <option value="mexico">{lang.tr.mexico}</option>
                        <option value="colombia">{lang.tr.colombia}</option>
                        <option value="chile">{lang.tr.chile}</option>
                        <option value="peru">{lang.tr.peru}</option>
                        <option value="venezuela">{lang.tr.venezuela}</option>
                        <option value="bolivia">{lang.tr.bolivia}</option>
                        <option value="ecuador">{lang.tr.ecuador}</option>
                        <option value="paraguay">{lang.tr.paraguay}</option>
                        <option value="uruguay">{lang.tr.uruguay}</option>
                        <option value="nigeria">{lang.tr.nigeria}</option>
                        <option value="southAfrica">
                          {lang.tr.southAfrica}
                        </option>
                        <option value="india">{lang.tr.india}</option>
                        <option value="indonesia">{lang.tr.indonesia}</option>
                        <option value="malaysia">{lang.tr.malaysia}</option>
                        <option value="philippines">
                          {lang.tr.philippines}
                        </option>
                        <option value="thailand">{lang.tr.thailand}</option>
                        <option value="vietnam">{lang.tr.vietnam}</option>
                        <option value="turkey">{lang.tr.turkey}</option>
                        <option value="saudiArabia">
                          {lang.tr.saudiArabia}
                        </option>
                        <option value="qatar">{lang.tr.qatar}</option>
                        <option value="kuwait">{lang.tr.kuwait}</option>
                        <option value="oman">{lang.tr.oman}</option>
                        <option value="bahrain">{lang.tr.bahrain}</option>
                        <option value="algeria">{lang.tr.algeria}</option>
                        <option value="morocco">{lang.tr.morocco}</option>
                        <option value="tunisia">{lang.tr.tunisia}</option>
                        <option value="nigeria">{lang.tr.nigeria}</option>
                      </select>
                    </div>
                  </div>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <label
                      className={popup['label']}
                      htmlFor="profile-form-birthdate"
                    >
                      {lang.tr.birthdate}
                    </label>
                    <div className={popup['row']}>
                      <div className={popup['selectBox']}>
                        <select
                          id="birthYear"
                          value={userBirthYear}
                          onChange={(e) =>
                            setUser((prev) => ({
                              ...prev,
                              birthYear: Number(e.target.value),
                            }))
                          }
                        >
                          {yearOptions.map((year) => (
                            <option
                              key={year}
                              value={year}
                              disabled={year > CURRENT_YEAR}
                            >
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popup['selectBox']}>
                        <select
                          className={popup['input']}
                          id="birthMonth"
                          value={userBirthMonth}
                          onChange={(e) =>
                            setUser((prev) => ({
                              ...prev,
                              birthMonth: Number(e.target.value),
                            }))
                          }
                        >
                          {monthOptions.map((month) => (
                            <option
                              key={month}
                              value={month}
                              disabled={
                                userBirthYear === CURRENT_YEAR &&
                                month > CURRENT_MONTH
                              }
                            >
                              {month.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={popup['selectBox']}>
                        <select
                          className={popup['input']}
                          id="birthDay"
                          value={userBirthDay}
                          onChange={(e) =>
                            setUser((prev) => ({
                              ...prev,
                              birthDay: Number(e.target.value),
                            }))
                          }
                        >
                          {dayOptions.map((day) => (
                            <option
                              key={day}
                              value={day}
                              disabled={
                                userBirthYear === CURRENT_YEAR &&
                                userBirthMonth === CURRENT_MONTH &&
                                day > CURRENT_DAY
                              }
                            >
                              {day.toString().padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <label
                    className={popup['label']}
                    htmlFor="profile-form-signature"
                  >
                    {lang.tr.signature}
                  </label>
                  <div className={`${popup['input']} ${setting['inputBox']}`}>
                    <div
                      className={setting['inputArea']}
                      id="profile-form-signature"
                      contentEditable
                      suppressContentEditableWarning
                      ref={signatureDivRef}
                      onFocus={() => {
                        setIsEmojiBoxVisible(true);
                      }}
                      onBlur={(e: React.FocusEvent<HTMLDivElement>) => {
                        setTimeout(() => {
                          const targetElement = (e.relatedTarget ||
                            document.activeElement) as HTMLElement | null;
                          if (
                            (emojiBoxContainerRef.current &&
                              targetElement &&
                              emojiBoxContainerRef.current.contains(
                                targetElement,
                              )) ||
                            (emojiIconsWrapperRef.current &&
                              targetElement &&
                              emojiIconsWrapperRef.current.contains(
                                targetElement,
                              ))
                          ) {
                            if (!isEmojiBoxVisible) setIsEmojiBoxVisible(true);
                            return;
                          }
                          if (
                            targetElement &&
                            (targetElement.tagName === 'INPUT' ||
                              targetElement.tagName === 'SELECT' ||
                              targetElement.tagName === 'TEXTAREA') &&
                            targetElement !== signatureDivRef.current
                          ) {
                            setIsEmojiBoxVisible(false);
                          }
                          if (
                            signatureDivRef.current &&
                            user.signature !== signatureDivRef.current.innerHTML
                          ) {
                            setUser((prev) => ({
                              ...prev,
                              signature: signatureDivRef.current!.innerHTML,
                            }));
                          }
                        }, 0);
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLDivElement;
                        setUser((prev) => ({
                          ...prev,
                          signature: target.innerHTML,
                        }));
                        lastCursorPosition.current = null;
                      }}
                      onKeyDown={handleSignatureKeyDown}
                      onDragStart={(e) => e.preventDefault()}
                    ></div>
                    <div
                      className={`${setting['emojiBox']} ${
                        isEmojiBoxVisible ? setting['emojiBoxVisible'] : ''
                      }`}
                      ref={emojiBoxContainerRef}
                    >
                      <div
                        className={setting['emojiButtonIcon']}
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        onClick={() => {
                          setIsEmojiPickerVisible((prevVisible) => {
                            const openingPicker = !prevVisible;
                            if (openingPicker) {
                              if (
                                document.activeElement ===
                                signatureDivRef.current
                              ) {
                                const selection = window.getSelection();
                                if (selection && selection.rangeCount > 0) {
                                  const range = selection.getRangeAt(0);
                                  if (
                                    signatureDivRef.current &&
                                    signatureDivRef.current.contains(
                                      range.startContainer,
                                    )
                                  ) {
                                    lastCursorPosition.current =
                                      range.startOffset;
                                  }
                                }
                              }
                              signatureDivRef.current?.focus();
                            }
                            return openingPicker;
                          });
                          if (!isEmojiBoxVisible) {
                            setIsEmojiBoxVisible(true);
                          }
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div
                  className={`${popup['inputBox']} ${popup['col']} ${popup['disabled']}`}
                >
                  <label
                    className={popup['label']}
                    htmlFor="profile-form-about"
                  >
                    {lang.tr.about}
                  </label>
                  <textarea name="about" />
                </div>
              </div>
            </div>
          </div>
          {isEmojiPickerVisible && (
            <div
              className={setting['emojiIconsWrapper']}
              ref={emojiIconsWrapperRef}
            >
              <div className={setting['emojiIconsContent']}>
                {emojiList.map((emoji) => (
                  <div key={emoji.id} className={setting['emojiIconBox']}>
                    <div
                      className={setting['emojiIcon']}
                      style={{
                        backgroundImage: `url('/vipemotions/${emoji.src}.png')`,
                      }}
                      title={emoji.name}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => {
                        if (signatureDivRef.current) {
                          signatureDivRef.current.focus();
                          const emojiImgTag = `<img src="/vipemotions/${emoji.src}.png" alt="${emoji.name}" data-emoji-name="${emoji.name}" data-emoji-src="${emoji.src}" style="width: 17px; height: 17px; vertical-align: middle; margin: 0 1px;" contenteditable="false" draggable="false" />`;
                          const selection = window.getSelection();
                          if (!selection) return;
                          let range: Range;
                          if (
                            selection.rangeCount > 0 &&
                            signatureDivRef.current.contains(
                              selection.anchorNode,
                            )
                          ) {
                            range = selection.getRangeAt(0);
                            range.deleteContents();
                          } else {
                            range = document.createRange();
                            range.selectNodeContents(signatureDivRef.current);
                            range.collapse(false);
                          }
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = emojiImgTag;
                          const imgNodeToInsert = tempDiv.firstChild;
                          if (imgNodeToInsert) {
                            range.insertNode(imgNodeToInsert);
                            range.setStartAfter(imgNodeToInsert);
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);
                          }
                          setUser((prev) => ({
                            ...prev,
                            signature: signatureDivRef.current!.innerHTML,
                          }));
                          lastCursorPosition.current = null;
                        }
                      }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className={setting['emojiIconsFooter']}>
                <div
                  className={`${setting['emojiIconsFooterButtonIcon']} ${setting['emojiHumanIcon']} ${setting['selected']}`}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className={popup['popupFooter']}>
          {!isFriend && !isSelf && (
            <div
              className={`${setting['confirmedButton']} ${setting['greenBtn']}`}
              onClick={() => handleOpenApplyFriend(userId, targetId)}
            >
              {lang.tr.addFriend}
            </div>
          )}
          <div className={popup['button']} onClick={() => handleClose()}>
            {lang.tr.close /** CLOSE **/}
          </div>
        </div>
      </div>
    );
  },
);

UserSettingPopup.displayName = 'UserSettingPopup';

export default UserSettingPopup;
