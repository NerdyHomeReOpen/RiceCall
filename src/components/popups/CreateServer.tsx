import React, { useEffect, useRef, useState } from 'react';

// CSS
import popup from '@/styles/popup.module.css';
import setting from '@/styles/popups/setting.module.css';
import createServer from '@/styles/popups/createServer.module.css';

// Types
import { User, Server, PopupType, UserServer } from '@/types';

// Providers
import { useSocket } from '@/providers/Socket';
import { useLanguage } from '@/providers/Language';

// Services
import ipcService from '@/services/ipc.service';
import apiService from '@/services/api.service';
import refreshService from '@/services/refresh.service';

// Utils
import { createDefault } from '@/utils/createDefault';

interface CreateServerPopupProps {
  userId: User['userId'];
}

const CreateServerPopup: React.FC<CreateServerPopupProps> = React.memo(
  (initialData: CreateServerPopupProps) => {
    // Hooks
    const lang = useLanguage();
    const socket = useSocket();

    // Refs
    const refreshRef = useRef(false);

    // Constant
    const SERVER_TYPES: { value: Server['type']; name: string }[] = [
      {
        value: 'game',
        name: lang.tr.game,
      },
      {
        value: 'entertainment',
        name: lang.tr.entertainment,
      },
      {
        value: 'other',
        name: lang.tr.other,
      },
    ];

    // States
    const [user, setUser] = useState<User>(createDefault.user());
    const [servers, setServers] = useState<UserServer[]>([]);
    const [server, setServer] = useState<Server>(createDefault.server());
    const [section, setSection] = useState<number>(0);

    // Variables
    const { userId } = initialData;
    const { level: userLevel } = user;
    const {
      name: serverName,
      type: serverType,
      avatar: serverAvatar,
      avatarUrl: serverAvatarUrl,
      slogan: serverSlogan,
    } = server;
    const MAX_GROUPS =
      userLevel >= 16 ? 5 : userLevel >= 6 && userLevel < 16 ? 4 : 3;
    const remainingServers = MAX_GROUPS - servers.filter((s) => s.owned).length;
    const canCreate = remainingServers > 0;

    // Handlers

    const handleCreateServer = (server: Partial<Server>) => {
      if (!socket) return;
      socket.send.createServer({ server });
    };

    const handleOpenErrorDialog = (message: string) => {
      ipcService.popup.open(PopupType.DIALOG_ERROR, 'errorDialog');
      ipcService.initialData.onRequest('errorDialog', {
        title: message,
        submitTo: 'errorDialog',
      });
    };

    const handleClose = () => {
      ipcService.window.close();
    };

    // Effects
    useEffect(() => {
      if (!userId || refreshRef.current) return;
      const refresh = async () => {
        refreshRef.current = true;
        Promise.all([
          refreshService.user({
            userId: userId,
          }),
          refreshService.userServers({
            userId: userId,
          }),
        ]).then(([user, servers]) => {
          if (user) {
            setUser(user);
          }
          if (servers) {
            setServers(servers);
          }
        });
      };
      refresh();
    }, [userId]);

    switch (section) {
      // Server Type Selection Section
      case 0:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupTab']}>
              <div className={`${popup['item']} ${popup['active']}`}>
                {lang.tr.selectServerType}
              </div>
            </div>

            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={`${createServer['message']}`}>
                  {`${lang.tr.remainingServer1} ${remainingServers} ${lang.tr.remainingServer2}`}
                </div>
                <label className={createServer['typeLabel']} data-key="60030">
                  {lang.tr.selectServerTypeDescription}
                </label>
                <div className={createServer['buttonGroup']}>
                  {SERVER_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`${createServer['button']} ${
                        serverType === type.value
                          ? createServer['selected']
                          : ''
                      }`}
                      onClick={() => {
                        setServer((prev) => ({
                          ...prev,
                          type: type.value as Server['type'],
                        }));
                        if (canCreate) {
                          setSection(1);
                        }
                      }}
                    >
                      {type.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={popup['popupFooter']}>
              <button className={popup['button']} onClick={() => handleClose()}>
                {lang.tr.cancel}
              </button>
            </div>
          </div>
        );

      // Server Data Input Section
      case 1:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupTab']}>
              <div className={`${popup['item']}  ${popup['active']}`}>
                {lang.tr.fillInfo}
              </div>
            </div>

            <div className={popup['popupBody']}>
              <div className={setting['body']}>
                <div className={createServer['avatarWrapper']}>
                  <div
                    className={createServer['avatarPicture']}
                    style={{ backgroundImage: `url(${serverAvatarUrl})` }}
                  />
                  <input
                    name="avatar"
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
                        const data = await apiService.post('/upload', formData);
                        if (data) {
                          setServer((prev) => ({
                            ...prev,
                            avatar: data.avatar,
                            avatarUrl: data.avatarUrl,
                          }));
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label
                    htmlFor="avatar-upload"
                    style={{ marginTop: '10px' }}
                    className={popup['button']}
                  >
                    {lang.tr.uploadAvatar}
                  </label>
                </div>
                <div className={createServer['inputGroup']}>
                  <div className={popup['inputBox']}>
                    <div
                      className={`${popup['label']} ${createServer['labelText']}`}
                    >
                      {lang.tr.serverType}
                    </div>
                    <span style={{ color: '#666666' }}>
                      {lang.tr[serverType as keyof typeof lang.tr]}
                    </span>
                  </div>

                  <div
                    className={`${popup['inputBox']} ${createServer['inputBox']}`}
                  >
                    <div className={`${popup['label']} ${popup['required']}`}>
                      {lang.tr.serverName}
                    </div>
                    <div className={createServer['inputWrapper']}>
                      <input
                        name="name"
                        type="text"
                        value={serverName}
                        maxLength={32}
                        onChange={(e) =>
                          setServer((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <span className={createServer['inputDescription']}>
                        {lang.tr.serverNamePlaceholder}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`${popup['inputBox']} ${createServer['inputBox']}`}
                  >
                    <div className={popup['label']}>{lang.tr.serverSlogan}</div>
                    <div className={createServer['inputWrapper']}>
                      <input
                        name="slogan"
                        type="text"
                        value={serverSlogan}
                        maxLength={32}
                        onChange={(e) =>
                          setServer((prev) => ({
                            ...prev,
                            slogan: e.target.value,
                          }))
                        }
                      />
                      <span className={createServer['inputDescription']}>
                        {lang.tr.serverSloganPlaceholder}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={popup['popupFooter']}>
              <button className={popup['button']} onClick={() => setSection(0)}>
                {lang.tr.previous}
              </button>
              <button
                className={popup['button']}
                disabled={!serverName.trim() || !canCreate}
                onClick={() => {
                  handleCreateServer({
                    name: serverName,
                    avatar: serverAvatar,
                    avatarUrl: serverAvatarUrl,
                    slogan: serverSlogan,
                    type: serverType,
                    ownerId: userId,
                  });
                  handleClose();
                }}
              >
                {lang.tr.created}
              </button>
              <button className={popup['button']} onClick={() => handleClose()}>
                {lang.tr.cancel}
              </button>
            </div>
          </div>
        );
    }
  },
);

CreateServerPopup.displayName = 'CreateServerPopup';

export default CreateServerPopup;
