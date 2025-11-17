import React, { useMemo, useState } from 'react';

// CSS
import homePage from '@/styles/home.module.css';

// Types
import type { RecommendServer, User } from '@/types';

// Components
import RecommendServerCard from '@/components/RecommendServerCard';

// Providers
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

type Category = {
  id: string;
  label: string[];
  tags: string[];
  emoji?: string;
  subCategories?: Category[];
};

const CATEGORIES: Category[] = [
  {
    id: 'official-groups',
    label: ['official-groups'],
    tags: ['official'],
    emoji: '2705',
  },
  {
    id: 'taiwan-groups',
    label: ['taiwan-groups'],
    tags: ['taiwan'],
    emoji: '1f1f9-1f1fc',
    subCategories: [
      {
        id: 'taiwan-official-groups',
        label: ['taiwan-groups', 'official-groups'],
        tags: ['taiwan', 'official'],
      },
      {
        id: 'taiwan-entertainment-groups',
        label: ['taiwan-groups', 'entertainment-groups'],
        tags: ['taiwan', 'entertainment'],
      },
    ],
  },
  {
    id: 'russia-groups',
    label: ['russia-groups'],
    tags: ['russia'],
    emoji: '1f1f7-1f1fa',
    subCategories: [
      {
        id: 'russia-official-groups',
        label: ['russia-groups', 'official-groups'],
        tags: ['russia', 'official'],
      },
      {
        id: 'russia-entertainment-groups',
        label: ['russia-groups', 'entertainment-groups'],
        tags: ['russia', 'entertainment'],
      },
    ],
  },
  {
    id: 'brazil-groups',
    label: ['brazil-groups'],
    tags: ['brazil'],
    emoji: '1f1e7-1f1f7',
    subCategories: [
      {
        id: 'brazil-official-groups',
        label: ['brazil-groups', 'official-groups'],
        tags: ['brazil', 'official'],
      },
      {
        id: 'brazil-entertainment-groups',
        label: ['brazil-groups', 'entertainment-groups'],
        tags: ['brazil', 'entertainment'],
      },
    ],
  },
  {
    id: 'turkey-groups',
    label: ['turkey-groups'],
    tags: ['turkey'],
    emoji: '1f1f9-1f1f7',
    subCategories: [
      {
        id: 'turkey-official-groups',
        label: ['turkey-groups', 'official-groups'],
        tags: ['turkey', 'official'],
      },
      {
        id: 'turkey-entertainment-groups',
        label: ['turkey-groups', 'entertainment-groups'],
        tags: ['turkey', 'entertainment'],
      },
    ],
  },
  {
    id: 'iran-groups',
    label: ['iran-groups'],
    tags: ['iran'],
    emoji: '1f1ee-1f1f7',
    subCategories: [
      {
        id: 'iran-official-groups',
        label: ['iran-groups', 'official-groups'],
        tags: ['iran', 'official'],
      },
      {
        id: 'iran-entertainment-groups',
        label: ['iran-groups', 'entertainment-groups'],
        tags: ['iran', 'entertainment'],
      },
    ],
  },
];

interface RecommendServerListProps {
  user: User;
  recommendServers: RecommendServer[];
}

const RecommendServerList: React.FC<RecommendServerListProps> = React.memo(({ user, recommendServers }) => {
  // Hooks
  const { t } = useTranslation();

  // States
  const [activeCategory, setActiveCategory] = useState<Category>(CATEGORIES[0]);
  const [selectedFilter, setSelectedFilter] = useState<string[]>(['official']);

  // Memos
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
