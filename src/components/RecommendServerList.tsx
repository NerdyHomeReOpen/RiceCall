import React, { useMemo, useState } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Types
import type { RecommendServerList, User } from '@/types';

// Components
import RecommendServerCard from '@/components/RecommendServerCard';

// Providers
import { useTranslation } from 'react-i18next';

interface RecommendServerListProps {
  user: User;
  recommendServerList: RecommendServerList;
}

const RecommendServerList: React.FC<RecommendServerListProps> = React.memo(({ user, recommendServerList }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);

  // Memos
  const categories = useMemo(() => Object.keys(recommendServerList), [recommendServerList]);

  return (
    <>
      <aside className={homePage['sidebar']}>
        <div className={homePage['scroll-view']}>
          <div className={homePage['category-list']}>
            {categories.map((category, index) => (
              <div key={category}>
                <div onClick={() => setSelectedCategoryId(index)} className={`${homePage['category-tab']} ${selectedCategoryId === index ? homePage['selected'] : ''}`}>
                  <div className={homePage['category-name']}>{t(category)}</div>
                  <div className={homePage['category-count']}>{`(${recommendServerList[category].length})`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className={homePage['servers-container']}>
        <div className={homePage['server-list-title']}>{t(categories[selectedCategoryId])}</div>
        {recommendServerList[categories[selectedCategoryId]]?.length > 0 && (
          <div className={homePage['server-list']}>
            {recommendServerList[categories[selectedCategoryId]].map((server, index) => (
              <RecommendServerCard key={index} user={user} recommendServer={server} />
            ))}
          </div>
        )}
      </section>
    </>
  );
});

RecommendServerList.displayName = 'RecommendServerList';

export default RecommendServerList;
