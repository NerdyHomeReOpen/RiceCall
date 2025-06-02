import React from 'react';

// CSS
import homePage from '@/styles/pages/home.module.css';

// Types
import { UserServer, User } from '@/types';

// Components
import ServerCard from '@/components/ServerCard';

interface ServerListProps {
  user: User;
  servers: UserServer[];
  onServerClick?: (server: UserServer) => void;
}

const ServerList: React.FC<ServerListProps> = React.memo(
  ({ user, servers, onServerClick }) => {
    return (
      <div className={homePage['serverCards']}>
        {servers.map((server) => (
          <ServerCard
            key={server.serverId}
            user={user}
            server={server}
            onClick={() => onServerClick?.(server)}
          />
        ))}
      </div>
    );
  },
);

ServerList.displayName = 'ServerList';

export default ServerList;
