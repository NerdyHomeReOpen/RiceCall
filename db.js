const { query } = require('./database');

// StandardizedError
const StandardizedError = require('./standardizedError');

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function snakeToCamel(str) {
  return str.replace(/_\w/g, (letter) => letter[1].toUpperCase());
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

function validateData(data, allowedFields) {
  const convertedData = convertToSnakeCase(data);
  const keys = Object.keys(convertedData);
  const values = keys.map((k) => convertedData[k]);
  if (keys.length === 0 || values.length === 0) {
    throw new StandardizedError(
      'No fields to update',
      'AccessDatabaseError',
      'SET',
      'DATA_INVALID',
      401,
    );
  }
  if (keys.length !== values.length) {
    throw new StandardizedError(
      'Keys and values length mismatch',
      'AccessDatabaseError',
      'SET',
      'DATA_INVALID',
      401,
    );
  }
  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      throw new StandardizedError(
        `Invalid field: ${key}`,
        'AccessDatabaseError',
        'SET',
        'DATA_INVALID',
        401,
      );
    }
  }
  return { keys, values };
}

// Helper functions to match quick.db API
const Database = {
  set: {
    account: async (account, data) => {
      try {
        const ALLOWED_FIELDS = ['password', 'user_id'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM accounts 
          WHERE account = ?`,
          [account],
        );
        if (exists.length) {
          // If the account exists, update it
          await query(
            `UPDATE accounts SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE account = ?`,
            [...values, account],
          );
        } else {
          // If the account does not exist, create it
          await query(
            `INSERT INTO accounts (account, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [account, ...values],
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM users 
          WHERE user_id = ?`,
          [userId],
        );
        if (exists.length) {
          // If the user exists, update it
          await query(
            `UPDATE users SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ?`,
            [...values, userId],
          );
        } else {
          // If the user does not exist, create it
          await query(
            `INSERT INTO users (user_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [userId, ...values],
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM badges 
          WHERE badge_id = ?`,
          [badgeId],
        );
        if (exists.length) {
          // If the badge exists, update it
          await query(
            `UPDATE badges SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE badge_id = ?`,
            [...values, badgeId],
          );
        } else {
          // If the badge does not exist, create it
          await query(
            `INSERT INTO badges (badge_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [badgeId, ...values],
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM user_badges 
          WHERE user_id = ? 
          AND badge_id = ?`,
          [userId, badgeId],
        );
        if (exists.length) {
          // If the userBadge exists, update it
          await query(
            `UPDATE user_badges SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND badge_id = ?`,
            [...values, userId, badgeId],
          );
        } else {
          // If the userBadge does not exist, create it
          await query(
            `INSERT INTO user_badges (user_id, badge_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, badgeId, ...values],
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM user_servers 
          WHERE user_id = ? 
          AND server_id = ?`,
          [userId, serverId],
        );
        if (exists.length) {
          // If the userServer exists, update it
          await query(
            `UPDATE user_servers SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND server_id = ?`,
            [...values, userId, serverId],
          );
        } else {
          // If the userServer does not exist, create it
          await query(
            `INSERT INTO user_servers (user_id, server_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, serverId, ...values],
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM servers 
          WHERE server_id = ?`,
          [serverId],
        );
        if (exists.length) {
          // If the server exists, update it
          await query(
            `UPDATE servers SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE server_id = ?`,
            [...values, serverId],
          );
        } else {
          // If the server does not exist, create it
          await query(
            `INSERT INTO servers (server_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [serverId, ...values],
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM channels 
          WHERE channel_id = ?`,
          [channelId],
        );
        if (exists.length) {
          // If the channel exists, update it
          await query(
            `UPDATE channels SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE channel_id = ?`,
            [...values, channelId],
          );
        } else {
          // If the channel does not exist, create it
          await query(
            `INSERT INTO channels (channel_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')})
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [channelId, ...values],
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM friend_groups 
          WHERE friend_group_id = ?`,
          [friendGroupId],
        );
        if (exists.length) {
          // If the friendGroup exists, update it
          await query(
            `UPDATE friend_groups SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE friend_group_id = ?`,
            [...values, friendGroupId],
          );
        } else {
          // If the friendGroup does not exist, create it
          await query(
            `INSERT INTO friend_groups (friend_group_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [friendGroupId, ...values],
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

    friend: async (userId, targetId, data) => {
      try {
        const ALLOWED_FIELDS = ['isBlocked', 'friend_group_id', 'created_at'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM friends 
          WHERE user_id = ? 
          AND target_id = ?`,
          [userId, targetId],
        );
        if (exists.length) {
          // If the friend exists, update it
          await query(
            `UPDATE friends SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND target_id = ?`,
            [...values, userId, targetId],
          );
        } else {
          // If the friend does not exist, create it
          await query(
            `INSERT INTO friends (user_id, target_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, targetId, ...values],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 friend.${userId}-${targetId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    friendApplication: async (senderId, receiverId, data) => {
      try {
        const ALLOWED_FIELDS = ['description', 'created_at'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM friend_applications 
          WHERE sender_id = ? 
          AND receiver_id = ?`,
          [senderId, receiverId],
        );
        if (exists.length) {
          // If the friendApplication exists, update it
          await query(
            `UPDATE friend_applications SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE sender_id = ? AND receiver_id = ?`,
            [...values, senderId, receiverId],
          );
        } else {
          // If the friendApplication does not exist, create it
          await query(
            `INSERT INTO friend_applications (sender_id, receiver_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [senderId, receiverId, ...values],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 friendApplication.${senderId}-${receiverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    member: async (userId, serverId, data) => {
      try {
        const ALLOWED_FIELDS = [
          'nickname',
          'contribution',
          'last_message_time',
          'last_join_channel_time',
          'is_blocked',
          'permission_level',
          'created_at',
        ];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM members 
          WHERE user_id = ? 
          AND server_id = ?`,
          [userId, serverId],
        );
        if (exists.length) {
          // If the member exists, update it
          await query(
            `UPDATE members SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND server_id = ?`,
            [...values, userId, serverId],
          );
        } else {
          // If the member does not exist, create it
          await query(
            `INSERT INTO members (user_id, server_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, serverId, ...values],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 member.${userId}-${serverId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'SET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    memberApplication: async (userId, serverId, data) => {
      try {
        const ALLOWED_FIELDS = ['description', 'created_at'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM member_applications 
          WHERE user_id = ? 
          AND server_id = ?`,
          [userId, serverId],
        );
        if (exists.length) {
          // If the memberApplication exists, update it
          await query(
            `UPDATE member_applications SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND server_id = ?`,
            [...values, userId, serverId],
          );
        } else {
          // If the memberApplication does not exist, create it
          await query(
            `INSERT INTO member_applications (user_id, server_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, serverId, ...values],
          );
        }
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `設置 memberApplication.${userId}-${serverId} 時發生無法預期的錯誤: ${error.message}`,
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM messages 
          WHERE message_id = ?`,
          [messageId],
        );
        if (exists.length) {
          // If the message exists, update it
          await query(
            `UPDATE messages SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE message_id = ?`,
            [...values, messageId],
          );
        } else {
          // If the message does not exist, create it
          await query(
            `INSERT INTO messages (message_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [messageId, ...values],
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
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await query(
          `SELECT * 
          FROM direct_messages 
          WHERE direct_message_id = ?`,
          [directMessageId],
        );
        if (exists.length) {
          // If the directMessage exists, update it
          await query(
            `UPDATE direct_messages SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE direct_message_id = ?`,
            [...values, directMessageId],
          );
        } else {
          // If the directMessage does not exist, create it
          await query(
            `INSERT INTO direct_messages (direct_message_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [directMessageId, ...values],
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
        const datas = await query(
          `SELECT * 
          FROM ${querys}`,
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
          WHERE accounts.account = ?`,
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
          `SELECT accounts.user_id 
          FROM accounts
          WHERE accounts.account = ?`,
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
        const datas = await query(
          `SELECT *
          FROM users
          WHERE users.user_id = ?`,
          [userId],
        );
        const data = datas[0];
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
        const datas = await query(
          `SELECT * 
          FROM friend_groups
          WHERE friend_groups.user_id = ?
          ORDER BY friend_groups.\`order\` DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM user_badges
          LEFT JOIN badges
          ON user_badges.badge_id = badges.badge_id
          WHERE user_badges.user_id = ?
          ORDER BY badges.\`order\` DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT *
          FROM user_servers
          LEFT JOIN servers
          ON user_servers.server_id = servers.server_id
          WHERE user_servers.user_id = ?
          ORDER BY user_servers.timestamp DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM members 
          LEFT JOIN servers
          ON members.server_id = servers.server_id
          WHERE members.user_id = ?
          ORDER BY members.created_at DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM friends 
          LEFT JOIN users 
          ON friends.target_id = users.user_id
          WHERE friends.user_id = ?
          ORDER BY friends.created_at DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM friend_applications 
          LEFT JOIN users 
          ON friend_applications.sender_id = users.user_id
          WHERE friend_applications.receiver_id = ?
          ORDER BY friend_applications.created_at DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM servers 
          WHERE servers.name LIKE ? OR servers.display_id = ?
          ORDER BY servers.created_at DESC
          LIMIT 10`,
          [`%${querys}%`, `${querys}`],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM servers 
          WHERE servers.server_id = ?`,
          [serverId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
        const datas = await query(
          `SELECT * 
          FROM members 
          LEFT JOIN users 
          ON members.user_id = users.user_id
          WHERE users.current_server_id = ?
          ORDER BY members.created_at DESC`,
          [serverId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM channels
          WHERE channels.server_id = ?
          ORDER BY channels.\`order\` DESC`,
          [serverId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM members 
          LEFT JOIN users 
          ON members.user_id = users.user_id  
          WHERE members.server_id = ?
          ORDER BY members.created_at DESC`,
          [serverId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM member_applications 
          LEFT JOIN users 
          ON member_applications.user_id = users.user_id
          WHERE member_applications.server_id = ?
          ORDER BY member_applications.created_at DESC`,
          [serverId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM categories 
          WHERE categories.category_id = ?
          ORDER BY categories.\`order\` DESC`,
          [categoryId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
        const datas = await query(
          `SELECT * 
          FROM channels 
          WHERE channels.channel_id = ?
          ORDER BY channels.\`order\` DESC`,
          [channelId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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

    channelMembers: async (channelId) => {
      try {
        const datas = await query(
          `SELECT * 
          FROM members 
          LEFT JOIN users 
          ON members.user_id = users.user_id
          WHERE users.current_channel_id = ?
          ORDER BY members.created_at DESC`,
          [channelId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 channelMembers.${channelId} 時發生無法預期的錯誤: ${error.message}`,
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
        const datas = await query(
          `SELECT * 
          FROM messages 
          LEFT JOIN users 
          ON messages.sender_id = users.user_id
          LEFT JOIN members
          ON messages.sender_id = members.user_id 
          AND messages.server_id = members.server_id
          WHERE messages.channel_id = ?
          AND messages.type = 'general'
          ORDER BY messages.timestamp DESC`,
          [channelId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM messages 
          WHERE messages.channel_id = ?
          AND messages.type = 'info'
          ORDER BY messages.timestamp DESC`,
          [channelId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
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
        const datas = await query(
          `SELECT * 
          FROM friend_groups 
          WHERE friend_groups.friend_group_id = ?
          ORDER BY friend_groups.\`order\` DESC`,
          [friendGroupId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
        const datas = await query(
          `SELECT * 
          FROM members 
          WHERE members.user_id = ?
          AND members.server_id = ?
          ORDER BY members.created_at DESC`,
          [userId, serverId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
        const datas = await query(
          `SELECT * 
          FROM member_applications 
          WHERE member_applications.user_id = ?
          AND member_applications.server_id = ?
          ORDER BY member_applications.created_at DESC`,
          [userId, serverId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
        const datas = await query(
          `SELECT * 
          FROM friends 
          WHERE friends.user_id = ?
          AND friends.target_id = ?
          ORDER BY friends.created_at DESC`,
          [userId, targetId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
        const datas = await query(
          `SELECT * 
          FROM friend_applications 
          WHERE friend_applications.sender_id = ?
          AND friend_applications.receiver_id = ?
          ORDER BY friend_applications.created_at DESC`,
          [senderId, receiverId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
        const datas = await query(
          `SELECT * 
          FROM messages 
          WHERE messages.message_id = ?
          ORDER BY messages.timestamp DESC`,
          [messageId],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
        const datas = await query(
          `SELECT * 
          FROM direct_messages 
          LEFT JOIN users 
          ON direct_messages.sender_id = users.user_id
          WHERE direct_messages.user_id_1 = ?
          AND direct_messages.user_id_2 = ?
          ORDER BY direct_messages.timestamp DESC`,
          [userId1, userId2],
        );
        const data = datas[0];
        if (!data) return null;
        return convertToCamelCase(data);
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
          WHERE users.user_id = ?`,
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
          WHERE badges.badge_id = ?`,
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
          WHERE user_badges.user_id = ?
          AND user_badges.badge_id = ?`,
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
          WHERE user_servers.user_id = ?
          AND user_servers.server_id = ?`,
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
          WHERE servers.server_id = ?`,
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
          WHERE channels.channel_id = ?`,
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
          WHERE friend_groups.friend_group_id = ?`,
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
          WHERE members.user_id = ?
          AND members.server_id = ?`,
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
          WHERE member_applications.user_id = ?
          AND member_applications.server_id = ?`,
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
          WHERE friends.user_id = ?
          AND friends.target_id = ?`,
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
          WHERE friend_applications.sender_id = ?
          AND friend_applications.receiver_id = ?`,
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
          WHERE messages.message_id = ?`,
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
          WHERE direct_messages.user_id_1 = ?
          AND direct_messages.user_id_2 = ?`,
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
