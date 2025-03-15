/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { ArrowUp } from 'lucide-react';

// CSS
import UserInfoCard from '@/styles/common/channelInfoCard.module.css';
import styles from '@/styles/serverPage.module.css';
import Grade from '@/styles/common/grade.module.css';
import Vip from '@/styles/common/vip.module.css';
import Permission from '@/styles/common/permission.module.css';

// Components
import BadgeViewer from '@/components/viewers/BadgeViewer';

// Types
import type { User, Server } from '@/types';
import { getPermissionText } from '@/utils/formatters';

// Providers
import { useLanguage } from '@/providers/LanguageProvider';

interface UserInfoBlockProps {
  user: User | null;
  server: Server | null;
  x: number;
  y: number;
  onClose: () => void;
}

const UserInfoBlock: React.FC<UserInfoBlockProps> = React.memo(
  ({ onClose, x, y, user, server }) => {
    // Language
    const lang = useLanguage();

    if (!user) return null;

    const userGender = user.gender;
    const userMember = server?.members?.[user.id];
    const userPermission = userMember?.permissionLevel ?? 1;
    const userContributions = userMember?.contribution ?? 0;
    const userLevel = Math.min(56, Math.ceil(user.level / 5));
    const userXp = user.xp ?? 0;
    const userXpProgress = user.progress ?? 0;
    const userRequiredXp = user.requiredXp ?? 0;
    const userBadges = user.badges ?? [];
    const userName = user.name;
    const userAvatar = user.avatarUrl ?? '/pfp/default.png';

    return (
      <div
        className={`${UserInfoCard['userInfoCard']} ${UserInfoCard['info-card-vip-5']}`}
        style={{ top: y, left: x }}
      >
        <div className={`${UserInfoCard['userInfoHeader']}}`}>
          {/* Left Avatar */}
          <div className={UserInfoCard['userInfoAvatarPicture']}></div>
          {/* Right Info */}
          <div className={UserInfoCard['userInfoRight']}>
            <div className={UserInfoCard['userInfoUsername']}>{userName}</div>
            <div
              className={`${styles['userGrade']} ${UserInfoCard['userGrade']} ${
                Grade[`lv-${userLevel}`]
              }`}
            ></div>
            <div className={`${Vip['vipIconBig']} ${Vip['vip-big-5']}`}></div>
            {/* VIP Info Text */}
            <div className={UserInfoCard['userInfoVipText']}>
              (會員%s倍升級加速中)
            </div>

            {/* Xp Section */}
            <div className={UserInfoCard['userInfoXpWrapper']}>
              {/** Show Xp Progress */}
              <div className={UserInfoCard['userInfoXpBox']}>
                <div
                  className={UserInfoCard['userInfoXpProgress']}
                  style={{
                    width: `${userXpProgress * 100}%`,
                  }}
                />
                {/** Xp Text */}
                <div className={UserInfoCard['userInfoXpText']}>
                  <div>0</div>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${userXpProgress * 100}%`,
                      transform: 'translateX(-50%) scale(0.8)',
                      bottom: '-25px',
                    }}
                    className="flex flex-col items-center"
                  >
                    <ArrowUp size={12} className="text-blue-500" />
                    <span>{userXp}</span>
                  </div>
                  <div>{userRequiredXp}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className={UserInfoCard['userInfoBottom']}>
            <div
              className={`${UserInfoCard['userInfoPermission']} ${
                Permission[userGender]
              } ${Permission[`lv-${userPermission}`]}`}
            ></div>
            <div className={UserInfoCard['userInfoPermissionText']}>
              {getPermissionText(userPermission, lang.tr)}
            </div>
            <div className={styles['saperator']}></div>
            <div className={UserInfoCard['userInfoContributionBox']}>
              <div className={UserInfoCard['userInfoContributionText']}>
                {lang.tr.contribution}:
              </div>
              <div className={UserInfoCard['userInfoContributionTextVal']}>
                {userContributions}
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className={UserInfoCard['userInfoBadges']}>
            <BadgeViewer badges={userBadges} maxDisplay={13} />
          </div>
        </div>
      </div>
    );
  },
);

UserInfoBlock.displayName = 'UserInfoBlock';

export default UserInfoBlock;
