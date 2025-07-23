import React, { useState, useLayoutEffect, useRef } from 'react';

// CSS
import styles from '@/styles/userInfoCard.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Components
import BadgeListViewer from '@/components/BadgeList';

// Types
import type { ServerMember } from '@/types';

// Providers
import { useTranslation } from 'react-i18next';

// Utils
import { getPermissionText } from '@/utils/language';

interface UserInfoCardProps {
  member: ServerMember;
  x?: number;
  y?: number;
  preferTop?: boolean;
}

const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(({ member, x = 0, y = 0, preferTop = false }) => {
  // Refs
  const cardRef = useRef<HTMLDivElement>(null);

  // Language
  const { t } = useTranslation();

  // State
  const [cardX, setCardX] = useState(x);
  const [cardY, setCardY] = useState(y);

  // Effect
  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const marginEdge = 10;

    let newPosX = x;
    let newPosY = y;

    const cardWidth = cardRef.current.offsetWidth;
    const cardHeight = cardRef.current.offsetHeight;

    if (cardWidth === 0 || cardHeight === 0) {
      return;
    }

    if (preferTop) {
      newPosY -= cardHeight;
    }

    if (newPosX + cardWidth + marginEdge > windowWidth) {
      newPosX = windowWidth - cardWidth - marginEdge;
    }
    if (newPosX < marginEdge) {
      newPosX = marginEdge;
    }
    if (newPosY + cardHeight + marginEdge > windowHeight) {
      newPosY = windowHeight - cardHeight - marginEdge;
    }
    if (newPosY < marginEdge) {
      newPosY = marginEdge;
    }

    setCardX(newPosX);
    setCardY(newPosY);
  }, [x, y, preferTop]);

  const {
    name: memberName,
    avatarUrl: memberAvatarUrl,
    gender: memberGender,
    level: memberLevel,
    xp: memberXp,
    requiredXp: memberRequiredXp,
    badges: memberBadges,
    permissionLevel: memberPermission,
    contribution: memberContributions,
    nickname: memberNickname,
    vip: memberVip,
  } = member;
  const vipBoostMultiplier = Math.min(2, 1 + memberVip * 0.2);

  return (
    <div
      ref={cardRef}
      className={`context-menu-container ${styles['user-info-card']} ${styles[`vip-${memberVip}`]}`}
      style={{ top: cardY, left: cardX }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className={styles['body']}>
        {/* Top Section */}
        <div className={styles['top']}>
          {/* Left Avatar */}
          <div className={styles['avatar-picture']} style={{ backgroundImage: `url(${memberAvatarUrl})` }} />

          {/* Right Info */}
          <div className={styles['user-info-wrapper']}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
              <div className={`${styles['name-text']} ${memberVip > 0 && vip['vip-name-color']}`}>{memberName}</div>
              <div className={`${grade['grade']} ${grade[`lv-${Math.min(56, memberLevel)}`]}`} />
            </div>
            <div className={` ${vip['vip-icon-big']} ${vip[`vip-${memberVip}`]}`} />

            {/* VIP Info Text */}
            {memberVip > 0 && <div className={styles['vip-boost-text']}>{t('vip-upgrade-boost', { '0': vipBoostMultiplier.toString() })}</div>}

            {/* Xp Info */}
            <div className={styles['xp-wrapper']}>
              <div className={styles['level-text']}>{`${t('level')} ${memberLevel} `}</div>
              <div className={styles['xp-progress-container']}>
                <div className={styles['xp-progress']} style={{ width: `${(memberXp / memberRequiredXp) * 100}%` }} />
              </div>
              <div className={styles['xp-text']}>
                <div>{memberXp}</div>
                <div>{memberRequiredXp}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles['bottom']}>
          {/* Nickname Row */}
          <div className={styles['nickname-row']}>{memberNickname && <div className={styles['nickname-text']}>{memberNickname}</div>}</div>

          {/* Info Row */}
          <div className={styles['info-row']}>
            {/* Permission */}
            <div className={styles['permission-wrapper']}>
              <div className={`${permission[memberGender]} ${permission[`lv-${memberPermission}`]}`} />
              <div className={styles['permission-text']}>{getPermissionText(t, memberPermission)}</div>
            </div>

            {/* Saperator */}
            <div className={styles['saperator']} />

            {/* Contribution */}
            <div className={styles['contribution-wrapper']}>
              <div className={styles['contribution-text']}>{t('contribution')}:</div>
              <div className={styles['contribution-value']}>{memberContributions}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className={styles['footer']}>
        <BadgeListViewer badges={memberBadges} maxDisplay={13} />
      </div>
    </div>
  );
});

UserInfoCard.displayName = 'UserInfoCard';

export default UserInfoCard;
