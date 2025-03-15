/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { FormEvent, useState } from 'react';
import { Channel } from '@/types';
import { useSocket } from '@/providers/SocketProvider';
import Dialog from '@/components/modals/Dialog';

import DeleteChannel from '../../styles/popups/deleteChannel.module.css';
import Popup from '../../styles/common/popup.module.css';
import { useLanguage } from '@/providers/LanguageProvider';

interface DeleteChannelModalProps {
  onClose: () => void;
  channel: Channel;
}

const DeleteChannelModal: React.FC<DeleteChannelModalProps> = ({
  onClose,
  channel,
}) => {
  // Language
  const lang = useLanguage();

  // Socket
  const socket = useSocket();

  // Error Control
  const [error, setError] = useState('');

  // Handlers
  const handleSubmit = async (e: FormEvent<Element>) => {
    e.preventDefault();
    socket?.send.deleteChannel({ channelId: channel.id });
    onClose();
  };

  return (
    <form className={Popup['popupContainer']} onSubmit={handleSubmit}>
      <div className={Popup['popupMessageWrapper']}>
        <div className={DeleteChannel['popupBody']}>
          {/* <Dialog
            popupIcon="popupIconWarning"
            textBorder={Popup['textBorder']}
            title={`您確定要刪除頻道：${channel?.name} 嗎？`}
            onSubmit={handleSubmit}
            onClose={onClose}
            iconType={'error'}
            submitTo={''}
          /> */}
        </div>

        <div className={Popup['popupFooter']}>
          <button type="submit" className={Popup['button']}>
            {lang.tr.confirm}
          </button>
          <button type="button" className={Popup['button']} onClick={onClose}>
            {lang.tr.cancel}
          </button>
        </div>
      </div>
    </form>
  );
};

DeleteChannelModal.displayName = 'DeleteChannelModal';

export default DeleteChannelModal;
