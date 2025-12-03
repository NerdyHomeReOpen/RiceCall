import React, { useState } from 'react';

// Types
import type { Member, User, Server } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// CSS
import popup from '@/styles/popup.module.css';
import groupApplied from '@/styles/groupApplied.module.css';

interface GroupAppliedPopupProps {
  userId: User['userId'];
  serverId: Server['serverId'];
  member: Member;
}

const GroupAppliedPopup: React.FC<GroupAppliedPopupProps> = React.memo(({ userId, serverId, member }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [memberNickname, setMemberNickname] = useState<string>(member.nickname || '');

  // Variables
  const { name: memberName } = member;

  return (
    <div className={popup['popup-wrapper']}>
      {/* Body */}
      <div className={popup['popup-body']}>
        <div className={groupApplied['middle-area']}>
          <div className={`${groupApplied['button-item-box']} ${groupApplied['active']}`}>
            <div className={groupApplied['button-item-icon']}></div>
            <div className={groupApplied['button-item-text']}>投票</div>
          </div>
          <div className={groupApplied['button-item-box']}>
            <div className={groupApplied['button-item-icon']}></div>
            <div className={groupApplied['button-item-text']}>頻道事件</div>
          </div>
          <div className={groupApplied['button-item-box']}>
            <div className={groupApplied['button-item-icon']}></div>
            <div className={groupApplied['button-item-text']}>送花</div>
          </div>
          <div className={groupApplied['button-item-box']}>
            <div className={groupApplied['button-item-icon']}></div>
            <div className={groupApplied['button-item-text']}>刮刮樂</div>
          </div>
          <div className={groupApplied['button-item-box']}>
            <div className={groupApplied['button-item-icon']}></div>
            <div className={groupApplied['button-item-text']}>秀場</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={popup['popup-footer']}>
        <div className={groupApplied['placeholder']}>
        </div>
      </div>
    </div>
  );
});

GroupAppliedPopup.displayName = 'GroupAppliedPopup';

export default GroupAppliedPopup;
