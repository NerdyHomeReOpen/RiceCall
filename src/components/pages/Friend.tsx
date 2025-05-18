import dynamic from 'next/dynamic';
import React, { useState, useEffect, useCallback, useRef } from 'react';

// CSS
import friendPage from '@/styles/pages/friend.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import emoji from '@/styles/viewers/emoji.module.css';

// Components
import FriendListViewer from '@/components/viewers/FriendList';
import BadgeListViewer from '@/components/viewers/BadgeList';

// Types
import { User, UserFriend, FriendGroup } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import {
  emojiList,
  convertHtmlToEmojiPlaceholder,
  convertEmojiPlaceholderToHtml,
  handleEmojiKeyDown,
  insertEmojiIntoDiv,
  handleEmojiSelectionChange,
} from '@/utils/emoji';

interface FriendPageProps {
  user: User;
  friends: UserFriend[];
  friendGroups: FriendGroup[];
  display: boolean;
}

const FriendPageComponent: React.FC<FriendPageProps> = React.memo(
  ({ user, friends, friendGroups, display }) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const signatureDivRef = useRef<HTMLDivElement>(null);
    const lastCursorPosition = useRef<number | null>(null);
    const emojiIconsWrapperRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLDivElement>(null);

    // Constants
    const MAXLENGTH = 300;

    // States
    const [isComposing, setIsComposing] = useState<boolean>(false);
    const [sidebarWidth, setSidebarWidth] = useState<number>(270);
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [signatureInputHtml, setSignatureInputHtml] = useState<string>('');
    const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

    // Variables
    const {
      userId,
      name: userName,
      avatarUrl: userAvatarUrl,
      level: userLevel,
      vip: userVip,
      badges: userBadges,
    } = user;

    // Handlers
    const handleChangeSignature = useCallback(
      (signature: User['signature'], userId: User['userId']) => {
        if (!socket) return;
        socket.send.updateUser({ user: { signature }, userId });
      },
      [socket],
    );

    const handleSaveSignature = useCallback(() => {
      if (!signatureDivRef.current) return;
      const currentHtml = signatureDivRef.current.innerHTML;
      const signatureWithPlaceholders =
        convertHtmlToEmojiPlaceholder(currentHtml);

      if (signatureWithPlaceholders === (user.signature || '')) {
        signatureDivRef.current?.blur();
        return;
      }

      if (signatureWithPlaceholders.length > MAXLENGTH) {
        const signatureTooLongMessage =
          (lang.tr as { signatureTooLong?: string }).signatureTooLong ||
          `Signature too long. Max ${MAXLENGTH} chars. Reverting.`;
        alert(signatureTooLongMessage);
        const originalHtml = convertEmojiPlaceholderToHtml(
          user.signature || '',
          emojiList,
        );
        setSignatureInputHtml(originalHtml);
        return;
      }
      handleChangeSignature(signatureWithPlaceholders, userId);
      signatureDivRef.current?.blur();
    }, [
      user.signature,
      lang,
      MAXLENGTH,
      userId,
      setSignatureInputHtml,
      handleChangeSignature,
    ]);

    const handleSignatureKeyDownForDiv = (
      e: React.KeyboardEvent<HTMLDivElement>,
    ) => {
      const handledByEmojiUtil = handleEmojiKeyDown(
        e,
        signatureDivRef.current,
        (newHtml) => setSignatureInputHtml(newHtml),
      );
      if (handledByEmojiUtil) {
        return;
      }
      if (e.key === 'Enter') {
        if (isComposing) return;
        if (e.shiftKey) {
          return;
        }
        e.preventDefault();
        handleSaveSignature();
      }
    };

    const handleResize = useCallback(
      (e: MouseEvent) => {
        if (!isResizing) return;
        const newWidth = e.clientX;
        setSidebarWidth(newWidth);
      },
      [isResizing],
    );

    // Effects
    useEffect(() => {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', () => setIsResizing(false));
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', () => setIsResizing(false));
      };
    }, [handleResize]);

    useEffect(() => {
      if (!lang) return;
      ipcService.discord.updatePresence({
        details: lang.tr.RPCFriendPage,
        state: `${lang.tr.RPCUser} ${userName}`,
        largeImageKey: 'app_icon',
        largeImageText: 'RC Voice',
        smallImageKey: 'home_icon',
        smallImageText: lang.tr.RPCFriend,
        timestamp: Date.now(),
        buttons: [
          {
            label: lang.tr.RPCJoinServer,
            url: 'https://discord.gg/adCWzv6wwS',
          },
        ],
      });
    }, [lang, userName]);

    useEffect(() => {
      const initialHtml = convertEmojiPlaceholderToHtml(
        user.signature || '',
        emojiList,
      );
      setSignatureInputHtml(initialHtml);
    }, [user.signature]);

    useEffect(() => {
      if (
        signatureDivRef.current &&
        signatureDivRef.current.innerHTML !== signatureInputHtml
      ) {
        let selection: Selection | null = null;
        let range: Range | null = null;
        selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0).cloneRange();
        }
        signatureDivRef.current.innerHTML = signatureInputHtml;
        if (
          range &&
          selection &&
          signatureDivRef.current.contains(range.startContainer)
        ) {
          try {
            selection.removeAllRanges();
            selection.addRange(range);
          } catch {
            const newRange = document.createRange();
            newRange.selectNodeContents(signatureDivRef.current);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    }, [signatureInputHtml]);

    useEffect(() => {
      const selectionChangeHandler = () => {
        handleEmojiSelectionChange(
          signatureDivRef.current,
          friendPage['selectedEmojiImage'],
        );
      };

      document.addEventListener('selectionchange', selectionChangeHandler);
      const currentSignatureDiv = signatureDivRef.current;

      return () => {
        document.removeEventListener('selectionchange', selectionChangeHandler);
        if (currentSignatureDiv) {
          const allEmojiImages =
            currentSignatureDiv.querySelectorAll<HTMLImageElement>(
              'img[data-emoji-src]',
            );
          allEmojiImages.forEach((img) => {
            img.classList.remove(friendPage['selectedEmojiImage']);
          });
        }
      };
    }, []);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          isEmojiPickerVisible &&
          emojiIconsWrapperRef.current &&
          !emojiIconsWrapperRef.current.contains(event.target as Node) &&
          emojiButtonRef.current &&
          !emojiButtonRef.current.contains(event.target as Node)
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
        signatureDivRef.current.innerHTML !== signatureInputHtml
      ) {
        let selection: Selection | null = null;
        let range: Range | null = null;
        selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0).cloneRange();
        }
        signatureDivRef.current.innerHTML = signatureInputHtml;
        if (
          range &&
          selection &&
          signatureDivRef.current.contains(range.startContainer)
        ) {
          try {
            selection.removeAllRanges();
            selection.addRange(range);
          } catch {
            const newRange = document.createRange();
            newRange.selectNodeContents(signatureDivRef.current);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    }, [signatureInputHtml]);

    return (
      <div
        className={friendPage['friendWrapper']}
        style={display ? {} : { display: 'none' }}
      >
        {/* Header */}
        <header className={friendPage['friendHeader']}>
          <div
            className={friendPage['avatarPicture']}
            style={{ backgroundImage: `url(${userAvatarUrl})` }}
          />
          <div className={friendPage['baseInfoBox']}>
            <div className={friendPage['container']}>
              <div className={friendPage['levelIcon']} />
              <div
                className={`${grade['grade']} ${
                  grade[`lv-${Math.min(56, userLevel)}`]
                }`}
              />
              <div className={friendPage['wealthIcon']} />
              <div className={friendPage['wealthValue']}>0</div>
              {userVip > 0 && (
                <div
                  className={`${vip['vipIcon']} ${vip[`vip-small-${userVip}`]}`}
                />
              )}
            </div>
            <div
              className={`${friendPage['container']} ${friendPage['myBadges']}`}
            >
              <BadgeListViewer badges={userBadges} maxDisplay={5} />
            </div>
          </div>
          <div className={`${friendPage['signatureBox']}`}>
            <div
              ref={signatureDivRef}
              className={friendPage['signatureInput']}
              contentEditable
              suppressContentEditableWarning
              data-placeholder-text={lang.tr.signaturePlaceholder}
              onInput={(e) => {
                setSignatureInputHtml(e.currentTarget.innerHTML);
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (
                    (emojiIconsWrapperRef.current &&
                      emojiIconsWrapperRef.current.contains(
                        document.activeElement as Node,
                      )) ||
                    (emojiButtonRef.current &&
                      emojiButtonRef.current.contains(
                        document.activeElement as Node,
                      ))
                  ) {
                    return;
                  }
                  if (signatureDivRef.current) {
                    const currentLiveHtml = signatureDivRef.current.innerHTML;
                    const savedSignatureAsHtml = convertEmojiPlaceholderToHtml(
                      user.signature || '',
                      emojiList,
                    );
                    if (currentLiveHtml !== savedSignatureAsHtml) {
                      setSignatureInputHtml(savedSignatureAsHtml);
                    }
                  }
                }, 0);
              }}
              onKeyDown={handleSignatureKeyDownForDiv}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onDragStart={(e) => e.preventDefault()}
            />
            <div
              ref={emojiButtonRef}
              className={emoji['emojiButtonIcon']}
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                setIsEmojiPickerVisible((prevVisible) => {
                  const openingPicker = !prevVisible;
                  if (openingPicker) {
                    signatureDivRef.current?.focus();
                  }
                  return openingPicker;
                });
              }}
            ></div>
            <div
              className={friendPage['enterButtonIconBox']}
              onClick={handleSaveSignature}
            >
              <div className={friendPage['enterButtonIcon']}></div>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className={friendPage['friendContent']}>
          {/* Left Sidebar */}
          <div
            className={friendPage['sidebar']}
            style={{ width: `${sidebarWidth}px` }}
          >
            <FriendListViewer
              friendGroups={friendGroups}
              friends={friends}
              user={user}
            />
          </div>
          {/* Resize Handle */}
          <div
            className="resizeHandle"
            onMouseDown={() => setIsResizing(true)}
            onMouseUp={() => setIsResizing(false)}
          />
          {/* Right Content */}
          <div className={friendPage['mainContent']}>
            <div className={friendPage['header']}>{lang.tr.friendActive}</div>
          </div>
        </main>
        {isEmojiPickerVisible && (
          <div
            className={emoji['emojiIconsWrapper']}
            ref={emojiIconsWrapperRef}
            style={{
              bottom: 'unset',
              top: '6.5rem',
              right: '18rem',
            }}
          >
            <div className={emoji['emojiIconsContent']}>
              {emojiList.map((eItem) => (
                <div
                  key={eItem.id}
                  className={emoji['emojiIconBox']}
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    insertEmojiIntoDiv(
                      eItem,
                      signatureDivRef.current,
                      (newHtml) => setSignatureInputHtml(newHtml),
                      (pos) => (lastCursorPosition.current = pos),
                    );
                  }}
                >
                  <div
                    className={emoji['emojiIcon']}
                    style={{
                      backgroundImage: `url('/vipemotions/${eItem.src}.png')`,
                    }}
                    title={eItem.name}
                  ></div>
                </div>
              ))}
            </div>
            <div className={emoji['emojiIconsFooter']}>
              <div
                className={`${emoji['emojiIconsFooterButtonIcon']} ${emoji['emojiHumanIcon']} ${emoji['selected']}`}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

FriendPageComponent.displayName = 'FriendPageComponent';

const FriendPage = dynamic(() => Promise.resolve(FriendPageComponent), {
  ssr: false,
});

export default FriendPage;
