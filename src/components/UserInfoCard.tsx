import React, { useState, useLayoutEffect, useRef } from 'react';

// CSS
import userInfoCard from '@/styles/userInfoCard.module.css';
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
      className={`context-menu-container 
          ${userInfoCard['userInfoCard']} 
          ${userInfoCard[`vip-${memberVip}`]}
        `}
      style={{ top: cardY, left: cardX }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className={userInfoCard['body']}>
        {/* Top Section */}
        <div className={userInfoCard['top']}>
          {/* Left Avatar */}
          <div className={userInfoCard['avatarPicture']} style={{ backgroundImage: `url(${memberAvatarUrl})` }} />

          {/* Right Info */}
          <div className={userInfoCard['userInfoWrapper']}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
              }}
            >
              <div className={`${userInfoCard['name']} ${memberVip > 0 && vip['isVIP']}`}>{memberName}</div>
              <div
                className={`
                    ${grade['grade']} 
                    ${grade[`lv-${Math.min(56, memberLevel)}`]}
                  `}
              />
            </div>
            <div
              className={`
                  ${vip['vipIconBig']} 
                  ${vip[`vip-big-${memberVip}`]}
                `}
            />

            {/* VIP Info Text */}
            {memberVip > 0 && (
              <div className={userInfoCard['vipText']}>
                {t('vip-upgrade-boost', { vipBoostMultiplier: vipBoostMultiplier.toString() })}
              </div>
            )}

            {/* Xp Info */}
            <div className={userInfoCard['xpWrapper']}>
              <div className={userInfoCard['levelText']}>{`${t('level')} ${memberLevel} `}</div>
              <div className={userInfoCard['xpBox']}>
                <div
                  className={userInfoCard['xpProgress']}
                  style={{ width: `${(memberXp / memberRequiredXp) * 100}%` }}
                />
              </div>
              <div className={userInfoCard['xpText']}>
                <div>{memberXp}</div>
                <div>{memberRequiredXp}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={userInfoCard['bottom']}>
          {/* Nickname Row */}
          <div className={userInfoCard['nicknameRow']}>
            {memberNickname && <div className={userInfoCard['nickname']}>{memberNickname}</div>}
          </div>

          {/* Info Row */}
          <div className={userInfoCard['infoRow']}>
            {/* Permission */}
            <div className={userInfoCard['permissionWrapper']}>
              <div
                className={`
                      ${permission[memberGender]} 
                      ${permission[`lv-${memberPermission}`]}`}
              />
              <div className={userInfoCard['permissionText']}>{getPermissionText(t, memberPermission)}</div>
            </div>

            <div className={userInfoCard['saperator']} />

            {/* Contribution */}
            <div className={userInfoCard['contributionBox']}>
              <div className={userInfoCard['contributionText']}>{t('contribution')}:</div>
              <div className={userInfoCard['contributionValue']}>{memberContributions}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className={userInfoCard['footer']}>
        <BadgeListViewer badges={memberBadges} maxDisplay={13} />
      </div>
    </div>
  );
});

UserInfoCard.displayName = 'UserInfoCard';

export default UserInfoCard;
