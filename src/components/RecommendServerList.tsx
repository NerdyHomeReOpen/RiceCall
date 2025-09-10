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
  servers: RecommendServerList;
}

const RecommendServerList: React.FC<RecommendServerListProps> = React.memo(({ user, servers }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [selectedCategoryId, setSelectedCategoryId] = useState(0);

  // Memos
  const categories = useMemo(() => Object.keys(servers), [servers]);

  return (
    <>
      <aside className={homePage['sidebar']}>
        <div className={homePage['scroll-view']}>
          <div className={homePage['category-list']}>
            {categories.map((category, index) => (
              <div key={category}>
                <div onClick={() => setSelectedCategoryId(index)} className={`${homePage['category-tab']} ${selectedCategoryId === index ? homePage['selected'] : ''}`}>
                  {`${t(category)} (${servers[category].length})`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className={homePage['servers-container']}>
        <div className={homePage['server-list-title']}>{t(categories[selectedCategoryId])}</div>
        {servers[categories[selectedCategoryId]]?.length > 0 && (
          <div className={homePage['server-list']}>
            {Array.from({ length: 12 }).map((_, index) => (
              <RecommendServerCard key={index} user={user} recommendServer={servers[categories[selectedCategoryId]][0]} />
            ))}
          </div>
        )}
      </section>
    </>
  );
});

RecommendServerList.displayName = 'RecommendServerList';

export default RecommendServerList;
