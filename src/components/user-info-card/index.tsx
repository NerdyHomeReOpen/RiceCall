import React, { useState, useLayoutEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import BadgeList from '@/components/badge-list';
import LevelIcon from '@/components/level-icon';

import { getPermissionText } from '@/utils/language';

import { DEFAULT_USER_AVATAR_URL } from '@/constants';

const VIP_BACKGROUNDS: Record<number, string> = {
  0: "bg-[url('/channel/ucard_vip0_bg.svg')]",
  1: "bg-[url('/channel/ucard_vip1_bg.svg')]",
  2: "bg-[url('/channel/ucard_vip2_bg.svg')]",
  3: "bg-[url('/channel/ucard_vip3_bg.svg')]",
  4: "bg-[url('/channel/ucard_vip4_bg.svg')]",
  5: "bg-[url('/channel/ucard_vip5_bg.svg')]",
};

interface UserInfoCardProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  member: Types.OnlineMember;
}

const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(({ x, y, direction, member }) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [cardX, setCardX] = useState(x);
  const [cardY, setCardY] = useState(y);
  const vipBoost = Math.min(2, 1 + member.vip * 0.2);
  const hasVip = member.vip > 0;
  const badges = useMemo(() => (typeof member.badges === 'string' ? JSON.parse(member.badges) : member.badges), [member.badges]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const { offsetWidth: cardWidth, offsetHeight: cardHeight } = cardRef.current;
    const { innerWidth: windowWidth, innerHeight: windowHeight } = window;
    const marginEdge = 10;
    let newPosX = x;
    let newPosY = y;

    if (direction === 'left-top' || direction === 'right-top') {
      newPosY -= cardHeight;
    }

    if (direction === 'left-top' || direction === 'left-bottom') {
      newPosX -= cardWidth;
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
    setIsVisible(true);
  }, [x, y, direction]);

  return (
    <div
      ref={cardRef}
      className={`user-info-card-container absolute z-10000 flex flex-col w-[275px] h-[190px] bg-background bg-no-repeat bg-center bg-cover ${VIP_BACKGROUNDS[member.vip] ?? ''}`}
      style={isVisible ? { top: cardY, left: cardX } : { opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-1 flex-col justify-between h-[164px] px-[12px] pt-[11px] pb-[5px]">
        <div className="flex items-center justify-start w-full h-[98px]">
          <Image src={member.avatarUrl || DEFAULT_USER_AVATAR_URL} alt="user_avatar" width={98} height={98} loading="lazy" draggable="false" />
          <div className="flex flex-1 flex-col justify-between h-full pl-[10px] overflow-hidden">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className={`truncate ${hasVip ? 'text-text-vip-name' : 'text-text-username'}`}>{member.name}</div>
                <LevelIcon level={member.level} xp={member.xp} requiredXp={member.requiredXp} showTooltip={false} />
              </div>
              <div className={`vip-icon-big vip-${member.vip}`} />
              {hasVip && <div className="text-text-warning">{t('vip-upgrade-boost-message', { '0': vipBoost.toString() })}</div>}
            </div>
            <div className="flex flex-col">
              <div className="text-text-color-quaternary">{`${t('level')} ${member.level} (${member.xp}/${member.requiredXp})`}</div>
              <div className="h-[5px] bg-[#e5e7eb] border border-[#b6b6b6] rounded-[2.5px]">
                <div className="h-full bg-[#f6b03b] rounded-[2px]" style={{ width: `${(member.xp / member.requiredXp) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center mb-[5px] not-empty:before:block not-empty:before:min-w-[16px] not-empty:before:min-h-[16px] not-empty:before:mr-[5px] not-empty:before:content-[''] not-empty:before:object-cover not-empty:before:bg-[url('/channel/groupcard.svg')] not-empty:before:bg-no-repeat not-empty:before:bg-position-[0_0] not-empty:before:bg-contain">
            {member.nickname && <div className="truncate text-text-username">{member.nickname}</div>}
          </div>
          <div className="flex items-center">
            <div className="flex items-center">
              <div className={`permission-${member.gender} permission-lv-${member.permissionLevel}`} />
              <div className="text-[#25476a] before:content-['['] after:content-[']']">{getPermissionText(member.permissionLevel)}</div>
            </div>
            <div className="min-w-[2px] min-h-[12px] mx-[5px] bg-[url('/icon_v_split.svg')] bg-no-repeat bg-position-[0_0] bg-auto" />
            <div className="flex items-center">
              <div>{t('contribution')}:</div>
              <div className="text-text-color-quaternary">{member.contribution}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-start w-full h-[26px] px-[5px]">
        <BadgeList badges={badges} position="left-bottom" direction="right-bottom" maxDisplay={13} />
      </div>
    </div>
  );
});

UserInfoCard.displayName = 'UserInfoCard';

export default UserInfoCard;
