/* eslint-disable @typescript-eslint/no-require-imports */
// Constants
const { XP_SYSTEM } = require('../constant');

// Utils
const Logger = require('./logger');

// Database
const DB = require('../db');

// StandardizedError
const StandardizedError = require('../standardizedError');

const xpSystem = {
  timeFlag: new Map(), // socket -> timeFlag
  elapsedTime: new Map(), // userId -> elapsedTime

  create: async (userId) => {
    try {
      // Validate data
      if (!userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'XP_SYSTEM',
          'DATA_INVALID',
          400,
        );
      }

      xpSystem.timeFlag.set(userId, Date.now());

      new Logger('XPSystem').info(
        `User(${userId}) XP system created with ${xpSystem.elapsedTime.get(
          userId,
        )}ms elapsed time`,
      );
    } catch (error) {
      new Logger('XPSystem').error(
        `Error creating XP system for user(${userId}): ${error.message}`,
      );
    }
  },

  delete: async (userId) => {
    try {
      // Validate data
      if (!userId) {
        throw new StandardizedError(
          '無效的資料',
          'ValidationError',
          'XP_SYSTEM',
          'DATA_INVALID',
          400,
        );
      }

      const timeFlag = xpSystem.timeFlag.get(userId);

      if (timeFlag) {
        const now = Date.now();
        const elapsedTime = xpSystem.elapsedTime.get(userId) || 0;
        let newElapsedTime = elapsedTime + (now - timeFlag);
        while (newElapsedTime >= XP_SYSTEM.INTERVAL_MS) {
          await xpSystem.obtainXp(userId);
          newElapsedTime -= XP_SYSTEM.INTERVAL_MS;
        }
        xpSystem.elapsedTime.set(userId, newElapsedTime);
      }

      xpSystem.timeFlag.delete(userId);

      new Logger('XPSystem').info(
        `User(${userId}) XP system deleted with ${xpSystem.elapsedTime.get(
          userId,
        )}ms elapsed time`,
      );
    } catch (error) {
      new Logger('XPSystem').error(
        `Error deleting XP system for user(${userId}): ${error.message}`,
      );
    }
  },

  setup: () => {
    try {
      // Set up XP interval
      setInterval(
        () =>
          xpSystem.refreshAllUsers().catch((error) => {
            new Logger('XPSystem').error(
              `Error refreshing XP interval: ${error.message}`,
            );
          }),
        600000,
      );

      new Logger('XPSystem').info(`XP system setup complete`);
    } catch (error) {
      new Logger('XPSystem').error(
        `Error setting up XP system: ${error.message}`,
      );
    }
  },

  refreshAllUsers: async () => {
    for (const [userId, timeFlag] of xpSystem.timeFlag.entries()) {
      try {
        const now = Date.now();
        const elapsedTime = xpSystem.elapsedTime.get(userId) || 0;
        let newElapsedTime = elapsedTime + now - timeFlag;
        while (newElapsedTime >= XP_SYSTEM.INTERVAL_MS) {
          if (await xpSystem.obtainXp(userId))
            newElapsedTime -= XP_SYSTEM.INTERVAL_MS;
        }
        xpSystem.elapsedTime.set(userId, newElapsedTime);
        xpSystem.timeFlag.set(userId, now); // Reset timeFlag
        new Logger('XPSystem').info(
          `XP interval refreshed for user(${userId})`,
        );
      } catch (error) {
        new Logger('XPSystem').error(
          `Error refreshing XP interval for user(${userId}): ${error.message}`,
        );
      }
    }
    new Logger('XPSystem').info(
      `XP interval refreshed complete, ${xpSystem.timeFlag.size} users updated`,
    );
  },

  getRequiredXP: (level) => {
    return Math.ceil(
      XP_SYSTEM.BASE_REQUIRE_XP * Math.pow(XP_SYSTEM.GROWTH_RATE, level),
    );
  },

  obtainXp: async (userId) => {
    try {
      const user = await DB.get.user(userId);
      if (!user) {
        new Logger('XPSystem').warn(
          `User(${userId}) not found, cannot obtain XP`,
        );
        return false;
      }
      const server = await DB.get.server(user.currentServerId);
      if (!server) {
        new Logger('XPSystem').warn(
          `Server(${user.currentServerId}) not found, cannot obtain XP`,
        );
        return false;
      }
      const member = await DB.get.member(user.userId, server.serverId);
      if (!member) {
        new Logger('XPSystem').warn(
          `User(${user.userId}) not found in server(${server.serverId}), cannot update contribution`,
        );
        return false;
      }
      const vipBoost = user.vip ? 1 + user.vip * 0.2 : 1;

      // Process XP and level
      user.xp += XP_SYSTEM.BASE_XP * vipBoost;

      let requiredXp = 0;
      while (true) {
        requiredXp = xpSystem.getRequiredXP(user.level - 1);
        if (user.xp < requiredXp) break;
        user.level += 1;
        user.xp -= requiredXp;
      }

      // Update user
      const userUpdate = {
        level: user.level,
        xp: user.xp,
        requiredXp: requiredXp,
        progress: user.xp / requiredXp,
      };
      await DB.set.user(user.userId, userUpdate);

      // Update member contribution if in a server
      const memberUpdate = {
        contribution:
          Math.round(
            (member.contribution + XP_SYSTEM.BASE_XP * vipBoost) * 100,
          ) / 100,
      };
      await DB.set.member(user.userId, server.serverId, memberUpdate);

      // Update server wealth
      const serverUpdate = {
        wealth:
          Math.round((server.wealth + XP_SYSTEM.BASE_XP * vipBoost) * 100) /
          100,
      };
      await DB.set.server(server.serverId, serverUpdate);
    } catch (error) {
      new Logger('XPSystem').error(
        `Error obtaining user(${userId}) XP: ${error.message}`,
      );
      return false;
    }
  },
};

module.exports = { ...xpSystem };
