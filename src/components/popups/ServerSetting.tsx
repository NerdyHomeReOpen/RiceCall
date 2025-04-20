import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { marked } from 'marked';

// CSS
import setting from '@/styles/popups/setting.module.css';
import popup from '@/styles/popup.module.css';
import permission from '@/styles/permission.module.css';
import markdown from '@/styles/viewers/markdown.module.css';

// Types
import {
  MemberApplication,
  Server,
  PopupType,
  ServerMember,
  Member,
  User,
  SocketServerEvent,
} from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useContextMenu } from '@/providers/ContextMenu';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import apiService from '@/services/api.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';
import { createSorter } from '@/utils/createSorter';

interface ServerSettingPopupProps {
  serverId: Server['serverId'];
  userId: User['userId'];
}

const ServerSettingPopup: React.FC<ServerSettingPopupProps> = React.memo(
  (initialData: ServerSettingPopupProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();
    const contextMenu = useContextMenu();

    // Constants
    const MEMBER_FIELDS = [
      {
        name: lang.tr.name,
        field: 'name',
      },
      {
        name: lang.tr.permission,
        field: 'permissionLevel',
      },
      {
        name: lang.tr.contribution,
        field: 'contribution',
      },
      {
        name: lang.tr.joinDate,
        field: 'createdAt',
      },
    ];
    const APPLICATION_FIELDS = [
      {
        name: lang.tr.name,
        field: 'name',
      },
      {
        name: lang.tr.description,
        field: 'description',
      },
      {
        name: lang.tr.creationTime,
        field: 'createdAt',
      },
    ];
    const BLOCK_MEMBER_FIELDS = [
      {
        name: lang.tr.name,
        field: 'name',
      },
    ];

    // Refs
    const refreshRef = useRef(false);

    // States
    const [serverName, setServerName] = useState<Server['name']>(
      createDefault.server().name,
    );
    const [serverAvatar, setServerAvatar] = useState<Server['avatar']>(
      createDefault.server().avatar,
    );
    const [serverAvatarUrl, setServerAvatarUrl] = useState<Server['avatarUrl']>(
      createDefault.server().avatarUrl,
    );
    const [serverAnnouncement, setServerAnnouncement] = useState<
      Server['announcement']
    >(createDefault.server().announcement);
    const [serverDescription, setServerDescription] = useState<
      Server['description']
    >(createDefault.server().description);
    const [serverType, setServerType] = useState<Server['type']>(
      createDefault.server().type,
    );
    const [serverDisplayId, setServerDisplayId] = useState<Server['displayId']>(
      createDefault.server().displayId,
    );
    const [serverSlogan, setServerSlogan] = useState<Server['slogan']>(
      createDefault.server().slogan,
    );
    const [serverLevel, setServerLevel] = useState<Server['level']>(
      createDefault.server().level,
    );
    const [serverWealth, setServerWealth] = useState<Server['wealth']>(
      createDefault.server().wealth,
    );
    const [serverCreatedAt, setServerCreatedAt] = useState<Server['createdAt']>(
      createDefault.server().createdAt,
    );
    const [serverVisibility, setServerVisibility] = useState<
      Server['visibility']
    >(createDefault.server().visibility);
    const [serverMembers, setServerMembers] = useState<ServerMember[]>([]);
    const [serverApplications, setServerApplications] = useState<
      MemberApplication[]
    >([]);
    const [permissionLevel, setPermissionLevel] = useState<number>(0);

    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [sortState, setSortState] = useState<1 | -1>(-1);
    const [sortField, setSortField] = useState<string>('permissionLevel');

    const [searchText, setSearchText] = useState('');

    const [announcementPreview, setAnnouncementPreview] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    // Variables
    const { serverId, userId } = initialData;
    const filteredMembers = serverMembers.filter((member) => {
      const searchLower = searchText.toLowerCase();
      return (
        member.permissionLevel > 1 &&
        (member.nickname?.toLowerCase().includes(searchLower) ||
          member.name.toLowerCase().includes(searchLower))
      );
    });
    const filteredBlockMembers = serverMembers.filter((member) => {
      const searchLower = searchText.toLowerCase();
      return (
        member.isBlocked &&
        (member.nickname?.toLowerCase().includes(searchLower) ||
          member.name.toLowerCase().includes(searchLower))
      );
    });
    const filteredApplications = serverApplications.filter((application) => {
      const searchLower = searchText.toLowerCase();
      return (
        application.name.toLowerCase().includes(searchLower) ||
        application.description.toLowerCase().includes(searchLower)
      );
    });

    // Handlers
    const handleSort = <T extends ServerMember | MemberApplication>(
      field: keyof T,
      array: T[],
    ) => {
      const newDirection =
        sortField === String(field) ? (sortState === 1 ? -1 : 1) : -1;
      setSortField(String(field));
      setSortState(newDirection);
      return [...array].sort(createSorter(field, newDirection));
    };

    const handleUpdateServer = (
      server: Partial<Server>,
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateServer({ server, serverId });
    };

    const handleDeleteMemberApplication = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.deleteMemberApplication({ userId, serverId });
    };

    const handleCreateMember = (
      member: Partial<Member>,
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.createMember({ member, userId, serverId });
    };

    const handleUpdateMember = (
      member: Partial<Member>,
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.updateMember({ member, userId, serverId });
    };

    const handleKickUser = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      if (!socket) return;
      socket.send.disconnectServer({ userId, serverId });
    };

    const handleOpenMemberApplySetting = () => {
      ipcService.popup.open(PopupType.MEMBERAPPLY_SETTING);
      ipcService.initialData.onRequest(PopupType.MEMBERAPPLY_SETTING, {
        serverId,
      });
    };

    const handleOpenApplyFriend = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.APPLY_FRIEND);
      ipcService.initialData.onRequest(PopupType.APPLY_FRIEND, {
        userId,
        targetId,
      });
    };

    const handleOpenEditNickname = (
      userId: User['userId'],
      serverId: Server['serverId'],
    ) => {
      ipcService.popup.open(PopupType.EDIT_NICKNAME);
      ipcService.initialData.onRequest(PopupType.EDIT_NICKNAME, {
        serverId,
        userId,
      });
    };

    const handleOpenDirectMessage = (
      userId: User['userId'],
      targetId: User['userId'],
      targetName: User['name'],
    ) => {
      ipcService.popup.open(PopupType.DIRECT_MESSAGE);
      ipcService.initialData.onRequest(PopupType.DIRECT_MESSAGE, {
        userId,
        targetId,
        targetName,
      });
    };

    const handleOpenUserInfo = (
      userId: User['userId'],
      targetId: User['userId'],
    ) => {
      ipcService.popup.open(PopupType.USER_INFO);
      ipcService.initialData.onRequest(PopupType.USER_INFO, {
        userId,
        targetId,
      });
    };

    const handleOpenErrorDialog = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_ERROR);
      ipcService.initialData.onRequest(PopupType.DIALOG_ERROR, {
        title: message,
        submitTo: PopupType.DIALOG_ERROR,
      });
    };

    const handleServerUpdate = (data: Server | null) => {
      if (!data) data = createDefault.server();
      setServerName(data.name);
      setServerAvatar(data.avatar);
      setServerAvatarUrl(data.avatarUrl);
      setServerAnnouncement(data.announcement);
      setServerDescription(data.description);
      setServerType(data.type);
      setServerDisplayId(data.displayId);
      setServerSlogan(data.slogan);
      setServerLevel(data.level);
      setServerWealth(data.wealth);
      setServerCreatedAt(data.createdAt);
      setServerVisibility(data.visibility);
    };

    const handleMembersUpdate = (data: ServerMember[] | null) => {
      if (!data) data = [];
      const sorted = [...data].sort(
        (a, b) => b.permissionLevel - a.permissionLevel,
      );
      setServerMembers(sorted);
    };

    const handleMemberApplicationsUpdate = (
      data: MemberApplication[] | null,
    ) => {
      if (!data) data = [];
      setServerApplications(data);
    };

    const handleMemberUpdate = (data: Member | null) => {
      if (!data) data = createDefault.member();
      setPermissionLevel(data.permissionLevel);
    };

    const handleMemberSort = (field: keyof ServerMember) => {
      const sortedMembers = handleSort(field, [...serverMembers]);
      setServerMembers(sortedMembers);
    };

    const handleApplicationSort = (field: keyof MemberApplication) => {
      const sortedApplications = handleSort(field, [...serverApplications]);
      setServerApplications(sortedApplications);
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!socket) return;

      const eventHandlers = {
        [SocketServerEvent.SERVER_MEMBERS_UPDATE]: handleMembersUpdate,
        [SocketServerEvent.SERVER_MEMBER_APPLICATIONS_UPDATE]:
          handleMemberApplicationsUpdate,
      };
      const unsubscribe: (() => void)[] = [];

      Object.entries(eventHandlers).map(([event, handler]) => {
        const unsub = socket.on[event as SocketServerEvent](handler);
        unsubscribe.push(unsub);
      });

      return () => {
        unsubscribe.forEach((unsub) => unsub());
      };
    }, [socket]);

    useEffect(() => {
      if (!serverId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.server({
            serverId: serverId,
          }),
          refreshService.member({
            serverId: serverId,
            userId: userId,
          }),
          refreshService.serverMembers({
            serverId: serverId,
          }),
          refreshService.serverMemberApplications({
            serverId: serverId,
          }),
        ]).then(([server, member, serverMembers, serverMemberApplications]) => {
          handleServerUpdate(server);
          handleMemberUpdate(member);
          handleMembersUpdate(serverMembers);
          handleMemberApplicationsUpdate(serverMemberApplications);
        });
      };
      refresh();
    }, [serverId, userId]);

    return (
      <div className={popup['popupContainer']}>
        <div className={popup['popupBody']}>
          {/* Left Sidebar */}
          <div className={setting['left']}>
            <div className={setting['tabs']}>
              {[
                lang.tr.viewGroupInfo,
                lang.tr.announcement,
                lang.tr.memberManagement,
                lang.tr.accessPermission,
                `${lang.tr.memberApplicationManagement} (${serverApplications.length})`,
                lang.tr.blacklistManagement,
              ].map((title, index) => (
                <div
                  className={`${setting['item']} ${
                    activeTabIndex === index ? setting['active'] : ''
                  }`}
                  onClick={() => setActiveTabIndex(index)}
                  key={index}
                >
                  {title}
                </div>
              ))}
            </div>
          </div>
          {/* Right Content */}
          <div className={setting['right']}>
            {activeTabIndex === 0 ? (
              <div className={popup['col']}>
                <div className={popup['row']}>
                  <div className={popup['col']}>
                    <div className={popup['row']}>
                      <div className={`${popup['inputBox']} ${popup['col']}`}>
                        <div className={popup['label']}>{lang.tr.name}</div>
                        <input
                          type="text"
                          value={serverName}
                          onChange={(e) => {
                            setServerName(e.target.value);
                          }}
                        />
                      </div>
                      <div className={`${popup['inputBox']} ${popup['col']}`}>
                        <div className={popup['label']}>{lang.tr.id}</div>
                        <input type="text" value={serverDisplayId} disabled />
                      </div>
                    </div>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>{lang.tr.slogan}</div>
                      <input
                        type="text"
                        value={serverSlogan}
                        onChange={(e) => {
                          setServerSlogan(e.target.value);
                        }}
                      />
                    </div>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>{lang.tr.type}</div>
                      <div className={popup['selectBox']}>
                        <select
                          value={serverType}
                          onChange={(e) => {
                            setServerType(e.target.value as Server['type']);
                          }}
                        >
                          <option value="other">{lang.tr.other}</option>
                          <option value="game">{lang.tr.game}</option>
                          <option value="entertainment">
                            {lang.tr.entertainment}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className={setting['avatarWrapper']}>
                    <div
                      className={setting['avatarPicture']}
                      style={{
                        backgroundImage: `url(${serverAvatarUrl})`,
                      }}
                    />
                    <input
                      type="file"
                      id="avatar-upload"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          handleOpenErrorDialog(lang.tr.canNotReadImage);
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          handleOpenErrorDialog(lang.tr.imageTooLarge);
                          return;
                        }

                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const formData = new FormData();
                          formData.append('_type', 'server');
                          formData.append('_fileName', serverAvatar);
                          formData.append('_file', reader.result as string);
                          const data = await apiService.post(
                            '/upload',
                            formData,
                          );
                          if (data) {
                            setServerAvatar(data.avatar);
                            setServerAvatarUrl(data.avatarUrl);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={popup['button']}
                      style={{ marginTop: '10px' }}
                    >
                      {lang.tr.changeImage}
                    </label>
                  </div>
                </div>
                <div className={popup['col']}>
                  <div className={popup['row']}>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>{lang.tr.level}</div>
                      <input type="text" value={serverLevel} disabled />
                    </div>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div className={popup['label']}>
                        {lang.tr.creationTime}
                      </div>
                      <input
                        type="text"
                        value={new Date(serverCreatedAt).toLocaleString()}
                        disabled
                      />
                    </div>
                    <div className={`${popup['inputBox']} ${popup['col']}`}>
                      <div
                        className={`${popup['label']} ${setting['wealthCoinIcon']}`}
                      >
                        {lang.tr.wealth}
                      </div>
                      <input type="text" value={serverWealth} disabled />
                    </div>
                  </div>
                  <div className={`${popup['inputBox']} ${popup['col']}`}>
                    <div className={popup['label']}>{lang.tr.description}</div>
                    <textarea
                      value={serverDescription}
                      onChange={(e) => setServerDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : activeTabIndex === 1 ? (
              <div className={popup['col']}>
                <div className={setting['headerTextBox']}>
                  <div className={popup['label']}>
                    {lang.tr.inputAnnouncement}
                  </div>
                  <div
                    className={popup['button']}
                    onClick={async () => {
                      if (showPreview) {
                        setShowPreview(false);
                      } else {
                        const html = await marked.parse(serverAnnouncement);
                        setAnnouncementPreview(html);
                        setShowPreview(true);
                      }
                    }}
                  >
                    {showPreview ? '編輯' : '預覽'}
                  </div>
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  {showPreview ? (
                    <>
                      <div
                        style={{ minHeight: '330px' }}
                        className={`${
                          showPreview ? setting['previewModeArea'] : ''
                        } ${markdown['markdownContent']}`}
                        dangerouslySetInnerHTML={{
                          __html: announcementPreview,
                        }}
                      />
                    </>
                  ) : (
                    <textarea
                      style={{ minHeight: '330px' }}
                      value={serverAnnouncement}
                      onChange={(e) => setServerAnnouncement(e.target.value)}
                    />
                  )}
                  <div className={popup['label']}>
                    {lang.tr.markdownSupport}
                  </div>
                </div>
              </div>
            ) : activeTabIndex === 2 ? (
              <div className={popup['col']}>
                <div
                  className={`${popup['inputBox']} ${setting['headerBar']} ${popup['row']}`}
                >
                  <div className={popup['label']}>
                    {lang.tr.members}: {filteredMembers.length}
                  </div>
                  <div className={setting['searchWrapper']}>
                    <div className={setting['searchBorder']}>
                      <div className={setting['searchIcon']}></div>
                      <input
                        className={setting['searchInput']}
                        type="search"
                        placeholder={lang.tr.searchMemberPlaceholder}
                        value={searchText}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setSearchText(e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <table style={{ height: '330px' }}>
                    <thead>
                      <tr>
                        {MEMBER_FIELDS.map((field) => (
                          <th
                            key={field.field}
                            onClick={() =>
                              handleMemberSort(
                                field.field as keyof ServerMember,
                              )
                            }
                          >
                            {field.name}
                            {sortField === field.field &&
                              (sortState === 1 ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={setting['tableContainer']}>
                      {filteredMembers.map((member) => {
                        const {
                          name: memberName,
                          nickname: memberNickname,
                          gender: memberGender,
                          permissionLevel: memberPermissionLevel,
                          contribution: memberContribution,
                          userId: memberUserId,
                          serverId: memberServerId,
                          createdAt: memberJoinDate,
                        } = member;
                        const isCurrentUser = memberUserId === userId;
                        const canManageMember =
                          !isCurrentUser &&
                          permissionLevel > memberPermissionLevel &&
                          permissionLevel > 3 &&
                          memberPermissionLevel > 1;
                        const canEditNickname =
                          (isCurrentUser && permissionLevel > 1) ||
                          canManageMember;
                        const canChangeToGuest =
                          !isCurrentUser &&
                          permissionLevel > memberPermissionLevel &&
                          permissionLevel > 4 &&
                          memberPermissionLevel !== 1;
                        const canChangeToMember =
                          permissionLevel > 2 && memberPermissionLevel !== 2;
                        const canChangeToChannelAdmin =
                          permissionLevel > 3 && memberPermissionLevel !== 3;
                        const canChangeToCategoryAdmin =
                          permissionLevel > 4 && memberPermissionLevel !== 4;
                        const canChangeToAdmin =
                          permissionLevel > 5 && memberPermissionLevel !== 5;
                        const canKick =
                          !isCurrentUser &&
                          permissionLevel > 4 &&
                          permissionLevel > memberPermissionLevel;

                        const removeLevelToMember = (
                          label: string,
                          currentLevel: number,
                        ) => ({
                          id: 'set-member',
                          label,
                          show:
                            memberPermissionLevel === currentLevel &&
                            canChangeToMember,
                          onClick: () =>
                            handleUpdateMember(
                              { permissionLevel: 2 },
                              memberUserId,
                              memberServerId,
                            ),
                        });

                        return (
                          <tr
                            key={memberUserId}
                            onContextMenu={(e) => {
                              const isCurrentUser = memberUserId === userId;
                              contextMenu.showContextMenu(e.pageX, e.pageY, [
                                {
                                  id: 'direct-message',
                                  label: lang.tr.directMessage,
                                  onClick: () =>
                                    handleOpenDirectMessage(
                                      userId,
                                      memberUserId,
                                      memberName,
                                    ),
                                  show: !isCurrentUser,
                                },
                                {
                                  id: 'view-profile',
                                  label: lang.tr.viewProfile,
                                  onClick: () =>
                                    handleOpenUserInfo(userId, memberUserId),
                                },
                                {
                                  id: 'apply-friend',
                                  label: lang.tr.addFriend,
                                  onClick: () =>
                                    handleOpenApplyFriend(userId, memberUserId),
                                  show: !isCurrentUser,
                                },
                                {
                                  id: 'edit-nickname',
                                  label: lang.tr.editNickname,
                                  onClick: () =>
                                    handleOpenEditNickname(
                                      memberUserId,
                                      memberServerId,
                                    ),
                                  show: canEditNickname,
                                },
                                {
                                  id: 'separator',
                                  label: '',
                                  show: canManageMember,
                                },
                                {
                                  id: 'kick',
                                  label: lang.tr.kick,
                                  show: canKick,
                                  onClick: () =>
                                    handleKickUser(
                                      memberUserId,
                                      memberServerId,
                                    ),
                                },
                                {
                                  id: 'member-management',
                                  label: lang.tr.memberManagement,
                                  show: canManageMember,
                                  icon: 'submenu',
                                  hasSubmenu: true,
                                  submenuItems: [
                                    {
                                      id: 'set-channel-admin',
                                      label: lang.tr.setChannelAdmin,
                                      show: canChangeToChannelAdmin,
                                      onClick: () =>
                                        handleUpdateMember(
                                          { permissionLevel: 3 },
                                          memberUserId,
                                          memberServerId,
                                        ),
                                    },
                                    removeLevelToMember(
                                      lang.tr.removeChannelAdmin,
                                      3,
                                    ),

                                    {
                                      id: 'set-category-admin',
                                      label: lang.tr.setCategoryAdmin,
                                      show: canChangeToCategoryAdmin,
                                      onClick: () =>
                                        handleUpdateMember(
                                          { permissionLevel: 4 },
                                          memberUserId,
                                          memberServerId,
                                        ),
                                    },
                                    removeLevelToMember(
                                      lang.tr.removeCategoryAdmin,
                                      4,
                                    ),

                                    {
                                      id: 'set-admin',
                                      label: lang.tr.setAdmin,
                                      show: canChangeToAdmin,
                                      onClick: () =>
                                        handleUpdateMember(
                                          { permissionLevel: 5 },
                                          memberUserId,
                                          memberServerId,
                                        ),
                                    },
                                    removeLevelToMember(lang.tr.removeAdmin, 5),
                                  ],
                                },
                                {
                                  id: 'set-guest',
                                  label: lang.tr.setGuest,
                                  show: canChangeToGuest,
                                  onClick: () =>
                                    handleUpdateMember(
                                      { permissionLevel: 1 },
                                      memberUserId,
                                      memberServerId,
                                    ),
                                },
                              ]);
                            }}
                          >
                            <td>
                              <div
                                className={`${permission[memberGender]} ${
                                  permission[`lv-${memberPermissionLevel}`]
                                }`}
                              />
                              <div
                                className={`${popup['p1']} ${
                                  memberNickname && memberName
                                    ? setting['memberName']
                                    : ''
                                }`}
                              >
                                {memberNickname || memberName}
                              </div>
                            </td>
                            <td>
                              {lang.getPermissionText(memberPermissionLevel)}
                            </td>
                            <td>{memberContribution}</td>
                            <td>
                              {new Date(memberJoinDate)
                                .toISOString()
                                .slice(0, 10)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className={setting['noteText']}>
                    {lang.tr.rightClickToProcess}
                  </div>
                </div>
              </div>
            ) : activeTabIndex === 3 ? (
              <div className={popup['col']}>
                <div className={popup['pageHeaderText']}>
                  <div className={popup['label']}>
                    {lang.tr.accessPermission}
                  </div>
                  <div className={popup['textLineSplit']}></div>
                </div>
                <div className={popup['inputGroup']}>
                  <div className={`${popup['inputBox']} ${popup['row']}`}>
                    <input
                      type="radio"
                      id="public"
                      name="permission"
                      value="public"
                      className="mr-3"
                      checked={serverVisibility === 'public'}
                      onChange={(e) => {
                        if (e.target.checked) setServerVisibility('public');
                      }}
                    />
                    <div className={popup['label']}>{lang.tr.publicGroup}</div>
                  </div>

                  <div className={`${popup['inputBox']} ${popup['row']}`}>
                    <input
                      type="radio"
                      id="members"
                      name="permission"
                      value="members"
                      className="mr-3"
                      checked={serverVisibility === 'private'}
                      onChange={(e) => {
                        if (e.target.checked) setServerVisibility('private');
                      }}
                    />
                    <div>
                      <div className={popup['label']}>
                        {lang.tr.semiPublicGroup}
                      </div>
                      <div className={setting['hintText']}>
                        {lang.tr.semiPublicGroupDescription}
                      </div>
                    </div>
                  </div>

                  <div className={`${popup['inputBox']} ${popup['row']}`}>
                    <input
                      type="radio"
                      id="private"
                      name="permission"
                      value="private"
                      className="mr-3"
                      checked={serverVisibility === 'invisible'}
                      onChange={(e) => {
                        if (e.target.checked) setServerVisibility('invisible');
                      }}
                    />
                    <div>
                      <div className={popup['label']}>
                        {lang.tr.privateGroup}
                      </div>
                      <div className={setting['hintText']}>
                        {lang.tr.privateGroupDescription}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTabIndex === 4 ? (
              <div className={popup['col']}>
                <div className={`${popup['inputBox']} ${popup['row']}`}>
                  <div className={popup['label']}>
                    {lang.tr.applicants}: {filteredApplications.length}
                  </div>
                  <button
                    style={{ marginLeft: 'auto' }}
                    className={popup['button']}
                    onClick={() => handleOpenMemberApplySetting()}
                  >
                    {lang.tr.editApply}
                  </button>
                  <div className={setting['searchWrapper']}>
                    <div className={setting['searchBorder']}>
                      <div className={setting['searchIcon']}></div>
                      <input
                        className={setting['searchInput']}
                        type="search"
                        placeholder={lang.tr.searchMemberPlaceholder}
                        value={searchText}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setSearchText(e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <table style={{ height: '330px' }}>
                    <thead>
                      <tr>
                        {APPLICATION_FIELDS.map((field) => (
                          <th
                            key={field.field}
                            onClick={() =>
                              handleApplicationSort(
                                field.field as keyof MemberApplication,
                              )
                            }
                          >
                            {field.name}
                            {sortField === field.field &&
                              (sortState === 1 ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={setting['tableContainer']}>
                      {filteredApplications.map((application) => {
                        const {
                          userId: applicationUserId,
                          serverId: applicationServerId,
                          name: applicationName,
                          description: applicationDescription,
                          createdAt: applicationCreatedDate,
                        } = application;
                        return (
                          <tr
                            key={applicationUserId}
                            onContextMenu={(e) => {
                              contextMenu.showContextMenu(e.pageX, e.pageY, [
                                {
                                  id: 'accept',
                                  label: lang.tr.acceptApplication,
                                  onClick: () => {
                                    handleDeleteMemberApplication(
                                      applicationUserId,
                                      applicationServerId,
                                    );
                                    handleCreateMember(
                                      { permissionLevel: 2 },
                                      applicationUserId,
                                      applicationServerId,
                                    );
                                  },
                                },
                                {
                                  id: 'deny',
                                  label: lang.tr.denyApplication,
                                  onClick: () => {
                                    handleDeleteMemberApplication(
                                      applicationUserId,
                                      applicationServerId,
                                    );
                                  },
                                },
                              ]);
                            }}
                          >
                            <td>
                              <div className={popup['p1']}>
                                {applicationName}
                              </div>
                            </td>
                            <td>{applicationDescription}</td>
                            <td>
                              {new Date(applicationCreatedDate)
                                .toISOString()
                                .slice(0, 10)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className={setting['noteText']}>
                    {lang.tr.rightClickToProcess}
                  </div>
                </div>
              </div>
            ) : activeTabIndex === 5 ? (
              <div className={popup['col']}>
                <div
                  className={`${popup['inputBox']} ${setting['headerBar']} ${popup['row']}`}
                >
                  <div className={popup['label']}>
                    {lang.tr.blacklist}: {filteredBlockMembers.length}
                  </div>
                  <div className={setting['searchWrapper']}>
                    <div className={setting['searchBorder']}>
                      <div className={setting['searchIcon']}></div>
                      <input
                        className={setting['searchInput']}
                        type="search"
                        placeholder={lang.tr.searchMemberPlaceholder}
                        value={searchText}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setSearchText(e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className={`${popup['inputBox']} ${popup['col']}`}>
                  <table style={{ height: '330px' }}>
                    <thead>
                      <tr>
                        {BLOCK_MEMBER_FIELDS.map((field) => (
                          <th
                            key={field.field}
                            onClick={() =>
                              handleMemberSort(
                                field.field as keyof ServerMember,
                              )
                            }
                          >
                            {field.name}
                            {sortField === field.field &&
                              (sortState === 1 ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              ))}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={setting['tableContainer']}>
                      {filteredBlockMembers.map((blockMember) => {
                        const {
                          userId: blockMemberUserId,
                          // serverId: blockMemberServerId,
                          nickname: blockMemberNickname,
                          name: blockMemberName,
                          contribution: blockMemberContribution,
                        } = blockMember;
                        return (
                          <tr
                            key={blockMemberUserId}
                            onContextMenu={(e) => {
                              contextMenu.showContextMenu(e.pageX, e.pageY, []);
                            }}
                          >
                            <td>{blockMemberNickname || blockMemberName}</td>
                            <td>{blockMemberContribution}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className={setting['noteText']}>
                    {lang.tr.rightClickToProcess}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className={popup['popupFooter']}>
          <button
            className={popup['button']}
            onClick={() => {
              handleUpdateServer(
                {
                  name: serverName,
                  avatar: serverAvatar,
                  avatarUrl: serverAvatarUrl,
                  announcement: serverAnnouncement,
                  description: serverDescription,
                  type: serverType,
                  slogan: serverSlogan,
                  visibility: serverVisibility,
                },
                serverId,
              );
              handleClose();
            }}
          >
            {lang.tr.save}
          </button>
          <button
            type="button"
            className={popup['button']}
            onClick={() => handleClose()}
          >
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    );
  },
);

ServerSettingPopup.displayName = 'ServerSettingPopup';

export default ServerSettingPopup;
