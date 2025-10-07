import React, { useMemo, useState } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Types
import type { RecommendServer, User } from '@/types';

// Components
import RecommendServerCard from '@/components/RecommendServerCard';

// Providers
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

type Category = {
  label: string;
  tags: string[];
  emoji?: string;
  subCategories?: Category[];
};

const CATEGORIES: Category[] = [
  {
    label: 'official-groups',
    tags: ['official'],
    emoji: '1f310',
  },
  {
    label: 'taiwan-groups',
    tags: ['taiwan'],
    emoji: '1f1f9-1f1fc',
    subCategories: [
      {
        label: 'official-groups',
        tags: ['taiwan', 'official'],
      },
    ],
  },
  {
    label: 'russia-groups',
    tags: ['russia'],
    emoji: '1f1f7-1f1fa',
    subCategories: [
      {
        label: 'official-groups',
        tags: ['russia', 'official'],
      },
    ],
  },
  {
    label: 'brazil-groups',
    tags: ['brazil'],
    emoji: '1f1e7-1f1f7',
    subCategories: [
      {
        label: 'official-groups',
        tags: ['brazil', 'official'],
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
              <>
                <div
                  key={category.label}
                  className={`${homePage['category-tab']} ${activeCategory.tags.join('-') === category.tags.join('-') ? homePage['selected'] : ''}`}
                  onClick={() => {
                    setActiveCategory(category);
                    setSelectedFilter(category.tags);
                  }}
                >
                  {category.emoji && (
                    <Image
                      src={`https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${category.emoji}.png`}
                      alt={category.label}
                      className={homePage['category-flag']}
                      height={16}
                      width={16}
                    />
                  )}
                  <div className={homePage['category-name']}>{`${t(category.label)}`}</div>
                  <div className={homePage['category-count']}>{`(${recommendServers.filter((server) => category.tags.every((tag) => server.tags.includes(tag))).length})`}</div>
                </div>
                {category.subCategories && (
                  <div className={homePage['category-list']}>
                    {category.subCategories.map((subCategory) => (
                      <div
                        key={subCategory.label}
                        className={`${homePage['category-tab']} ${activeCategory.tags.join('-') === subCategory.tags.join('-') ? homePage['selected'] : ''}`}
                        onClick={() => {
                          setActiveCategory(subCategory);
                          setSelectedFilter(subCategory.tags);
                        }}
                      >
                        <div className={homePage['category-name']}>{`${t(subCategory.label)}`}</div>
                        <div className={homePage['category-count']}>{`(${recommendServers.filter((server) => subCategory.tags.every((tag) => server.tags.includes(tag))).length})`}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ))}
            {/* <div
              onClick={() => {
                setSelectedFilter(['official']);
                setActiveTab('official-groups');
              }}
              className={`${homePage['category-tab']} ${activeTab === 'official-groups' ? homePage['selected'] : ''}`}
            >
              <Image src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f310.png" alt="official" className={homePage['category-flag']} height={16} width={16} />
              <div className={homePage['category-name']}>{`${t('official-groups')}`}</div>
              <div className={homePage['category-count']}>{`(${filteredRecommendServers.filter((server) => server.tags.includes('official')).length})`}</div>
            </div>
            <div
              onClick={() => {
                setSelectedFilter(['taiwan']);
                setActiveTab('taiwan-groups');
              }}
              className={`${homePage['category-tab']} ${activeTab === 'taiwan-groups' ? homePage['selected'] : ''}`}
            >
              <Image src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1f9-1f1fc.png" alt="taiwan" className={homePage['category-flag']} height={16} width={16} />
              <div className={homePage['category-name']}>{`${t('taiwan-groups')}`}</div>
              <div className={homePage['category-count']}>{`(${filteredRecommendServers.filter((server) => server.tags.includes('taiwan')).length})`}</div>
            </div>
            <div className={homePage['category-list']}>
              <div
                onClick={() => {
                  setSelectedFilter(['taiwan']);
                  setActiveTab('taiwan-groups');
                }}
                className={`${homePage['category-tab']} ${activeTab === 'taiwan-official-groups' ? homePage['selected'] : ''}`}
              >
                <div className={homePage['category-name']}>{`${t('taiwan-official-groups')}`}</div>
                <div className={homePage['category-count']}>{`(${filteredRecommendServers.filter((server) => server.tags.includes('taiwan')).length})`}</div>
              </div>
            </div>
            <div
              onClick={() => {
                setSelectedFilter(['russia']);
                setActiveTab('russia-groups');
              }}
              className={`${homePage['category-tab']} ${activeTab === 'russia-groups' ? homePage['selected'] : ''}`}
            >
              <Image src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1f7-1f1fa.png" alt="russia" className={homePage['category-flag']} height={16} width={16} />
              <div className={homePage['category-name']}>{`${t('russia-groups')}`}</div>
              <div className={homePage['category-count']}>{`(${filteredRecommendServers.filter((server) => server.tags.includes('russia')).length})`}</div>
            </div>
            <div
              onClick={() => {
                setSelectedFilter(['other']);
                setActiveTab('other-groups');
              }}
              className={`${homePage['category-tab']} ${activeTab === 'other-groups' ? homePage['selected'] : ''}`}
            >
              <Image src="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f1e7-1f1f7.png" alt="brazil" className={homePage['category-flag']} height={16} width={16} />
              <div className={homePage['category-name']}>{`${t('brazil-groups')}`}</div>
              <div className={homePage['category-count']}>{`(${filteredRecommendServers.filter((server) => server.tags.includes('brazil')).length})`}</div>
            </div> */}
          </div>
        </div>
      </aside>

      <section className={homePage['servers-container']}>
        <div className={homePage['server-list-title']}>{t(activeCategory.label)}</div>
        {filteredRecommendServers.length > 0 && (
          <div className={homePage['server-list']}>
            {filteredRecommendServers.map((server, index) => (
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
