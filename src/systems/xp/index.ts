// Utils
import Logger from '@/utils/logger';

// Database
import { database } from '@/index';

// Config
import config from './config.json';
import { resolve4 } from 'dns';

const xpSystem = {
  timeFlag: new Map<string, number>(), // socket -> timeFlag
  elapsedTime: new Map<string, number>(), // userId -> elapsedTime

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

      xpSystem.timeFlag.set(userId, Date.now());

      new Logger('XPSystem').info(
        `User(${userId}) XP system created with ${xpSystem.elapsedTime.get(
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

      const timeFlag = xpSystem.timeFlag.get(userId);

      if (timeFlag) {
        const now = Date.now();
        const elapsedTime = xpSystem.elapsedTime.get(userId) || 0;

        let newElapsedTime = elapsedTime + (now - timeFlag);
        const times = Math.floor(newElapsedTime / config.INTERVAL_MS);

        for (let i = 0; i < times; i++) {
          const success = await xpSystem.obtainXp(userId);
          if (success) newElapsedTime -= config.INTERVAL_MS;
          else break;
        }

        xpSystem.elapsedTime.set(userId, newElapsedTime);
      }

      xpSystem.timeFlag.delete(userId);

      new Logger('XPSystem').info(
        `User(${userId}) XP system deleted with ${xpSystem.elapsedTime.get(
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
    for (const [userId, timeFlag] of xpSystem.timeFlag.entries()) {
      try {
        const now = Date.now();
        const elapsedTime = xpSystem.elapsedTime.get(userId) || 0;

        let newElapsedTime = elapsedTime + now - timeFlag;
        while (newElapsedTime >= config.INTERVAL_MS) {
          const success = await xpSystem.obtainXp(userId);
          if (success) newElapsedTime -= config.INTERVAL_MS;
          else break;
        }

        xpSystem.elapsedTime.set(userId, newElapsedTime);
        xpSystem.timeFlag.set(userId, now); // Reset timeFlag

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
      `XP interval refreshed complete, ${xpSystem.timeFlag.size} users updated`,
    );
  },

  getRequiredXP: (level: number) => {
    return Math.ceil(
      config.BASE_REQUIRE_XP * Math.pow(config.GROWTH_RATE, level),
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
      while (user.xp < requiredXp) {
        requiredXp = xpSystem.getRequiredXP(user.level - 1);
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
