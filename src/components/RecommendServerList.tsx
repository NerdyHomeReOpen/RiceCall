import Image from 'next/image';
import React, { useMemo, useState } from 'react';

// CSS
import homePage from '@/styles/home.module.css';

// Types
import type { RecommendServer, User } from '@/types';

// Components
import RecommendServerCard from '@/components/RecommendServerCard';

// Providers
import { useTranslation } from 'react-i18next';

// Constants
import { CATEGORIES } from '@/constant';

interface RecommendServerListProps {
  user: User;
  recommendServers: RecommendServer[];
}

const RecommendServerList: React.FC<RecommendServerListProps> = React.memo(({ user, recommendServers }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selectedFilter, setSelectedFilter] = useState<string[]>(['official']);

  // Variables
  const filteredRecommendServers = useMemo(() => recommendServers.filter((server) => selectedFilter.every((filter) => server.tags.includes(filter))), [recommendServers, selectedFilter]);

  return (
    <>
      <aside className={homePage['sidebar']}>
        <div className={homePage['scroll-view']}>
          <div className={homePage['category-list']}>
            {CATEGORIES.map((category) => (
              <React.Fragment key={category.id}>
                <div
                  key={category.id}
                  className={`${homePage['category-tab']} ${activeCategory.id === category.id ? homePage['selected'] : ''}`}
                  onClick={() => {
                    setActiveCategory(category);
                    setSelectedFilter(category.tags);
                  }}
                >
                  {category.emoji && (
                    <Image src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${category.emoji}.png`} alt={category.id} className={homePage['category-flag']} height={16} width={16} />
                  )}
                  <div className={homePage['category-name']}>{`${t(category.label[category.label.length - 1])}`}</div>
                </div>
                {category.subCategories && (
                  <div className={homePage['category-list']}>
                    {category.subCategories.map((subCategory, index) => (
                      <div
                        key={subCategory.id}
                        className={`${homePage['category-tab']} ${activeCategory.id === subCategory.id ? homePage['selected'] : ''}`}
                        onClick={() => {
                          setActiveCategory(subCategory);
                          setSelectedFilter(subCategory.tags);
                        }}
                      >
                        <span className={homePage['category-tab-icon']}>{index !== (category.subCategories?.length ?? 0) - 1 ? '├─' : '└─'}</span>
                        <div className={homePage['category-name']}>{t(subCategory.label[subCategory.label.length - 1])}</div>
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </aside>

      <section className={homePage['servers-container']}>
        <div>
          <div className={homePage['server-list-title']}>{activeCategory.label.map((label) => t(label)).join(' > ')}</div>
          {filteredRecommendServers.length > 0 && (
            <div className={homePage['server-list']}>
              {filteredRecommendServers.map((server) => (
                <RecommendServerCard key={server.serverId} user={user} recommendServer={server} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
});

RecommendServerList.displayName = 'RecommendServerList';

export default RecommendServerList;
