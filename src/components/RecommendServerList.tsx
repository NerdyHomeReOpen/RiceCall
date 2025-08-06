import React, { useMemo, useState } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Types
import type { RecommendServerList as RecommendServerListType, User } from '@/types';

// Components
// import ServerCard from '@/components/ServerCard';

interface RecommendServerListProps {
  user: User;
  servers: RecommendServerListType;
}

const RecommendServerList: React.FC<RecommendServerListProps> = ({ servers }) => {
  // States
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  // Variables
  const categories = useMemo(() => Object.keys(servers), [servers]);

  return (
    <div className={homePage['recommended-servers-wrapper']}>
      <aside className={homePage['category-sidebar']}>
        <ul className={homePage['category-list']}>
          {categories.map((category, index) => (
            <li key={category}>
              <button onClick={() => setActiveCategoryIndex(index)} className={`${homePage['category-item']} ${activeCategoryIndex === index ? homePage['category-item-active'] : ''}`}>
                {category}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className={homePage['servers-container']}>
        <h2 className={homePage['category-title']}>{categories[activeCategoryIndex]}</h2>
        {servers[categories[activeCategoryIndex]]?.length > 0 && (
          <div className={homePage['servers']}>
            {servers[categories[activeCategoryIndex]].map((server) => (
              <div key={server.serverId} className={homePage['server-cards-recommended']}>
                {/* <ServerCard user={user} server={server} /> */}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

RecommendServerList.displayName = 'RecommendServerList';

export default RecommendServerList;
