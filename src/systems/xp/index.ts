// Utils
import Logger from '@/utils/logger';

// Database
import { database } from '@/index';

// Config
import config from './config.json';

const timeFlag = new Map<string, number>(); // socket -> timeFlag
const elapsedTime = new Map<string, number>(); // userId -> elapsedTime

const xpSystem = {
  setup: async () => {
    try {
      setInterval(() => {
        xpSystem.refresh().catch((error) => {
          new Logger('XPSystem').error(
            `Error refreshing XP interval: ${error.message}`,
          );
        });
      }, config.INTERVAL_MS);

      // Run initial cleanup
      await xpSystem.refresh();

      new Logger('XPSystem').info(`XP system setup complete`);
    } catch (error: any) {
      new Logger('XPSystem').error(
        `Error setting up XP system: ${error.message}`,
      );
    }
  },

  create: async (userId: string) => {
    try {
      // Validate data
      if (!userId) {
        throw new Error('No userId was provided');
      }

      timeFlag.set(userId, Date.now());

      new Logger('XPSystem').info(
        `User(${userId}) XP system created with ${elapsedTime.get(
          userId,
        )}ms elapsed time`,
      );
    } catch (error: any) {
      new Logger('XPSystem').error(
        `Error creating XP system for user(${userId}): ${error.message}`,
      );
    }
  },

  delete: async (userId: string) => {
    try {
      // Validate data
      if (!userId) {
        throw new Error('No userId was provided');
      }

      const userTimeFlag = timeFlag.get(userId);

      if (userTimeFlag) {
        const now = Date.now();
        const userElapsedTime = elapsedTime.get(userId) || 0;

        let newElapsedTime = userElapsedTime + (now - userTimeFlag);
        const times = Math.floor(newElapsedTime / config.INTERVAL_MS);

        for (let i = 0; i < times; i++) {
          const success = await xpSystem.obtainXp(userId);
          if (success) newElapsedTime -= config.INTERVAL_MS;
          else break;
        }

        elapsedTime.set(userId, newElapsedTime);
      }

      timeFlag.delete(userId);

      new Logger('XPSystem').info(
        `User(${userId}) XP system deleted with ${elapsedTime.get(
          userId,
        )}ms elapsed time`,
      );
    } catch (error: any) {
      new Logger('XPSystem').error(
        `Error deleting XP system for user(${userId}): ${error.message}`,
      );
    }
  },

  refresh: async () => {
    for (const [userId, userTimeFlag] of timeFlag.entries()) {
      try {
        const now = Date.now();
        const userElapsedTime = elapsedTime.get(userId) || 0;

        let newElapsedTime = userElapsedTime + now - userTimeFlag;
        const times = Math.floor(newElapsedTime / config.INTERVAL_MS);

        for (let i = 0; i < times; i++) {
          const success = await xpSystem.obtainXp(userId);
          if (success) newElapsedTime -= config.INTERVAL_MS;
          else break;
        }

        elapsedTime.set(userId, newElapsedTime);
        timeFlag.set(userId, now); // Reset timeFlag

        new Logger('XPSystem').info(
          `XP interval refreshed for user(${userId})`,
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        new Logger('XPSystem').error(
          `Error refreshing XP interval for user(${userId}): ${error.message}`,
        );
      }
    }
    new Logger('XPSystem').info(
      `XP interval refreshed complete, ${timeFlag.size} users updated`,
    );
  },

  getRequiredXP: (level: number) => {
    return Math.ceil(
      config.BASE_REQUIRE_XP * Math.pow(config.GROWTH_RATE, level - 1),
    );
  },

  obtainXp: async (userId: string) => {
    try {
      const user = await database.get.user(userId);
      if (!user) {
        new Logger('XPSystem').warn(
          `User(${userId}) not found, cannot obtain XP`,
        );
        return false;
      }
      const server = await database.get.server(user.currentServerId);
      if (!server) {
        new Logger('XPSystem').warn(
          `Server(${user.currentServerId}) not found, cannot obtain XP`,
        );
        return false;
      }
      const member = await database.get.member(user.userId, server.serverId);
      if (!member) {
        new Logger('XPSystem').warn(
          `User(${user.userId}) not found in server(${server.serverId}), cannot update contribution`,
        );
        return false;
      }
      const vipBoost = user.vip ? 1 + user.vip * config.VIP_MULTIPLIER : 1;

      // Process XP
      user.xp += config.BASE_XP * vipBoost;

      // Process Level
      let requiredXp = 0;
      while (true) {
        requiredXp = xpSystem.getRequiredXP(user.level);
        if (user.xp < requiredXp) break;
        user.level += 1;
        user.xp -= requiredXp;
      }

      // Process Contribution
      member.contribution += config.BASE_CONTRIBUTION;

      // Process Wealth
      server.wealth += config.BASE_CONTRIBUTION;

      // Update user
      const updatedUser = {
        level: user.level,
        xp: user.xp,
        requiredXp: xpSystem.getRequiredXP(user.level),
      };
      await database.set.user(user.userId, updatedUser);

      // Update member contribution if in a server
      const updatedMember = {
        contribution: member.contribution,
      };
      await database.set.member(user.userId, server.serverId, updatedMember);

      // Update server wealth
      const updatedServer = {
        wealth: server.wealth,
      };
      await database.set.server(server.serverId, updatedServer);

      new Logger('XPSystem').info(
        `User(${userId}) obtained ${config.BASE_XP * vipBoost} XP and ${
          config.BASE_CONTRIBUTION
        } contribution`,
      );
      return true;
    } catch (error: any) {
      new Logger('XPSystem').error(
        `Error obtaining user(${userId}) XP: ${error.message}`,
      );
      return false;
    }
  },
};

export default xpSystem;
