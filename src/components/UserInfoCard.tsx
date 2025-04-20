import React, { useState, useEffect, useRef } from 'react';

// CSS
import userInfoCard from '@/styles/userInfoCard.module.css';
import grade from '@/styles/grade.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

// Components
import BadgeViewer from '@/components/viewers/Badge';

// Types
import type { ServerMember } from '@/types';

// Providers
import { useLanguage } from '@/providers/Language';

interface UserInfoCardProps {
  x: number;
  y: number;
  member: ServerMember;
}

const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(
  ({ x, y, member }) => {
    // Refs
    const cardRef = useRef<HTMLDivElement>(null);

    // Language
    const lang = useLanguage();

    // State
    const [cardX, setCardX] = useState(x);
    const [cardY, setCardY] = useState(y);

    // Effect
    useEffect(() => {
      if (cardRef.current) {
        const cardWidth = cardRef.current.offsetWidth;
        const cardHeight = cardRef.current.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let newCardX = x;
        let newCardY = y;

        if (newCardX + cardWidth > windowWidth - 20) {
          newCardX = windowWidth - cardWidth - 20;
        }

        if (newCardY + cardHeight > windowHeight - 20) {
          newCardY = windowHeight - cardHeight - 20;
        }

        setCardX(newCardX);
        setCardY(newCardY);
      }
    }, [x, y]);

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
    const memberGrade = Math.min(56, memberLevel);
    const vipBoostMultiplier = Math.min(2, 1 + memberVip * 0.2);

    return (
      <div
        ref={cardRef}
        className={`context-menu-container ${userInfoCard['userInfoCard']} ${
          userInfoCard[`vip-${memberVip}`]
        }`}
        style={{ top: cardY, left: cardX }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className={userInfoCard['body']}>
          <div className={userInfoCard['top']}>
            {/* Left Avatar */}
            <div
              className={userInfoCard['avatarPicture']}
              style={{ backgroundImage: `url(${memberAvatarUrl})` }}
            />
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
                <div className={userInfoCard['name']}>{memberName}</div>
                <div
                  className={`${grade['grade']} ${grade[`lv-${memberGrade}`]}`}
                />
              </div>
              <div
                className={`${vip['vipIconBig']} ${
                  vip[`vip-big-${memberVip}`]
                }`}
              />
              {/* VIP Info Text */}
              {memberVip > 0 && (
                <div className={userInfoCard['vipText']}>
                  {lang.tr.vipUpgradeBoost.replace(
                    '{0}',
                    vipBoostMultiplier.toString(),
                  )}
                </div>
              )}
              {/* Xp Section */}
              <div className={userInfoCard['xpWrapper']}>
                <div className={userInfoCard['levelText']}>
                  {`${lang.tr.level} ${memberGrade} `}
                </div>
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
              {memberNickname && (
                <div className={userInfoCard['nickname']}>{memberNickname}</div>
              )}
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
                <div className={userInfoCard['permissionText']}>
                  {lang.getPermissionText(memberPermission)}
                </div>
              </div>

              <div className={userInfoCard['saperator']} />

              {/* Contribution */}
              <div className={userInfoCard['contributionBox']}>
                <div className={userInfoCard['contributionText']}>
                  {lang.tr.contribution}:
                </div>
                <div className={userInfoCard['contributionValue']}>
                  {memberContributions}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className={userInfoCard['footer']}>
          <BadgeViewer badges={memberBadges} maxDisplay={13} />
        </div>
      </div>
    );
  },
);

UserInfoCard.displayName = 'UserInfoCard';

export default UserInfoCard;
