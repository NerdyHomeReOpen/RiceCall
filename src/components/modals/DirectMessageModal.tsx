/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { useSelector } from 'react-redux';

// Components
import Modal from '@/components/Modal';

// Types
import { User, Friend, DirectMessage } from '@/types';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';
import { useSocket } from '@/providers/SocketProvider';

// Components
import MessageViewer from '@/components/viewers/MessageViewer';
import MessageInputBox from '@/components/MessageInputBox';

interface DirectMessageModalProps {
  friend: Friend;
  onClose: () => void;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = React.memo(
  ({ onClose, friend }) => {
    // Redux
    const user = useSelector((state: { user: User }) => state.user);

    // Language
    const lang = useLanguage();

    // Socket
    const socket = useSocket();

    // Variables
    const userId = user.id;
    const friendUser = friend?.user || {
      id: '',
      name: lang.tr.unknownUser,
      avatar: '',
      avatarUrl: '',
      signature: '',
      status: 'online',
      gender: 'Male',
      level: 0,
      xp: 0,
      requiredXp: 0,
      progress: 0,
      currentChannelId: '',
      currentServerId: '',
      lastActiveAt: 0,
      createdAt: 0,
    };
    const friendId = friendUser.id;
    const friendAvatar = friendUser.avatarUrl;
    const friendName = friendUser.name;
    const friendLevel = friendUser.level;
    const friendGrade = Math.min(56, Math.ceil(friendLevel / 5)); // 56 is max level
    const friendDirectMessages = friend.directMessages || [];

    // Handlers
    const handleSendMessage = (directMessage: DirectMessage) => {
      socket?.send.directMessage({ directMessage });
    };

    return (
      <Modal title={friendName} onClose={onClose} width="600px" height="600px">
        <div className="flex h-full">
          {/* Side Menu */}
          <div className="flex flex-col p-4 w-40 bg-blue-50 text-sm">
            {/* <img src={friendAvatar} className="w-24 h-24" /> */}
            <div className="flex items-center gap-2">
              <div className="">{`${lang.tr.level}: ${friendLevel}`}</div>
              {/* <img src={friendGradeUrl} className="select-none" /> */}
            </div>
          </div>
          {/* Main Content */}
          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Messages Area */}
            <div className="flex flex-[5] p-3">
              <MessageViewer messages={friendDirectMessages} />
            </div>
            {/* Input Area */}
            <div className="flex flex-[1] p-3">
              <MessageInputBox
                onSendMessage={(msg) => {
                  handleSendMessage({
                    id: '',
                    type: 'general',
                    content: msg,
                    senderId: userId,
                    friendId: friendId,
                    timestamp: 0,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </Modal>
    );
  },
);

DirectMessageModal.displayName = 'DirectMessageModal';

export default DirectMessageModal;
