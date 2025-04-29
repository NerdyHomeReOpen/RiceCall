// Database
import Database from '@/src/database';

const func = {
  generateUniqueDisplayId: async (baseId = 20000000) => {
    const servers = (await Database.get.all('servers')) || {};
    let displayId = baseId + Object.keys(servers).length;

    // Ensure displayId is unique
    while (
      Object.values(servers).some((server) => server.displayId === displayId)
    ) {
      displayId++;
    }
    return displayId;
  },
};

export default func;
