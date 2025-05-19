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
  cleanHtmlEndingBr,
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
    const justSavedRef = useRef<boolean>(false);
    const forceBlurRef = useRef<boolean>(false);

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

      const currentLiveHtmlFromDiv = cleanHtmlEndingBr(
        signatureDivRef.current.innerHTML,
      );

      const signatureWithPlaceholders = convertHtmlToEmojiPlaceholder(
        currentLiveHtmlFromDiv,
      );

      const currentSignatureFromProp = user.signature || '';

      if (signatureWithPlaceholders === currentSignatureFromProp) {
        const expectedStandardHtml = convertEmojiPlaceholderToHtml(
          currentSignatureFromProp,
          emojiList,
        );
        if (signatureDivRef.current.innerHTML !== expectedStandardHtml) {
          setSignatureInputHtml(expectedStandardHtml);
        }
        forceBlurRef.current = true;
        signatureDivRef.current?.blur();
        setTimeout(() => {
          forceBlurRef.current = false;
        }, 0);
        return;
      }

      if (signatureWithPlaceholders.length > MAXLENGTH) {
        const signatureTooLongMessage =
          (lang.tr as { signatureTooLong?: string }).signatureTooLong ||
          `Signature too long. Max ${MAXLENGTH} chars. Reverting.`;
        alert(signatureTooLongMessage);
        const originalHtml = convertEmojiPlaceholderToHtml(
          currentSignatureFromProp,
          emojiList,
        );
        setSignatureInputHtml(originalHtml);
        return;
      }

      justSavedRef.current = true;
      forceBlurRef.current = true;

      const htmlToDisplayAfterSave = convertEmojiPlaceholderToHtml(
        signatureWithPlaceholders,
        emojiList,
      );
      setSignatureInputHtml(htmlToDisplayAfterSave);

      handleChangeSignature(signatureWithPlaceholders, userId);
      signatureDivRef.current?.blur();

      setTimeout(() => {
        justSavedRef.current = false;
        forceBlurRef.current = false;
      }, 0);
    }, [user.signature, lang, MAXLENGTH, userId, handleChangeSignature]);

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
        e.preventDefault();
        if (isComposing) return;
        if (e.shiftKey) {
          return;
        }
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
      const capturedSignatureDiv = signatureDivRef.current;

      const selectionChangeHandler = () => {
        handleEmojiSelectionChange(
          signatureDivRef.current,
          emoji['selectedEmojiImage'],
        );
      };

      if (capturedSignatureDiv) {
        document.addEventListener('selectionchange', selectionChangeHandler);
      }

      return () => {
        if (capturedSignatureDiv) {
          document.removeEventListener(
            'selectionchange',
            selectionChangeHandler,
          );
          const allEmojiImages =
            capturedSignatureDiv.querySelectorAll<HTMLImageElement>(
              'img[data-emoji-src]',
            );
          allEmojiImages.forEach((img) => {
            img.classList.remove(emoji['selectedEmojiImage']);
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
      const propSignatureValue = user.signature || '';
      const propSignatureHtml = convertEmojiPlaceholderToHtml(
        propSignatureValue,
        emojiList,
      );
      const cleanedPropSignatureHtml = cleanHtmlEndingBr(propSignatureHtml);

      setSignatureInputHtml((currentLocalHtml) => {
        if (cleanedPropSignatureHtml !== currentLocalHtml) {
          return cleanedPropSignatureHtml;
        }
        return currentLocalHtml;
      });
    }, [user.signature]);

    useEffect(() => {
      if (signatureDivRef.current) {
        const domHtmlCleaned = cleanHtmlEndingBr(
          signatureDivRef.current.innerHTML,
        );

        if (domHtmlCleaned !== signatureInputHtml) {
          const selectionState: { range: Range | null } = { range: null };
          const currentFocus = document.activeElement;
          const isFocusedOnDiv = signatureDivRef.current === currentFocus;

          if (isFocusedOnDiv && !forceBlurRef.current) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const currentRange = selection.getRangeAt(0);
              if (
                signatureDivRef.current.contains(
                  currentRange.commonAncestorContainer,
                )
              ) {
                selectionState.range = currentRange.cloneRange();
              }
            }
          }

          signatureDivRef.current.innerHTML = signatureInputHtml;

          if (isFocusedOnDiv && !forceBlurRef.current && selectionState.range) {
            const selection = window.getSelection();
            if (selection) {
              try {
                selection.removeAllRanges();
                selection.addRange(selectionState.range);
              } catch (e) {
                console.error('Error restoring selection:', e);
                const newRange = document.createRange();
                newRange.selectNodeContents(signatureDivRef.current);
                newRange.collapse(false);
                selection.removeAllRanges();
                selection.addRange(newRange);
              }
            }
          } else if (isFocusedOnDiv && !forceBlurRef.current) {
            const selection = window.getSelection();
            if (selection) {
              const newRange = document.createRange();
              newRange.selectNodeContents(signatureDivRef.current);
              newRange.collapse(false);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        }
      }
    }, [signatureInputHtml, forceBlurRef]);

    const handleSignatureInput = (e: React.FormEvent<HTMLDivElement>) => {
      const currentHtmlFromInput = cleanHtmlEndingBr(e.currentTarget.innerHTML);
      if (currentHtmlFromInput !== signatureInputHtml) {
        setSignatureInputHtml(currentHtmlFromInput);
      }
    };

    const handleSignatureBlur = () => {
      setTimeout(() => {
        if (justSavedRef.current || forceBlurRef.current) {
          return;
        }
        if (
          (emojiIconsWrapperRef.current &&
            emojiIconsWrapperRef.current.contains(
              document.activeElement as Node,
            )) ||
          (emojiButtonRef.current &&
            emojiButtonRef.current.contains(document.activeElement as Node))
        ) {
          return;
        }
        if (signatureDivRef.current) {
          const currentLiveHtml = cleanHtmlEndingBr(
            signatureDivRef.current.innerHTML,
          );
          const originalSignatureHtml = convertEmojiPlaceholderToHtml(
            user.signature || '',
            emojiList,
          );
          if (currentLiveHtml !== originalSignatureHtml) {
            setSignatureInputHtml(originalSignatureHtml);
          }
        }
      }, 0);
    };

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
              onInput={handleSignatureInput}
              onBlur={handleSignatureBlur}
              onKeyDown={handleSignatureKeyDownForDiv}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onDragStart={(e) => e.preventDefault()}
            />
            <div
              ref={emojiButtonRef}
              className={`${emoji['emojiButtonIcon']} ${friendPage['emojiBtn']}`}
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
                    if (!signatureDivRef.current) return;
                    insertEmojiIntoDiv(
                      eItem,
                      signatureDivRef.current,
                      (rawNewHtmlFromUtil) => {
                        const cleanedNewHtml =
                          cleanHtmlEndingBr(rawNewHtmlFromUtil);
                        setSignatureInputHtml((prevHtml) =>
                          prevHtml !== cleanedNewHtml
                            ? cleanedNewHtml
                            : prevHtml,
                        );
                      },
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
