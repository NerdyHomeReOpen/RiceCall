import React, { useState } from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Types
import { RecommendedServers, User } from '@/types';

// Components
// import ServerCard from '@/components/ServerCard';

interface RecommendedServersListProps {
  servers: RecommendedServers;
  user: User;
}

const RecommendedServersList: React.FC<RecommendedServersListProps> = ({ servers }) => {
  // Variables
  const categories = Object.keys(servers);

  // States
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? '');

  return (
    <div className={homePage['recommended-servers-wrapper']}>
      <aside className={homePage['category-sidebar']}>
        <ul className={homePage['category-list']}>
          {categories.map((category) => (
            <li key={category}>
              <button onClick={() => setActiveCategory(category)} className={`${homePage['category-item']} ${activeCategory === category ? homePage['category-item-active'] : ''}`}>
                {category}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className={homePage['servers-container']}>
        <h2 className={homePage['category-title']}>{activeCategory}</h2>
        {servers[activeCategory]?.length > 0 && (
          <div className={homePage['servers']}>
            {servers[activeCategory].map((server) => (
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

RecommendedServersList.displayName = 'RecommendedServersList';

export default RecommendedServersList;
