/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  ChangeEvent,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import { ChevronDown, ChevronUp, Search, Check, X } from 'lucide-react';

// Components
import MarkdownViewer from '@/components/viewers/MarkdownViewer';

// Types
import {
  type ServerApplication,
  type Server,
  type Member,
  type User,
  popupType,
} from '@/types';

// Utils
import { getPermissionText } from '@/utils/formatters';
import { validateName, validateDescription } from './CreateServerModal';

// Providers
import { useSocket } from '@/providers/SocketProvider';
import { useContextMenu } from '@/providers/ContextMenuProvider';
import { useLanguage } from '@/providers/LanguageProvider';

// Services
import { ipcService } from '@/services/ipc.service';

// CSS
import EditServer from '../../styles/popups/editServer.module.css';
import Popup from '../../styles/common/popup.module.css';
import permission from '@/styles/common/permission.module.css';

interface SortState {
  field:
    | 'name'
    | 'permission'
    | 'contribution'
    | 'joinDate'
    | 'applyContribution';
  direction: 'asc' | 'desc';
}

type SortFunction = (a: Member, b: Member, direction: number) => number;

interface ServerSettingModalProps {
  server: Server;
  mainUserId: string;
}

const EditServerModal: React.FC<ServerSettingModalProps> = React.memo(
  (initialData: ServerSettingModalProps) => {
    const { server, mainUserId } = initialData;

    // Socket
    const socket = useSocket();

    // Context Menu
    const contextMenu = useContextMenu();
    const lang = useLanguage();

    const [markdownContent, setMarkdownContent] = useState<string>('');
    const setServerIcon = useRef<HTMLInputElement>(null);
    const [pendingIconFile, setPendingIconFile] = useState<{
      data: string;
      type: string;
    } | null>(null);

    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [applications, setApplications] = useState<ServerApplication[]>([]);
    const [applicationContextMenu, setApplicationContextMenu] = useState<{
      x: number;
      y: number;
      application: any;
    } | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [memberContextMenu, setMemberContextMenu] = useState<{
      x: number;
      y: number;
      member: any;
    } | null>(null);
    const [searchText, setSearchText] = useState<string>('');
    const [blockPage, setBlockPage] = useState<number>(1);

    const [originalServerData, setOriginalServerData] = useState<Server>({
      ...server,
    });
    const [editingServerData, setEditingServerData] = useState<Server>({
      ...server,
    });
    const [changeState, setChangeState] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [sortState, setSortState] = useState<SortState>({
      field: 'permission',
      direction: 'desc',
    });

    const handleSort = useCallback(
      (
        field:
          | 'name'
          | 'permission'
          | 'contribution'
          | 'joinDate'
          | 'applyContribution',
      ) => {
        if (sortState.field === field) {
          setSortState((prev) => ({
            ...prev,
            direction: prev.direction === 'asc' ? 'desc' : 'asc',
          }));
        } else {
          setSortState({
            field,
            direction: 'desc',
          });
        }
      },
      [sortState.field],
    );

    const handleServerIconChange = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (!event.target.files || !event.target.files[0]) return;

      const file = event.target.files[0];

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        console.error(lang.tr.fileSizeError);
        return;
      }

      // Validate file type
      if (
        !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(
          file.type,
        )
      ) {
        console.error(lang.tr.fileTypeError);
        return;
      }

      try {
        // Read file as base64 for preview and later upload
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Data = e.target?.result?.toString();

          if (base64Data) {
            setPendingIconFile({
              data: base64Data.split(',')[1],
              type: file.type,
            });

            // Update editing state for change detection
            setEditingServerData((prev) => ({
              ...prev,
              pendingIconUpdate: true, // Flag for change detection
            }));
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('讀取檔案時發生錯誤:', error);
      }
    };

    useEffect(() => {
      if (!socket) return;
      const ObjectToArray = (obj: Record<string, any>): any[] => {
        return Object.keys(obj).map((key) => obj[key]);
      };

      if (activeTabIndex === 2) {
        const filteredMembers = ObjectToArray(server?.members || {}).filter(
          (member) => member.createdAt !== 0,
        );
        setMembers(filteredMembers);
      }
    }, [activeTabIndex, socket]);

    const handleMemberContextMenu = (e: React.MouseEvent, member: any) => {
      e.preventDefault();

      // Get the scroll container element (table body)
      const scrollContainer = e.currentTarget.closest('.overflow-y-auto');

      // Calculate scroll offsets
      const scrollOffset = scrollContainer
        ? {
            x: scrollContainer.scrollLeft,
            y: scrollContainer.scrollTop,
          }
        : { x: 0, y: 0 };

      // Get the container's position relative to viewport
      const containerRect = scrollContainer?.getBoundingClientRect() || {
        left: 0,
        top: 0,
      };

      // Add offset to position menu below cursor
      const MENU_OFFSET = { x: 150, y: 110 }; // Small offset for visual balance

      // Calculate final coordinates
      const x = e.clientX - containerRect.left + scrollOffset.x + MENU_OFFSET.x;
      const y = e.clientY - containerRect.top + scrollOffset.y + MENU_OFFSET.y;

      setMemberContextMenu({
        x,
        y,
        member,
      });
    };

    const handleApplicationContextMenu = (
      e: React.MouseEvent,
      application: any,
    ) => {
      e.preventDefault();

      // Get the scroll container element (table body)
      const scrollContainer = e.currentTarget.closest('.overflow-y-auto');

      // Calculate scroll offsets
      const scrollOffset = scrollContainer
        ? {
            x: scrollContainer.scrollLeft,
            y: scrollContainer.scrollTop,
          }
        : { x: 0, y: 0 };

      // Get the container's position relative to viewport
      const containerRect = scrollContainer?.getBoundingClientRect() || {
        left: 0,
        top: 0,
      };

      // Add offset to position menu below cursor
      const MENU_OFFSET = { x: 150, y: 110 }; // Small offset for visual balance

      // Calculate final coordinates
      const x = e.clientX - containerRect.left + scrollOffset.x + MENU_OFFSET.x;
      const y = e.clientY - containerRect.top + scrollOffset.y + MENU_OFFSET.y;

      setApplicationContextMenu({
        x,
        y,
        application,
      });
    };

    const handleApplicationAction = (action: 'accept' | 'reject') => {
      if (!applicationContextMenu?.application) return;

      // 這裡需修改
      // socket?.emit('handleApplication', {
      //   sessionId: sessionId,
      //   serverId: server?.id,
      //   applicationId: applicationContextMenu.application?.id,
      //   action: action,
      // });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const nameError =
          editingServerData?.name && validateName(editingServerData?.name);
        const descriptionError = validateDescription(
          editingServerData?.description,
        );

        const newErrors = {
          name: nameError,
          description: descriptionError,
        };
        setErrors(newErrors);

        if (Object.values(newErrors).some((error) => error)) return;

        const updates: Partial<Server> = {};

        if (editingServerData?.name !== originalServerData?.name) {
          updates.name = editingServerData?.name;
        }
        if (editingServerData?.slogan !== originalServerData?.slogan) {
          updates.slogan = editingServerData?.slogan;
        }
        if (
          editingServerData?.description !== originalServerData?.description
        ) {
          updates.description = editingServerData?.description;
        }
        if (
          markdownContent.trim() !==
          (originalServerData?.announcement || '').trim()
        ) {
          updates.announcement = markdownContent;
        }

        if (
          editingServerData?.settings?.visibility !==
          originalServerData?.settings?.visibility
        ) {
          updates.settings = {
            ...originalServerData?.settings,
            visibility: editingServerData?.settings?.visibility,
          };
        }

        if (pendingIconFile) {
          updates.avatar = `data:${pendingIconFile?.type};base64,${pendingIconFile.data}`;
        }

        if (Object.keys(updates).length === 0) {
          handleClose();
          return;
        }

        socket?.send.updateServer?.({
          server: {
            id: server?.id,
            ...updates,
          },
        });

        setOriginalServerData({
          ...editingServerData,
          announcement: markdownContent,
        });
        handleClose();
      } catch (error) {
        console.error(lang.tr.updateServerError, error);
      }
    };

    const findDifferencesDeep = (
      obj1: Record<string, any>,
      obj2: Record<string, any>,
      prefix = '',
    ): string[] => {
      const allKeys = new Set([
        ...Object.keys(obj1 || {}),
        ...Object.keys(obj2 || {}),
      ]);

      return Array.from(allKeys).reduce((acc, key) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value1 = obj1[key];
        const value2 = obj2[key];

        if (typeof value1 === 'string' && typeof value2 === 'string') {
          if (value1.trim() !== value2.trim()) {
            acc.push(fullKey);
          }
        } else if (
          value1 &&
          value2 &&
          typeof value1 === 'object' &&
          typeof value2 === 'object'
        ) {
          acc.push(...findDifferencesDeep(value1, value2, fullKey));
        } else if (value1 !== value2) {
          acc.push(fullKey);
        }

        return acc;
      }, [] as string[]);
    };

    const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

    useEffect(() => {
      setMarkdownContent(server?.announcement || '');
    }, [server?.announcement]);

    useEffect(() => {
      const findDifferencesDeep = (
        obj1: Record<string, any> = {},
        obj2: Record<string, any> = {},
        prefix = '',
      ): string[] => {
        const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

        return Array.from(allKeys).reduce((acc, key) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          const value1 = obj1[key];
          const value2 = obj2[key];

          if (typeof value1 === 'string' && typeof value2 === 'string') {
            if (value1.trim() !== value2.trim()) acc.push(fullKey);
          } else if (
            value1 &&
            value2 &&
            typeof value1 === 'object' &&
            typeof value2 === 'object'
          ) {
            acc.push(...findDifferencesDeep(value1, value2, fullKey));
          } else if (value1 !== value2) {
            acc.push(fullKey);
          }

          return acc;
        }, [] as string[]);
      };

      const dif = findDifferencesDeep(server, editingServerData);

      if (markdownContent.trim() !== (server?.announcement || '').trim())
        dif.push('announcement');
      if (pendingIconFile) dif.push('avatar');

      setChangeState(
        dif
          .map((key) => {
            switch (key) {
              case 'name':
                return lang.tr.name;
              case 'slogan':
                return lang.tr.slogan;
              case 'type':
                return lang.tr.type;
              case 'description':
                return lang.tr.description;
              case 'settings.visibility':
                return lang.tr.accessPermission;
              case 'avatar':
                return lang.tr.avatar;
              case 'announcement':
                return lang.tr.announcement;
              default:
                return '';
            }
          })
          .filter(Boolean),
      );
    }, [editingServerData, pendingIconFile, markdownContent]);

    const renderContent = (): React.ReactElement | null => {
      switch (activeTabIndex) {
        case 0:
          return (
            <>
              <div className={EditServer['serverSettingPageBox']}>
                <div className={EditServer['serverSettingItemWrapper']}>
                  <div className={EditServer['serverSettingItemBox']}>
                    <div className={EditServer['serverSettingItem']}>
                      <div className={EditServer['serverSettingItemContain']}>
                        <div className={EditServer['serverSettingText']}>
                          {lang.tr.name}
                        </div>
                        <div className={EditServer['serverSettingInputBorder']}>
                          <input
                            className={`${EditServer['serverSettingInput']} ${
                              errors?.name ? 'border-red-500' : ''
                            }`}
                            value={editingServerData?.name ?? server?.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              setEditingServerData({
                                ...editingServerData,
                                name: newName,
                              });
                              // Validate immediately
                              const error = validateName(newName);
                              setErrors((prev) => ({
                                ...prev,
                                name: error,
                              }));
                            }}
                          />
                          {errors?.name && (
                            <span className="text-xs text-red-500 mt-1">
                              {errors?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={EditServer['serverSettingItemContain']}>
                        <div className={EditServer['serverSettingText']}>
                          {lang.tr.id}
                        </div>
                        <div className={EditServer['serverSettingInputBorder']}>
                          <input
                            className={EditServer['serverSettingInput']}
                            value={server?.displayId || server?.id}
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    <div className={EditServer['serverSettingItem']}>
                      <div
                        className={`${EditServer['serverSettingItemContain']} ${EditServer['server-setting-slogen']}`}
                      >
                        <div className={EditServer['serverSettingText']}>
                          {lang.tr.slogan}
                        </div>
                        <div className={EditServer['serverSettingInputBorder']}>
                          <input
                            className={EditServer['serverSettingInput']}
                            value={editingServerData.slogan ?? server?.slogan}
                            onChange={(e) => {
                              setEditingServerData({
                                ...editingServerData,
                                slogan: e.target.value,
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={EditServer['serverSettingAvatatarPictureBox']}
                  >
                    <div
                      className={EditServer['serverSettingAvatatarPicture']}
                      style={{
                        backgroundImage: `url(${
                          pendingIconFile
                            ? `data:${pendingIconFile.type};base64,${pendingIconFile.data}`
                            : server?.avatar || '/logo_server_def.png'
                        })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    ></div>
                    <div
                      className={EditServer['serverSettingButton']}
                      onClick={(e) => {
                        e.preventDefault();
                        setServerIcon.current?.click();
                      }}
                    >
                      {lang.tr.changeImage}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      ref={setServerIcon}
                      onChange={handleServerIconChange}
                    />
                  </div>
                </div>
              </div>
              <div className={EditServer['serverSettingItemWrapper']}>
                <div className={EditServer['serverSettingItemBox']}>
                  <div className={EditServer['serverSettingItem']}>
                    <div className={EditServer['serverSettingItemContain']}>
                      <div className={EditServer['serverSettingText']}>
                        {lang.tr.type}
                      </div>
                      <div className={EditServer['serverSettingSelectBox']}>
                        <div className={EditServer['serverSettingInputBorder']}>
                          <select className={EditServer['serverSettingSelect']}>
                            <option>{lang.tr.other}</option>
                            <option>{lang.tr.game}</option>
                            <option>{lang.tr.entertainment}</option>
                          </select>
                          <div
                            className={
                              EditServer['serverSettingSelectDropDownIcon']
                            }
                          ></div>
                        </div>
                        <div
                          className={EditServer['serverSettingTypeIcon']}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={EditServer['serverSettingItemWrapper']}>
                <div className={EditServer['serverSettingItemBox']}>
                  <div className={EditServer['serverSettingItem']}>
                    <div className={EditServer['serverSettingItemContain']}>
                      <div className={EditServer['serverSettingText']}>
                        {lang.tr.level}
                      </div>
                      <div className={EditServer['serverSettingSelectBox']}>
                        <div className={EditServer['serverSettingInputBorder']}>
                          <input
                            className={EditServer['serverSettingInput']}
                            value={server?.level || 0}
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    <div className={EditServer['serverSettingItemContain']}>
                      <div className={EditServer['serverSettingText']}>
                        {lang.tr.creationTime}
                      </div>
                      <div className={EditServer['serverSettingSelectBox']}>
                        <div className={EditServer['serverSettingInputBorder']}>
                          <input
                            className={EditServer['serverSettingInput']}
                            value={new Date(server?.createdAt).toLocaleString()}
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    <div className={EditServer['serverSettingItemContain']}>
                      <div className={EditServer['serverSettingRichCoinTitle']}>
                        <div className={EditServer['serverSettingText']}>
                          {lang.tr.wealth}
                        </div>
                        <div
                          className={EditServer['serverSettingRichCoin']}
                        ></div>
                      </div>
                      <div className={EditServer['serverSettingSelectBox']}>
                        <div className={EditServer['serverSettingInputBorder']}>
                          <input
                            className={EditServer['serverSettingInput']}
                            value={server?.wealth || 0}
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={EditServer['serverSettingItemWrapper']}>
                <div className={EditServer['serverSettingItemBox']}>
                  <div className={EditServer['serverSettingItem']}>
                    <div
                      className={`${EditServer['serverSettingItemContain']} ${EditServer['server-setting-about']}`}
                    >
                      <div className={EditServer['serverSettingText']}>
                        {lang.tr.description}
                      </div>
                      <div className={EditServer['serverSettingInputBorder']}>
                        <input
                          className={EditServer['serverSettingInput']}
                          value={
                            editingServerData?.description ??
                            server?.description
                          }
                          onChange={(e) => {
                            const newDescription = e.target.value;
                            setEditingServerData({
                              ...editingServerData,
                              description: newDescription,
                            });
                            // Validate immediately
                            const error = validateDescription(newDescription);
                            setErrors((prev) => ({
                              ...prev,
                              description: error,
                            }));
                          }}
                        />
                        {errors.description && (
                          <span className="text-xs text-red-500 mt-1">
                            {errors.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );

        case 1:
          return (
            <div className={EditServer['serverSettingPageBox']}>
              <div
                className={`${EditServer['serverSettingItemWrapper']} ${EditServer['markdown']}`}
              >
                <div className={EditServer['serverSettingHeaderTitle']}>
                  <div className={EditServer['serverSettingText']}>
                    {lang.tr.inputAnnouncement}
                  </div>
                  <div
                    className={EditServer['serverSettingButton']}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPreviewMode(!isPreviewMode);
                    }}
                  >
                    {isPreviewMode ? lang.tr.edit : lang.tr.preview}
                  </div>
                </div>
                <div className={EditServer['serverSettingTextareaBox']}>
                  {isPreviewMode ? (
                    <div className={EditServer['serverSettingInputBorder']}>
                      <MarkdownViewer markdownText={markdownContent} />
                    </div>
                  ) : (
                    <textarea
                      className={EditServer['serverSettingTextarea']}
                      value={markdownContent}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setMarkdownContent(e.target.value)
                      }
                    >
                      {markdownContent}
                    </textarea>
                  )}
                </div>
                <div
                  className={`${EditServer['serverSettingText']} ${EditServer['markdownTitle']}`}
                >
                  {lang.tr.markdownSupport}
                </div>
              </div>
            </div>
          );
        case 2:
          const sortFunctions: Record<string, SortFunction> = {
            name: (a: Member, b: Member, direction: number): number => {
              const nameA = (a.nickname || '未知').toLowerCase();
              const nameB = (b.nickname || '未知').toLowerCase();
              return direction * nameA.localeCompare(nameB);
            },
            permission: (a: Member, b: Member, direction: number): number => {
              const permissionA = a.permissionLevel ?? 1;
              const permissionB = b.permissionLevel ?? 1;
              return direction * (permissionA - permissionB);
            },
            contribution: (a: Member, b: Member, direction: number): number => {
              const contribA = a.contribution ?? 0;
              const contribB = b.contribution ?? 0;
              return direction * (contribA - contribB);
            },
            joinDate: (a: Member, b: Member, direction: number): number => {
              const dateA = a?.createdAt ?? 0;
              const dateB = b?.createdAt ?? 0;
              return direction * (dateA - dateB);
            },
          };

          const processMembers = (
            members: Member[],
            searchText: string,
            sortState: SortState,
          ): Member[] => {
            const searchLower = searchText.toLowerCase();

            return members
              .filter((member: Member) => {
                const displayName = (
                  member.nickname || '未知用戶'
                ).toLowerCase();
                return displayName.includes(searchLower) || searchText === '';
              })
              .sort((a: Member, b: Member) => {
                const direction = sortState.direction === 'asc' ? 1 : -1;
                const sortFn = sortFunctions[sortState.field];
                return sortFn ? sortFn(a, b, direction) : 0;
              });
          };

          const sortedMembers = processMembers(members, searchText, sortState);

          const handleUserMove = (target: Member) => {
            // 這裡需修改
            // socket?.emit('ManageUserAction', {
            //   sessionId: sessionId,
            //   serverId: server?.id,
            //   targetId: target.userId,
            //   type: 'move',
            // });
          };

          const handleKickServer = (target: Member) => {
            ipcService.popup.open(popupType.DIALOG_WARNING);
            ipcService.initialData.onRequest(popupType.DIALOG_WARNING, {
              iconType: 'warning',
              title: `確定要踢出 ${target.nickname} 嗎？使用者可以再次申請加入。`,
              submitTo: popupType.DIALOG_WARNING,
            });
            ipcService.popup.onSubmit(popupType.DIALOG_WARNING, () => {
              setMembers((prev) =>
                prev.filter((member) => member?.id !== target?.id),
              );

              socket?.send.updateMember({
                serverId: server?.id,
                targetMember: {
                  ...target,
                  permissionLevel: 0,
                  createdAt: 0,
                  nickname: '',
                },
              });
            });
          };

          const handleBlockUser = (target: Member) => {
            ipcService.popup.open(popupType.DIALOG_WARNING);
            ipcService.initialData.onRequest(popupType.DIALOG_WARNING, {
              iconType: 'warning',
              title: `確定要封鎖 ${target.nickname} 嗎？使用者將無法再次申請加入。`,
              submitTo: popupType.DIALOG_WARNING,
            });
            ipcService.popup.onSubmit(popupType.DIALOG_WARNING, () => {
              setMembers((prev) =>
                prev.filter((member) => member?.id !== target?.id),
              );

              socket?.send.updateMember({
                member: {
                  ...target,
                  permissionLevel: 0,
                  createdAt: 0,
                  nickname: '',
                  isBlocked: true,
                },
              });
            });
          };

          return (
            <>
              {/* <div className={EditServer['serverSettingPageBox']}>
                <div
                  className={`${EditServer['serverSettingItemWrapper']} ${EditServer['markdown']}`}
                >
                  <div className={EditServer['serverSettingHeaderTitle']}>
                    <div className={EditServer['serverSettingText']}>
                      會員:%d
                    </div>
                    <div className={EditServer['serverSettingSearchBox']}>
                      <div className={EditServer['serverSettingSearchBorder']}>
                        <div
                          className={EditServer['serverSettingSearchIcon']}
                        ></div>
                        <input
                          className={EditServer['serverSettingSearchInput']}
                          placeholder="輸入關鍵字或ID搜尋"
                        />
                        <div
                          className={EditServer['serverSettingSearchPrev']}
                        ></div>
                        <div
                          className={EditServer['serverSettingSearchNext']}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className={EditServer['serverSettingTextareaBox']}>
                    {isPreviewMode ? (
                      <div className={EditServer['serverSettingInputBorder']}>
                        <MarkdownViewer markdownText={markdownContent} />
                      </div>
                    ) : (
                      <textarea
                        className={EditServer['serverSettingTextarea']}
                        value={markdownContent}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          setMarkdownContent(e.target.value)
                        }
                      >
                        {markdownContent}
                      </textarea>
                    )}
                  </div>
                  <div
                    className={`${EditServer['serverSettingText']} ${EditServer['markdownTitle']}`}
                  >
                    支援 Markdown 語法：**粗體**, *斜體*, # 標題, - 列表,
                    ```程式碼```, [連結](https://)
                  </div>
                </div>
              </div> */}

              <div className="flex flex-col p-4">
                <div className="flex flex-row justify-between items-center mb-6  select-none">
                  <span className="text-sm font-medium">
                    {lang.tr.members}: {sortedMembers.length}
                  </span>
                  <div className="flex justify-end items-center border rounded-md overflow-hidden">
                    <Search className="text-gray-400 h-5 w-5 ml-2" />
                    <input
                      type="text"
                      placeholder={lang.tr.searchPlaceholder}
                      className="w-60 px-2 py-1.5 text-sm border-none outline-none"
                      value={searchText}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSearchText(e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col border rounded-lg overflow-hidden">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50 text-gray-600 select-none">
                        <tr>
                          <th
                            className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center relative pr-6">
                              {lang.tr.memberInfo}
                              <span className="absolute right-0">
                                {sortState.field === 'name' &&
                                  (sortState.direction === 'asc' ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  ))}
                              </span>
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('permission')}
                          >
                            <div className="flex items-center relative pr-6">
                              {lang.tr.identity}
                              <span className="absolute right-0">
                                {sortState.field === 'permission' &&
                                  (sortState.direction === 'asc' ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  ))}
                              </span>
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('contribution')}
                          >
                            <div className="flex items-center relative pr-6">
                              {lang.tr.contribution}
                              <span className="absolute right-0">
                                {sortState.field === 'contribution' &&
                                  (sortState.direction === 'asc' ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  ))}
                              </span>
                            </div>
                          </th>
                          <th
                            className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSort('joinDate')}
                          >
                            <div className="flex items-center relative pr-6">
                              {lang.tr.joinDate}
                              <span className="absolute right-0">
                                {sortState.field === 'joinDate' &&
                                  (sortState.direction === 'asc' ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  ))}
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMembers.map((member) => {
                          const user = member.user;
                          const userGender = user?.gender ?? 'Male';
                          const userNickname = member.nickname ?? '';
                          const userPermission = member.permissionLevel ?? 1;
                          const userContributions = member.contribution ?? 0;
                          const userJoinDate = new Date(
                            member?.createdAt || 0,
                          ).toLocaleString();

                          return (
                            <tr
                              key={member?.id}
                              className="border-b hover:bg-gray-50"
                              onContextMenu={(e) => {
                                const isCurrentUser =
                                  member.userId === mainUserId;
                                contextMenu.showContextMenu(e.pageX, e.pageY, [
                                  // {
                                  //   label: '傳送即時訊息',
                                  //   disabled: isCurrentUser,
                                  //   onClick: () => {},
                                  // },
                                  // {
                                  //   label: '檢視個人檔案',
                                  //   onClick: () => {},
                                  // },
                                  // {
                                  //   label: '新增好友',
                                  //   disabled: isCurrentUser,
                                  //   onClick: () => {},
                                  // },
                                  // {
                                  //   label: '拒聽此人語音',
                                  //   disabled: isCurrentUser,
                                  //   onClick: () => {},
                                  // },
                                  // {
                                  //   label: '修改群名片',
                                  //   onClick: () => {},
                                  // },
                                  {
                                    label: lang.tr.moveToMyChannel,
                                    disabled: isCurrentUser,
                                    onClick: () => handleUserMove(member),
                                  },
                                  // {
                                  //   label: '禁止此人語音',
                                  //   disabled: isCurrentUser,
                                  //   onClick: () => {},
                                  // },
                                  // {
                                  //   label: '禁止文字',
                                  //   disabled: isCurrentUser,
                                  //   onClick: () => {},
                                  // },
                                  {
                                    label: lang.tr.kickOut,
                                    disabled: isCurrentUser,
                                    onClick: () => handleKickServer(member),
                                  },
                                  {
                                    label: lang.tr.block,
                                    disabled: isCurrentUser,
                                    onClick: () => handleBlockUser(member),
                                  },
                                  {
                                    label: lang.tr.memberManagement,
                                    disabled: isCurrentUser,
                                    onClick: () => {},
                                  },
                                  {
                                    label: lang.tr.inviteToBeMember,
                                    disabled: isCurrentUser,
                                    onClick: () => {},
                                  },
                                ]);
                              }}
                            >
                              <td className="px-4 py-3 flex items-center gap-2">
                                <span
                                  className={`${permission[userGender]} ${
                                    permission[`lv-${userPermission}`]
                                  }`}
                                />
                                <span className="font-medium text-gray-900">
                                  {userNickname}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="flex flex-col">
                                  <span className="text-gray-500 text-xs">
                                    {getPermissionText(userPermission, lang.tr)}
                                  </span>
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {userContributions}
                              </td>
                              <td className="px-4 py-3 text-gray-500">
                                {userJoinDate}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-4 text-right text-sm text-gray-500 select-none">
                  {lang.tr.rightClickToProcess}
                </div>
              </div>
            </>
          );

        case 3:
          return (
            <div className="space-y-4 p-4">
              <div className="text-sm">
                <span className="font-medium">{lang.tr.accessPermission}</span>
                <div className="mt-4 ml-8">
                  <div className="flex items-center mb-6">
                    <input
                      type="radio"
                      id="public"
                      name="permission"
                      value="public"
                      className="mr-3"
                      checked={
                        editingServerData?.settings?.visibility === 'public' ||
                        server.settings.visibility === 'public'
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          setEditingServerData({
                            ...editingServerData,
                            settings: {
                              ...editingServerData.settings,
                              visibility: 'public',
                            },
                          });
                      }}
                    />
                    <label htmlFor="public">{lang.tr.publicGroup}</label>
                  </div>

                  <div className="flex items-start mb-6">
                    <input
                      type="radio"
                      id="members"
                      name="permission"
                      value="members"
                      className="mr-3"
                      checked={
                        editingServerData?.settings?.visibility === 'private' ||
                        server.settings.visibility === 'private'
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          setEditingServerData({
                            ...editingServerData,
                            settings: {
                              ...editingServerData.settings,
                              visibility: 'private',
                            },
                          });
                      }}
                    />
                    <div>
                      <label htmlFor="members">{lang.tr.semiPublicGroup}</label>
                      <div className="text-gray-500 text-xs mt-1">
                        {lang.tr.semiPublicGroupDescription}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="radio"
                      id="private"
                      name="permission"
                      value="private"
                      className="mr-3"
                      checked={
                        editingServerData?.settings?.visibility ===
                          'invisible' ||
                        server.settings.visibility === 'invisible'
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          setEditingServerData({
                            ...editingServerData,
                            settings: {
                              ...editingServerData.settings,
                              visibility: 'invisible',
                            },
                          });
                      }}
                    />
                    <div>
                      <label htmlFor="private">{lang.tr.privateGroup}</label>
                      <div className="text-gray-500 text-xs mt-1">
                        {lang.tr.privateGroupDescription}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

        case 4:
          const sortedApplications = [...applications].sort((a, b) => {
            const direction = sortState.direction === 'asc' ? -1 : 1;

            const contribA = server.members?.[a.userId]?.contribution || 0;
            const contribB = server.members?.[b.userId]?.contribution || 0;
            return direction * (contribB - contribA);
          });

          return (
            <div className="flex flex-col h-full p-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-medium">
                  {lang.tr.applicants}: {sortedApplications.length}
                </span>
                <button
                  className="text-sm text-blue-400 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                  }}
                >
                  {lang.tr.applicationSettings}
                </button>
              </div>

              <div className="flex flex-col border rounded-lg overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-gray-600 select-none">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100 w-32">
                          <div className="whitespace-nowrap">
                            {lang.tr.nickname}
                          </div>
                        </th>
                        <th
                          className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100 w-24"
                          onClick={() => handleSort('applyContribution')}
                        >
                          <div className="flex items-center relative pr-6 whitespace-nowrap">
                            {lang.tr.contribution}
                            <span className="absolute right-0">
                              {sortState.field === 'applyContribution' &&
                                (sortState.direction === 'asc' ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                ))}
                            </span>
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100 min-w-[300px]">
                          <div className="whitespace-nowrap">
                            {lang.tr.applicationDescription}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedApplications.map((application, index) => {
                        const user = application.user;
                        const member = server.members?.[user?.id || ''] ?? null;
                        const userNickname =
                          member?.nickname ?? user?.name ?? '未知使用者';
                        const userContributions = member?.contribution ?? 0;
                        const applicationDesc =
                          application.description || '該使用者未填寫訊息';

                        return (
                          <tr
                            key={index}
                            className="border-b hover:bg-gray-50"
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleApplicationContextMenu(e, application);
                            }}
                          >
                            <td className="px-4 py-3 truncate">
                              <p className="font-medium text-gray-900">
                                {userNickname}
                              </p>
                            </td>
                            <td className="px-4 py-3">{userContributions}</td>
                            <td className="px-4 py-3">{applicationDesc}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 text-right text-sm text-gray-500 select-none">
                {lang.tr.rightClickToProcess}
              </div>
            </div>
          );

        case 5:
          const blockAccountList = Object.values(server.members || {}).filter(
            (member) => member.isBlocked,
          );
          const blockAccountPage = (
            <div className="flex flex-col w-full">
              {/* head */}
              <div className="flex flex-row justify-between items-center mb-6  select-none">
                <span className="text-sm font-medium">
                  {lang.tr.blacklist}: {Object.keys(blockAccountList).length}
                </span>
                <div className="flex justify-end items-center border rounded-md overflow-hidden">
                  <Search className="text-gray-400 h-5 w-5 ml-2" />
                  <input
                    type="text"
                    placeholder={lang.tr.searchPlaceholder}
                    className="w-60 px-2 py-1.5 text-sm border-none outline-none"
                  />
                </div>
              </div>

              {/* body */}
              <div className="flex flex-col border rounded-lg overflow-hidden mt-2">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-gray-600 select-none">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100">
                          {lang.tr.select}
                        </th>
                        <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100">
                          {lang.tr.nickname}
                        </th>
                        <th className="px-4 py-3 text-left font-medium border-b cursor-pointer hover:bg-gray-100">
                          {lang.tr.id}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(blockAccountList).map(
                        ([userId, member]) => {
                          const displayName = member.nickname || '未知用戶';

                          return (
                            <tr
                              key={userId}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <input type="checkbox" />
                              </td>
                              <td className="px-4 py-3 truncate">
                                {displayName}
                              </td>
                              <td className="px-4 py-3">{userId}</td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );

          const blockIpPage = <div></div>;

          return (
            <div className="flex flex-col items-center p-4">
              {blockPage === 1
                ? blockAccountPage
                : blockPage === 2
                ? blockIpPage
                : null}
            </div>
          );

        default:
          return null;
      }
    };

    const TabItem = ({
      index,
      title,
      dataKey,
    }: {
      index: number;
      title: string;
      dataKey: string;
    }) => {
      return (
        <div
          className={`${EditServer['serverSettingTab']} ${
            activeTabIndex === index ? EditServer['active'] : ''
          }`}
          onClick={() => setActiveTabIndex(index)}
          data-key={dataKey}
        >
          {title}
        </div>
      );
    };

    return (
      <>
        <form className={Popup['popupContainer']} onSubmit={handleSubmit}>
          <div className={EditServer['serverSettingContent']}>
            {/** 左Tab **/}
            <div className={EditServer['serverSettingLeft']}>
              <div className={EditServer['serverSettingTabsBox']}>
                {TabItem({
                  index: 0,
                  title: lang.tr.viewGroupInfo,
                  dataKey: '10158',
                })}
                {TabItem({
                  index: 1,
                  title: lang.tr.announcement,
                  dataKey: '20195',
                })}
                {TabItem({
                  index: 2,
                  title: lang.tr.memberManagement,
                  dataKey: '20107',
                })}
                {TabItem({
                  index: 3,
                  title: lang.tr.accessPermission,
                  dataKey: '20073',
                })}
                {TabItem({
                  index: 4,
                  title: lang.tr.memberApplicationManagement,
                  dataKey: '20108',
                })}
                {TabItem({
                  index: 5,
                  title: lang.tr.blacklistManagement,
                  dataKey: '20144',
                })}
              </div>
            </div>
            {/** 右內容 **/}
            <div className={EditServer['serverSettingRight']}>
              <div className={EditServer['server-setting-page']}>
                <div className={EditServer['serverSettingPageBox']}>
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
          <div className={Popup['popupFooter']}>
            <button type="submit" className={Popup['button']}>
              {lang.tr.confirm}
            </button>
            <button
              type="button"
              className={Popup['button']}
              onClick={handleClose}
            >
              {lang.tr.cancel}
            </button>
          </div>
        </form>
      </>
    );
  },
);

EditServerModal.displayName = 'EditServerModal';
export default EditServerModal;
