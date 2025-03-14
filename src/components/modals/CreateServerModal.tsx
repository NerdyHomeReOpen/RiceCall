/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';

// CSS
import popup from '@/styles/common/popup.module.css';
import createServer from '@/styles/popups/createServer.module.css';

// Types
import { type User, type Server, popupType } from '@/types';

// Providers
import { useSocket } from '@/providers/SocketProvider';

// Services
import { ipcService } from '@/services/ipc.service';

// Validation
export const validateName = (name: string): string => {
  if (!name?.trim()) return '請輸入群組名稱';
  if (name.length < 6) return '群組名稱不能少於6個字符';
  if (name.length > 30) return '群組名稱不能超過30個字符';
  return '';
};
export const validateDescription = (description: string): string => {
  if (!description?.trim()) return '';
  if (description.length > 200) return '口號不能超過200個字符';
  return '';
};
export const validateSlogan = (slogan: string): string => {
  if (!slogan?.trim()) return '';
  if (slogan.length > 30) return '口號不能超過30個字符';
  return '';
};

interface CreateServerModalProps {
  user: User | null;
}

const CreateServerModal: React.FC<CreateServerModalProps> = React.memo(
  (initialData: CreateServerModalProps) => {
    // Variables
    const maxGroups = 3;
    const userId = initialData.user?.id || '';
    const userOwnedServers = initialData.user?.ownedServers || [];
    const remainingGroups = maxGroups - userOwnedServers.length;
    const canCreate = remainingGroups > 0;

    // Socket Control
    const socket = useSocket();

    // Section Control
    const [section, setSection] = useState<number>(0);

    // Error Control
    const [errors, setErrors] = useState<{ [key: string]: string }>({
      name: '',
      description: '',
    });

    // Form Control
    const [server, setServer] = useState<Server>({
      id: '',
      name: '',
      avatar: null,
      avatarUrl: null,
      level: 0,
      description: '',
      wealth: 0,
      slogan: '',
      announcement: '',
      type: '',
      displayId: '',
      lobbyId: '',
      ownerId: '',
      settings: {
        allowDirectMessage: true,
        visibility: 'public',
        defaultChannelId: '',
      },
      createdAt: 0,
    });

    // Handlers
    const handleClose = () => {
      ipcService.window.close();
    };

    const handleCreateServer = (server: Server) => {
      socket?.send.createServer({ server: server });
    };

    const handleOpenErrorDialog = (message: string) => {
      ipcService.popup.open(popupType.DIALOG_ERROR);
      ipcService.initialData.onRequest(popupType.DIALOG_ERROR, {
        title: message,
        submitTo: popupType.DIALOG_ERROR,
      });
    };

    switch (section) {
      // Server Type Selection Section
      case 0:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={createServer['tab']}>
                <div
                  className={`${createServer['item']} ${createServer['active']}`}
                >
                  {'選擇語音群類型'}
                </div>
                <div className={`${createServer['item']}`}>{'填寫資料'}</div>
              </div>
              <div className={createServer['body']}>
                <div className={`${createServer['message']}`}>
                  {`您還可以創建${remainingGroups}個群，創建之後不能刪除或轉讓`}
                </div>
                <label className={createServer['typeLabel']} data-key="60030">
                  {'請您選擇語音群類型'}
                </label>
                <div className={createServer['buttonGroup']}>
                  {['遊戲', '娛樂', '其他'].map((type) => (
                    <div
                      key={type}
                      className={`${createServer['button']} ${
                        server.type === type ? createServer['selected'] : ''
                      }`}
                      onClick={() => setServer({ ...server, type })}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={popup['popupFooter']}>
              <button
                className={`${popup['button']} ${
                  !server.type || !canCreate ? popup['disabled'] : ''
                }`}
                disabled={!server.type || !canCreate}
                onClick={() => setSection(1)}
              >
                下一步
              </button>
              <button className={popup['button']} onClick={handleClose}>
                取消
              </button>
            </div>
          </div>
        );

      // Server Data Input Section
      case 1:
        return (
          <div className={popup['popupContainer']}>
            <div className={popup['popupBody']}>
              <div className={createServer['tab']}>
                <div className={`${createServer['item']}`}>
                  {'選擇語音群類型'}
                </div>
                <div
                  className={`${createServer['item']} ${createServer['active']}`}
                >
                  {'填寫資料'}
                </div>
              </div>
              <div className={createServer['body']}>
                <div className={createServer['avatarWrapper']}>
                  <div
                    className={createServer['avatarPicture']}
                    style={
                      server.avatar
                        ? { backgroundImage: `url(${server.avatar})` }
                        : {}
                    }
                  />
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        handleOpenErrorDialog('無法讀取圖片');
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        handleOpenErrorDialog('圖片大小不能超過5MB');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setServer((prev) => ({
                          ...prev,
                          avatar: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label
                    htmlFor="avatar-upload"
                    style={{ marginTop: '10px' }}
                    className={popup['button']}
                  >
                    更換頭像
                  </label>
                </div>
                <div className={createServer['inputGroup']}>
                  <div className={popup['inputBox']}>
                    <div className={popup['label']}>群類型</div>
                    <input
                      className={popup['input']}
                      disabled
                      value={server.type}
                    />
                  </div>
                  <div className={popup['inputBox']}>
                    <div className={`${popup['label']} ${popup['required']}`}>
                      群名稱
                    </div>
                    <input
                      className={popup['input']}
                      type="text"
                      value={server.name}
                      onChange={(e) =>
                        setServer({ ...server, name: e.target.value })
                      }
                      onBlur={() =>
                        setErrors({
                          ...errors,
                          name: validateName(server.name),
                        })
                      }
                      placeholder="6-30個字元組成，首尾輸入的空格無效，不能包含不雅詞彙。"
                    />
                    {/* {errors.name && <p className="text-red-500">{errors.name}</p>} */}
                  </div>
                  <div className={popup['inputBox']}>
                    <div className={popup['label']}>口號</div>
                    <textarea
                      className={popup['input']}
                      value={server.description}
                      onChange={(e) =>
                        setServer({ ...server, description: e.target.value })
                      }
                      onBlur={() =>
                        setErrors({
                          ...errors,
                          description: validateDescription(server.description),
                        })
                      }
                      placeholder="0-30個字元，口號是您建立團隊的目標"
                    />
                    {/* {errors.description && (
                  <p className="text-red-500">{errors.description}</p>
                )} */}
                  </div>
                </div>
              </div>
            </div>
            <div className={popup['popupFooter']}>
              <button className={popup['button']} onClick={() => setSection(0)}>
                上一步
              </button>
              <button
                className={`${popup['button']} ${
                  !server.name.trim() || !canCreate ? popup['disabled'] : ''
                }`}
                disabled={!server.name.trim() || !canCreate}
                onClick={() => {
                  handleCreateServer({ ...server, ownerId: userId });
                  handleClose();
                }}
              >
                確定
              </button>
            </div>
          </div>
        );
    }
  },
);

CreateServerModal.displayName = 'CreateServerModal';

export default CreateServerModal;
