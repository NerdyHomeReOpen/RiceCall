import React, { useState, useLayoutEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import type * as Types from '@/types';

import BadgeList from '@/components/BadgeList';
import LevelIcon from '@/components/LevelIcon';

import * as Language from '@/utils/language';

import styles from '@/styles/userInfoCard.module.css';
import vip from '@/styles/vip.module.css';
import permission from '@/styles/permission.module.css';

export interface UserInfoCardProps {
  x: number;
  y: number;
  direction: 'left-top' | 'left-bottom' | 'right-top' | 'right-bottom';
  member: Types.OnlineMember;
}

const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(({ x, y, direction, member }) => {
  // Hooks
  const { t } = useTranslation();

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);

  // States
  const [display, setDisplay] = useState(false);
  const [cardX, setCardX] = useState(x);
  const [cardY, setCardY] = useState(y);

  // Variables
  const vipBoost = Math.min(2, 1 + member.vip * 0.2);
  const hasVip = member.vip > 0;
  const badges = useMemo(() => (typeof member.badges === 'string' ? JSON.parse(member.badges) : member.badges), [member.badges]);

  // Effects
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
    setDisplay(true);
  }, [x, y, direction]);

  return (
    <div
      ref={cardRef}
      className={`user-info-card-container ${styles['user-info-card']} ${styles[`vip-${member.vip}`]}`}
      style={display ? { top: cardY, left: cardX } : { opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={styles['body']}>
        <div className={styles['top']}>
          <Image src={member.avatarUrl} alt={member.name} width={98} height={98} loading="lazy" draggable="false" />
          <div className={styles['user-info-wrapper']}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className={`${styles['name-text']} ${hasVip && vip['vip-name-color']}`}>{member.name}</div>
                <LevelIcon level={member.level} xp={member.xp} requiredXp={member.requiredXp} showTooltip={false} />
              </div>
              <div className={` ${vip['vip-icon-big']} ${vip[`vip-${member.vip}`]}`} />
              {hasVip && <div className={styles['vip-boost-text']}>{t('vip-upgrade-boost-message', { '0': vipBoost.toString() })}</div>}
            </div>
            <div className={styles['xp-wrapper']}>
              <div className={styles['level-text']}>{`${t('level')} ${member.level} (${member.xp}/${member.requiredXp})`}</div>
              <div className={styles['xp-progress-container']}>
                <div className={styles['xp-progress']} style={{ width: `${(member.xp / member.requiredXp) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className={styles['bottom']}>
          <div className={styles['nickname-row']}>{member.nickname && <div className={styles['nickname-text']}>{member.nickname}</div>}</div>
          <div className={styles['info-row']}>
            <div className={styles['permission-wrapper']}>
              <div className={`${permission[member.gender]} ${permission[`lv-${member.permissionLevel}`]}`} />
              <div className={styles['permission-text']}>{Language.getPermissionText(t, member.permissionLevel)}</div>
            </div>
            <div className={styles['saperator']} />
            <div className={styles['contribution-wrapper']}>
              <div className={styles['contribution-text']}>{t('contribution')}:</div>
              <div className={styles['contribution-value']}>{member.contribution}</div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles['footer']}>
        <BadgeList badges={badges} position="left-bottom" direction="right-bottom" maxDisplay={13} />
      </div>
    </div>
  );
});

UserInfoCard.displayName = 'UserInfoCard';

export default UserInfoCard;
