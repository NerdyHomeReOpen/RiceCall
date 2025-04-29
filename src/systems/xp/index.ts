// Error
import StandardizedError from '@/error';

// Utils
import Logger from '@/utils/logger';

// Database
import Database from '@/database';

// Config
import config from './config.json';

const xpSystem = {
  timeFlag: new Map<string, number>(), // socket -> timeFlag
  elapsedTime: new Map<string, number>(), // userId -> elapsedTime

  setup: async () => {
    try {
      setInterval(() => {
        xpSystem.refreshAllUsers().catch((error) => {
          new Logger('XPSystem').error(
            `Error refreshing XP interval: ${error.message}`,
          );
        });
      }, config.INTERVAL_MS);

      // Run initial cleanup
      await xpSystem.refreshAllUsers();

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
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的資料',
          part: 'config',
          tag: 'DATA_INVALID',
          statusCode: 400,
        });
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
        throw new StandardizedError({
          name: 'ValidationError',
          message: '無效的資料',
          part: 'config',
          tag: 'DATA_INVALID',
          statusCode: 400,
        });
      }

      const timeFlag = xpSystem.timeFlag.get(userId);

      if (timeFlag) {
        const now = Date.now();
        const elapsedTime = xpSystem.elapsedTime.get(userId) || 0;
        let newElapsedTime = elapsedTime + (now - timeFlag);
        while (newElapsedTime >= config.INTERVAL_MS) {
          await xpSystem.obtainXp(userId);
          newElapsedTime -= config.INTERVAL_MS;
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

  refreshAllUsers: async () => {
    const refreshTasks = Array.from(xpSystem.timeFlag.entries()).map(
      async ([userId, timeFlag]) => {
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
        } catch (error: any) {
          new Logger('XPSystem').error(
            `Error refreshing XP interval for user(${userId}): ${error.message}`,
          );
        }
      },
    );
    await Promise.all(refreshTasks);
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
      const user = await Database.get.user(userId);
      if (!user) {
        new Logger('XPSystem').warn(
          `User(${userId}) not found, cannot obtain XP`,
        );
        return false;
      }
      const server = await Database.get.server(user.currentServerId);
      if (!server) {
        new Logger('XPSystem').warn(
          `Server(${user.currentServerId}) not found, cannot obtain XP`,
        );
        return false;
      }
      const member = await Database.get.member(user.userId, server.serverId);
      if (!member) {
        new Logger('XPSystem').warn(
          `User(${user.userId}) not found in server(${server.serverId}), cannot update contribution`,
        );
        return false;
      }
      const vipBoost = user.vip ? 1 + user.vip * config.VIP_MULTIPLIER : 1;

      // Process XP and level
      user.xp += config.BASE_XP * vipBoost;

      let requiredXp = 0;
      while (true) {
        requiredXp = xpSystem.getRequiredXP(user.level - 1);
        if (user.xp < requiredXp) break;
        user.level += 1;
        user.xp -= requiredXp;
      }

      // Update user
      const updatedUser = {
        level: user.level,
        xp: user.xp,
        requiredXp: requiredXp,
        progress: user.xp / requiredXp,
      };
      await Database.set.user(user.userId, updatedUser);

      // Update member contribution if in a server
      const updatedMember = {
        contribution:
          Math.round((member.contribution + config.BASE_XP * vipBoost) * 100) /
          100,
      };
      await Database.set.member(user.userId, server.serverId, updatedMember);

      // Update server wealth
      const updatedServer = {
        wealth:
          Math.round((server.wealth + config.BASE_XP * vipBoost) * 100) / 100,
      };
      await Database.set.server(server.serverId, updatedServer);

      new Logger('XPSystem').info(
        `User(${userId}) obtained ${config.BASE_XP * vipBoost} XP`,
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
