const { query } = require('./database');
// Utils
const StandardizedError = require('./utils/standardizedError');

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function snakeToCamel(str) {
  return str.replace(/(_\w)/g, (_, letter) => letter.toUpperCase());
}

function convertToSnakeCase(obj) {
  const snakeCaseObj = {};
  for (const [key, value] of Object.entries(obj)) {
    snakeCaseObj[camelToSnake(key)] = value;
  }
  return snakeCaseObj;
}

function convertToCamelCase(obj) {
  const camelCaseObj = {};
  for (const [key, value] of Object.entries(obj)) {
    camelCaseObj[snakeToCamel(key)] = value;
  }
  return camelCaseObj;
}

// Helper functions to match quick.db API
const Database = {
  set: {
    account: async (account, data) => {
      try {
        const ALLOWED_FIELDS = ['password', 'user_id'];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO accounts (account, ${key}) VALUES (?) ON DUPLICATE KEY UPDATE ${key} = ?`,
            [account, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 account.${account} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    user: async (userId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'id',
          'name',
          'avatar',
          'avatar_url',
          'signature',
          'country',
          'level',
          'vip',
          'xp',
          'required_xp',
          'progress',
          'birth_year',
          'birth_month',
          'birth_day',
          'status',
          'gender',
          'current_channel_id',
          'current_server_id',
          'last_active_at',
          'created_at',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO users (user_id, ${key}) 
            VALUES (?, ?)
            ON DUPLICATE KEY
            UPDATE ${key} = ?`,
            [userId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 user.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    badge: async (badgeId, data) => {
      try {
        const ALLOWED_FIELDS = ['name', 'description', 'image'];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO badges (badge_id, ${key}) 
            VALUES (?, ?)
            ON DUPLICATE KEY
            UPDATE ${key} = ?`,
            [badgeId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 badge.${badgeId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userBadge: async (userId, badgeId, data) => {
      try {
        const ALLOWED_FIELDS = ['user_id', 'badge_id', 'order', 'created_at'];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO user_badges (user_id, badge_id, ${key}) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [userId, badgeId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 userBadge.${userId}-${badgeId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userServer: async (userId, serverId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'recent',
          'owned',
          'favorite',
          'user_id',
          'server_id',
          'timestamp',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO user_servers (user_id, server_id, ${key}) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [userId, serverId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 userServer.${userId}-${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    server: async (serverId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'name',
          'avatar',
          'avatar_url',
          'announcement',
          'apply_notice',
          'description',
          'display_id',
          'slogan',
          'level',
          'wealth',
          'receive_apply',
          'allow_direct_message',
          'type',
          'visibility',
          'lobby_id',
          'owner_id',
          'created_at',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO servers (server_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [serverId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 server.${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    channel: async (channelId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'name',
          'order',
          'bitrate',
          'password',
          'user_limit',
          'guest_text_gap_time',
          'guest_text_wait_time',
          'guest_text_max_length',
          'is_root',
          'is_lobby',
          'slowmode',
          'forbid_text',
          'forbid_guest_text',
          'forbid_guest_url',
          'type',
          'visibility',
          'voice_mode',
          'category_id',
          'server_id',
          'created_at',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO channels (channel_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [channelId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 channel.${channelId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friendGroup: async (friendGroupId, data) => {
      try {
        const ALLOWED_FIELDS = ['name', 'order', 'user_id', 'created_at'];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO friend_groups (friend_group_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [friendGroupId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 friendGroup.${friendGroupId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friend: async (friendId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'isBlocked',
          'friend_group_id',
          'user_id',
          'target_id',
          'created_at',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO friends (friend_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [friendId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 friend.${friendId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friendApplication: async (friendApplicationId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'description',
          'application_status',
          'sender_id',
          'receiver_id',
          'created_at',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO friend_applications (friend_application_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [friendApplicationId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 friendApplication.${friendApplicationId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    member: async (memberId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'nickname',
          'contribution',
          'last_message_time',
          'last_join_channel_time',
          'is_blocked',
          'permission_level',
          'user_id',
          'server_id',
          'created_at',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO members (member_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [memberId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 member.${memberId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    memberApplication: async (memberApplicationId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'description',
          'application_status',
          'user_id',
          'server_id',
          'created_at',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO member_applications (member_application_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [memberApplicationId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 memberApplication.${memberApplicationId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    message: async (messageId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'content',
          'type',
          'sender_id',
          'server_id',
          'channel_id',
          'timestamp',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO messages (message_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [messageId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 message.${messageId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    directMessage: async (directMessageId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'content',
          'sender_id',
          'user_id_1',
          'user_id_2',
          'timestamp',
        ];
        const entries = Object.entries(convertToSnakeCase(data));
        for (const [key, value] of entries) {
          if (!ALLOWED_FIELDS.includes(key)) {
            throw new StandardizedError(
              `Invalid field: ${key}`,
              'AccessDatabaseError',
              'SET',
              'DATA_INVALID',
              400,
            );
          }
          await query(
            `INSERT INTO direct_messages (direct_message_id, ${key}) 
            VALUES (?, ?) 
            ON DUPLICATE KEY 
            UPDATE ${key} = ?`,
            [directMessageId, value, value],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 directMessage.${directMessageId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },
  },

  get: {
    all: async (querys) => {
      try {
        const res = await query(`SELECT * FROM ${querys}`);
        const data = res[0];
        if (!data) return null;
        return data;
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 ${querys} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    account: async (account) => {
      try {
        const res = await query(
          `SELECT *
          FROM accounts
          WHERE account = ?`,
          [account],
        );
        const data = res[0];
        if (!data) return null;
        return data;
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 ${account} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    avatar: async (avatarUrl) => {
      return `data:image/png;base64,${avatarUrl}`;
    },

    searchUser: async (querys) => {
      try {
        const res = await query(
          `SELECT user_id 
          FROM accounts
          WHERE account = ?`,
          [querys],
        );
        const data = res[0];
        if (!data) return null;
        return convertToCamelCase(data);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 ${querys} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    user: async (userId) => {
      try {
        const res = await query(
          `SELECT *
          FROM users
          WHERE user_id = ?`,
          [userId],
        );
        const data = res[0];
        if (!data) return null;
        return convertToCamelCase(data);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 users.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userFriendGroups: async (userId) => {
      try {
        const friendGroups = await query(
          `SELECT * 
          FROM friend_groups
          WHERE user_id = ?
          ORDER BY order DESC`,
          [userId],
        );
        if (!friendGroups) return null;
        return friendGroups;
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 userFriendGroups.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userBadges: async (userId) => {
      try {
        const userBadges = await query(
          `SELECT * 
          FROM user_badges
          LEFT JOIN badges
          ON user_badges.badge_id = badges.badge_id
          WHERE user_id = ?
          ORDER BY order DESC`,
          [userId],
        );
        if (!userBadges) return null;
        return convertToCamelCase(userBadges);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 userBadges.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userServers: async (userId) => {
      try {
        const userServers = await query(
          `SELECT *
          FROM user_servers
          LEFT JOIN servers
          ON user_servers.server_id = servers.server_id
          WHERE user_id = ?
          ORDER BY timestamp DESC`,
          [userId],
        );
        if (!userServers) return null;
        return convertToCamelCase(userServers);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 userServers.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userMembers: async (userId) => {
      try {
        const userMembers = await query(
          `SELECT * 
          FROM members 
          LEFT JOIN servers
          ON members.server_id = servers.server_id
          WHERE user_id = ?
          ORDER BY created_at DESC`,
          [userId],
        );
        if (!userMembers) return null;
        return convertToCamelCase(userMembers);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 userMembers.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userFriends: async (userId) => {
      try {
        const userFriends = await query(
          `SELECT * 
          FROM friends 
          LEFT JOIN users 
          ON friends.target_id = users.id
          WHERE user_id = ?
          ORDER BY created_at DESC`,
          [userId],
        );
        if (!userFriends) return null;
        return convertToCamelCase(userFriends);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 userFriends.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userFriendApplications: async (userId) => {
      try {
        const userFriendApplications = await query(
          `SELECT * 
          FROM friend_applications 
          LEFT JOIN users 
          ON friend_applications.sender_id = users.id
          WHERE receiver_id = ?
          AND application_status = 'pending'
          ORDER BY created_at DESC`,
          [userId],
        );
        if (!userFriendApplications) return null;
        return convertToCamelCase(userFriendApplications);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 userFriendApplications.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    searchServer: async (querys) => {
      try {
        const servers = await query(
          `SELECT * 
          FROM servers 
          WHERE name LIKE ? OR display_id = ?
          ORDER BY created_at DESC
          LIMIT 10`,
          [`%${querys}%`, `${querys}`],
        );
        if (!servers) return null;
        return servers;
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 searchServer.${querys} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    server: async (serverId) => {
      try {
        const server = await query(
          `SELECT * 
          FROM servers 
          WHERE server_id = ?`,
          [serverId],
        );
        if (!server) return null;
        return server;
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 server.${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    serverUsers: async (serverId) => {
      try {
        const serverUsers = await query(
          `SELECT * 
          FROM members 
          LEFT JOIN users 
          ON members.user_id = users.id
          WHERE server_id = ?
          ORDER BY created_at DESC`,
          [serverId],
        );
        if (!serverUsers) return null;
        return convertToCamelCase(serverUsers);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 serverUsers.${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    serverChannels: async (serverId) => {
      try {
        const serverChannels = await query(
          `SELECT * 
          FROM channels
          WHERE server_id = ?
          ORDER BY order DESC`,
          [serverId],
        );
        if (!serverChannels) return null;
        return convertToCamelCase(serverChannels);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 serverChannels.${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    serverMembers: async (serverId) => {
      try {
        const serverMembers = await query(
          `SELECT * 
          FROM members 
          LEFT JOIN users 
          ON members.user_id = users.id
          WHERE server_id = ?
          ORDER BY created_at DESC`,
          [serverId],
        );
        if (!serverMembers) return null;
        return convertToCamelCase(serverMembers);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 serverMembers.${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    serverMemberApplications: async (serverId) => {
      try {
        const serverMemberApplications = await query(
          `SELECT * 
          FROM member_applications 
          LEFT JOIN users 
          ON member_applications.user_id = users.id
          WHERE server_id = ?
          AND application_status = 'pending'
          ORDER BY created_at DESC`,
          [serverId],
        );
        if (!serverMemberApplications) return null;
        return convertToCamelCase(serverMemberApplications);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 serverMemberApplications.${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    category: async (categoryId) => {
      try {
        const category = await query(
          `SELECT * 
          FROM categories 
          WHERE category_id = ?
          ORDER BY order DESC`,
          [categoryId],
        );
        if (!category) return null;
        return category;
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 category.${categoryId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    channel: async (channelId) => {
      try {
        const channel = await query(
          `SELECT * 
          FROM channels 
          WHERE channel_id = ?
          ORDER BY order DESC`,
          [channelId],
        );
        if (!channel) return null;
        return convertToCamelCase(channel);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 channel.${channelId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    channelMessages: async (channelId) => {
      try {
        const channelMessages = await query(
          `SELECT * 
          FROM messages 
          WHERE channel_id = ?
          AND type = 'general'
          ORDER BY created_at DESC`,
          [channelId],
        );
        if (!channelMessages) return null;
        return convertToCamelCase(channelMessages);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 channelMessages.${channelId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    channelInfoMessages: async (channelId) => {
      try {
        const channelInfoMessages = await query(
          `SELECT * 
          FROM messages 
          WHERE channel_id = ?
          AND type = 'info'
          ORDER BY created_at DESC`,
          [channelId],
        );
        if (!channelInfoMessages) return null;
        return convertToCamelCase(channelInfoMessages);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 channelInfoMessages.${channelId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friendGroup: async (friendGroupId) => {
      try {
        const friendGroup = await query(
          `SELECT * 
          FROM friend_groups 
          WHERE friend_group_id = ?
          ORDER BY order DESC`,
          [friendGroupId],
        );
        if (!friendGroup) return null;
        return convertToCamelCase(friendGroup);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 friendGroup.${friendGroupId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    member: async (userId, serverId) => {
      try {
        const member = await query(
          `SELECT * 
          FROM members 
          WHERE user_id = ?
          AND server_id = ?
          ORDER BY created_at DESC`,
          [userId, serverId],
        );
        if (!member) return null;
        return convertToCamelCase(member);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 member.${userId}-${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    memberApplication: async (userId, serverId) => {
      try {
        const memberApplication = await query(
          `SELECT * 
          FROM member_applications 
          WHERE user_id = ?
          AND server_id = ?
          ORDER BY created_at DESC`,
          [userId, serverId],
        );
        if (!memberApplication) return null;
        return convertToCamelCase(memberApplication);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 memberApplication.${userId}-${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friend: async (userId, targetId) => {
      try {
        const friend = await query(
          `SELECT * 
          FROM friends 
          WHERE user_id = ?
          AND target_id = ?
          ORDER BY created_at DESC`,
          [userId, targetId],
        );
        if (!friend) return null;
        return convertToCamelCase(friend);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 friend.${userId}-${targetId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friendApplication: async (senderId, receiverId) => {
      try {
        const friendApplication = await query(
          `SELECT * 
          FROM friend_applications 
          WHERE sender_id = ?
          AND receiver_id = ?
          ORDER BY created_at DESC`,
          [senderId, receiverId],
        );
        if (!friendApplication) return null;
        return convertToCamelCase(friendApplication);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 friendApplication.${senderId}-${receiverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    message: async (messageId) => {
      try {
        const message = await query(
          `SELECT * 
          FROM messages 
          WHERE message_id = ?
          ORDER BY created_at DESC`,
          [messageId],
        );
        if (!message) return null;
        return convertToCamelCase(message);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 message.${messageId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    directMessages: async (userId, targetId) => {
      try {
        const userId1 = userId.localeCompare(targetId) < 0 ? userId : targetId;
        const userId2 = userId.localeCompare(targetId) < 0 ? targetId : userId;
        const directMessages = await query(
          `SELECT * 
          FROM direct_messages 
          LEFT JOIN users 
          ON direct_messages.sender_id = users.id
          WHERE user_id_1 = ?
          AND user_id_2 = ?
          ORDER BY created_at DESC`,
          [userId1, userId2],
        );
        if (!directMessages) return null;
        return convertToCamelCase(directMessages);
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 directMessages.${userId}-${targetId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },
  },

  delete: {
    user: async (userId) => {
      try {
        await query(
          `DELETE FROM users 
          WHERE user_id = ?`,
          [userId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 user.${userId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    badge: async (badgeId) => {
      try {
        await query(
          `DELETE FROM badges 
          WHERE badge_id = ?`,
          [badgeId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 badge.${badgeId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userBadge: async (userId, badgeId) => {
      try {
        await query(
          `DELETE FROM user_badges 
          WHERE user_id = ?
          AND badge_id = ?`,
          [userId, badgeId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 userBadge.${userId}-${badgeId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    userServer: async (userId, serverId) => {
      try {
        await query(
          `DELETE FROM user_servers 
          WHERE user_id = ?
          AND server_id = ?`,
          [userId, serverId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 userServer.${userId}-${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    server: async (serverId) => {
      try {
        await query(
          `DELETE FROM servers 
          WHERE server_id = ?`,
          [serverId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 server.${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    channel: async (channelId) => {
      try {
        await query(
          `DELETE FROM channels 
          WHERE channel_id = ?`,
          [channelId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 channel.${channelId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friendGroup: async (friendGroupId) => {
      try {
        await query(
          `DELETE FROM friend_groups 
          WHERE friend_group_id = ?`,
          [friendGroupId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 friendGroup.${friendGroupId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    member: async (userId, serverId) => {
      try {
        await query(
          `DELETE FROM members 
          WHERE user_id = ?
          AND server_id = ?`,
          [userId, serverId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 member.${userId}-${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    memberApplication: async (userId, serverId) => {
      try {
        await query(
          `DELETE FROM member_applications 
          WHERE user_id = ?
          AND server_id = ?`,
          [userId, serverId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 memberApplication.${userId}-${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friend: async (userId, targetId) => {
      try {
        await query(
          `DELETE FROM friends 
          WHERE user_id = ?
          AND target_id = ?`,
          [userId, targetId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 friend.${userId}-${targetId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friendApplication: async (senderId, receiverId) => {
      try {
        await query(
          `DELETE FROM friend_applications 
          WHERE sender_id = ?
          AND receiver_id = ?`,
          [senderId, receiverId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 friendApplication.${senderId}-${receiverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    message: async (messageId) => {
      try {
        await query(
          `DELETE FROM messages 
          WHERE message_id = ?`,
          [messageId],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 message.${messageId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    directMessage: async (userId, targetId) => {
      try {
        const userId1 = userId.localeCompare(targetId) < 0 ? userId : targetId;
        const userId2 = userId.localeCompare(targetId) < 0 ? targetId : userId;
        await query(
          `DELETE FROM direct_messages 
          WHERE user_id_1 = ?
          AND user_id_2 = ?`,
          [userId1, userId2],
        );
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `刪除 directMessage.${userId}-${targetId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'DELETE',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },
  },

  async initialize() {
    const tables = [
      'accounts',
      'users',
      'badges',
      'user_badges',
      'user_servers',
      'servers',
      'channels',
      'friend_groups',
      'members',
      'member_applications',
      'friends',
      'friend_applications',
      'messages',
      'direct_messages',
    ];

    for (const table of tables) {
      await query(`CREATE TABLE IF NOT EXISTS ${table} (
        ${table.slice(0, -1)} VARCHAR(255) PRIMARY KEY,
      )`);
    }
  },

  async deleteAll() {
    const tables = [
      'accounts',
      'users',
      'badges',
      'user_badges',
      'user_servers',
      'servers',
      'channels',
      'friend_groups',
      'members',
      'member_applications',
      'friends',
      'friend_applications',
      'messages',
      'direct_messages',
    ];

    for (const table of tables) {
      await query(`TRUNCATE TABLE ${table}`);
    }
  },
};

module.exports = { ...Database };
