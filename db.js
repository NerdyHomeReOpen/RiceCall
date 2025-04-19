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
  const keys = Object.keys(convertedData).filter((k) =>
    allowedFields.includes(k),
  );
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
  return { keys, values };
}

// Helper functions to match quick.db API
const Database = {
  set: {
    account: async (account, data) => {
      try {
        if (!account || !data) return false;
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
        return true;
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
        if (!userId || !data) return false;
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
        return true;
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
        if (!badgeId || !data) return false;
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
        return true;
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
        if (!userId || !badgeId || !data) return false;
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
        return true;
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
        if (!userId || !serverId || !data) return false;
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
        return true;
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
        if (!serverId || !data) return false;
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
        return true;
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
        if (!channelId || !data) return false;
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
        return true;
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
        if (!friendGroupId || !data) return false;
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
        return true;
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
        if (!userId || !targetId || !data) return false;
        const ALLOWED_FIELDS = ['is_blocked', 'friend_group_id', 'created_at'];
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
        return true;
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
        if (!senderId || !receiverId || !data) return false;
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
        return true;
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
        if (!userId || !serverId || !data) return false;
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
        return true;
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
        if (!userId || !serverId || !data) return false;
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
        return true;
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
  },

  get: {
    all: async (querys) => {
      try {
        if (!querys) return null;
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
        if (!account) return null;
        const res = await query(
          `SELECT 
          accounts.*
          FROM accounts
          WHERE accounts.account = ?`,
          [account],
        );
        const data = res[0];
        if (!data) return null;
        return convertToCamelCase(data);
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

    searchUser: async (querys) => {
      try {
        if (!querys) return null;
        const res = await query(
          `SELECT 
          accounts.user_id 
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
        if (!userId) return null;
        const datas = await query(
          `SELECT 
          users.*
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
        if (!userId) return null;
        const datas = await query(
          `SELECT 
          friend_groups.created_at AS friend_group_created_at,
          friend_groups.*,
          users.created_at AS user_created_at,
          users.*
          FROM friend_groups
          INNER JOIN users
          ON friend_groups.user_id = users.user_id
          WHERE friend_groups.user_id = ?
          ORDER BY friend_groups.\`order\`, friend_groups.created_at DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => {
          data.created_at = data.friend_group_created_at;
          delete data.friend_group_created_at;
          delete data.user_created_at;
          return convertToCamelCase(data);
        });
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
        if (!userId) return null;
        const datas = await query(
          `SELECT 
          user_badges.*,
          badges.*
          FROM user_badges
          INNER JOIN badges
          ON user_badges.badge_id = badges.badge_id
          WHERE user_badges.user_id = ?
          ORDER BY badges.\`order\`, badges.created_at DESC`,
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
        if (!userId) return null;
        const datas = await query(
          `SELECT 
          user_servers.*,
          servers.created_at AS server_created_at,
          servers.*
          members.created_at AS member_created_at,
          members.*
          FROM user_servers
          INNER JOIN servers
          ON user_servers.server_id = servers.server_id
          INNER JOIN members
          ON user_servers.server_id = members.server_id
          AND user_servers.user_id = members.user_id
          WHERE user_servers.user_id = ?
          ORDER BY user_servers.timestamp DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => {
          data.created_at = data.member_created_at;
          delete data.server_created_at;
          delete data.member_created_at;
          return convertToCamelCase(data);
        });
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

    userFriends: async (userId) => {
      try {
        if (!userId) return null;
        const datas = await query(
          `SELECT 
          friends.user_id AS friend_user_id,
          friends.created_at AS friend_created_at, 
          friends.*, 
          users.user_id AS user_user_id,
          users.created_at AS user_created_at,
          users.*
          FROM friends 
          INNER JOIN users
          ON friends.target_id = users.user_id
          WHERE friends.user_id = ?
          ORDER BY friends.created_at DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => {
          data.created_at = data.friend_created_at;
          delete data.friend_created_at;
          delete data.user_created_at;
          data.user_id = data.friend_user_id;
          delete data.friend_user_id;
          data.target_id = data.user_user_id;
          delete data.user_user_id;
          return convertToCamelCase(data);
        });
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
        if (!userId) return null;
        const datas = await query(
          `SELECT 
          friend_applications.created_at AS friend_application_created_at,
          friend_applications.*,
          users.created_at AS user_created_at,
          users.*
          FROM friend_applications 
          INNER JOIN users 
          ON friend_applications.sender_id = users.user_id
          WHERE friend_applications.receiver_id = ?
          ORDER BY friend_applications.created_at DESC`,
          [userId],
        );
        if (!datas) return null;
        return datas.map((data) => {
          data.created_at = data.friend_application_created_at;
          delete data.friend_application_created_at;
          delete data.user_created_at;
          return convertToCamelCase(data);
        });
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
        if (!querys) return null;
        const datas = await query(
          `SELECT 
          servers.*
          FROM servers 
          WHERE servers.name LIKE ? OR servers.display_id = ?
          ORDER BY servers.created_at DESC`,
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
        if (!serverId) return null;
        const datas = await query(
          `SELECT 
          servers.*
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

    serverChannels: async (serverId) => {
      try {
        if (!serverId) return null;
        const datas = await query(
          `SELECT 
          channels.*
          FROM channels
          WHERE channels.server_id = ?
          ORDER BY channels.\`order\`, channels.created_at DESC`,
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
        if (!serverId) return null;
        const datas = await query(
          `SELECT 
          members.created_at AS member_created_at,
          members.*, 
          users.created_at AS user_created_at,
          users.*
          FROM members 
          INNER JOIN users 
          ON members.user_id = users.user_id  
          WHERE members.server_id = ?
          ORDER BY members.created_at DESC`,
          [serverId],
        );
        if (!datas) return null;
        return datas.map((data) => {
          data.created_at = data.member_created_at;
          delete data.member_created_at;
          delete data.user_created_at;
          return convertToCamelCase(data);
        });
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
        if (!serverId) return null;
        const datas = await query(
          `SELECT 
          member_applications.created_at AS member_application_created_at,
          member_applications.*,
          users.created_at AS user_created_at,
          users.*
          FROM member_applications 
          INNER JOIN users 
          ON member_applications.user_id = users.user_id
          WHERE member_applications.server_id = ?
          ORDER BY member_applications.created_at DESC`,
          [serverId],
        );
        if (!datas) return null;
        return datas.map((data) => {
          data.created_at = data.member_application_created_at;
          delete data.member_application_created_at;
          delete data.user_created_at;
          return convertToCamelCase(data);
        });
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
        if (!categoryId) return null;
        const datas = await query(
          `SELECT 
          categories.*
          FROM categories 
          WHERE categories.category_id = ?
          ORDER BY categories.\`order\`, categories.created_at DESC`,
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
        if (!channelId) return null;
        const datas = await query(
          `SELECT 
          channels.*
          FROM channels 
          WHERE channels.channel_id = ?
          ORDER BY channels.\`order\`, channels.created_at DESC`,
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

    channelChildren: async (channelId) => {
      try {
        if (!channelId) return null;
        const datas = await query(
          `SELECT 
          channels.*
          FROM channels 
          WHERE channels.category_id = ?
          ORDER BY channels.\`order\`, channels.created_at DESC`,
          [channelId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 channelChildren.${channelId} 時發生無法預期的錯誤: ${error.message}`,
            'AccessDatabaseError',
            'GET',
            'DATABASE_ERROR',
            500,
          );
        }
        throw error;
      }
    },

    channelUsers: async (channelId) => {
      try {
        if (!channelId) return null;
        const datas = await query(
          `SELECT 
          users.*
          FROM users
          WHERE users.current_channel_id = ?
          ORDER BY users.created_at DESC`,
          [channelId],
        );
        if (!datas) return null;
        return datas.map((data) => convertToCamelCase(data));
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 channelUsers.${channelId} 時發生無法預期的錯誤: ${error.message}`,
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
        if (!friendGroupId) return null;
        const datas = await query(
          `SELECT 
          friend_groups.*
          FROM friend_groups 
          WHERE friend_groups.friend_group_id = ?`,
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

    friendGroupFriends: async (friendGroupId) => {
      try {
        if (!friendGroupId) return null;
        const datas = await query(
          `SELECT
          friends.user_id AS friend_user_id,
          friends.created_at AS friend_created_at,
          friends.*,
          users.user_id AS user_user_id,
          users.created_at AS user_created_at,
          users.*
          FROM friends 
          INNER JOIN users 
          ON friends.target_id = users.user_id
          WHERE friends.friend_group_id = ?
          ORDER BY friends.created_at DESC`,
          [friendGroupId],
        );
        if (!datas) return null;
        return datas.map((data) => {
          data.created_at = data.friend_created_at;
          delete data.friend_created_at;
          delete data.user_created_at;
          data.user_id = data.friend_user_id;
          delete data.friend_user_id;
          data.target_id = data.user_user_id;
          delete data.user_user_id;
          return convertToCamelCase(data);
        });
      } catch (error) {
        if (!(error instanceof StandardizedError)) {
          error = new StandardizedError(
            `查詢 friendGroupFriends.${friendGroupId} 時發生無法預期的錯誤: ${error.message}`,
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
        if (!userId || !serverId) return null;
        const datas = await query(
          `SELECT 
          members.*
          FROM members 
          WHERE members.user_id = ?
          AND members.server_id = ?`,
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
        if (!userId || !serverId) return null;
        const datas = await query(
          `SELECT 
          member_applications.*
          FROM member_applications 
          WHERE member_applications.user_id = ?
          AND member_applications.server_id = ?`,
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
        if (!userId || !targetId) return null;
        const datas = await query(
          `SELECT 
          friends.*
          FROM friends 
          WHERE friends.user_id = ?
          AND friends.target_id = ?`,
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
        if (!senderId || !receiverId) return null;
        const datas = await query(
          `SELECT 
          friend_applications.*
          FROM friend_applications 
          WHERE friend_applications.sender_id = ?
          AND friend_applications.receiver_id = ?`,
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
  },

  delete: {
    user: async (userId) => {
      try {
        if (!userId) return false;
        await query(
          `DELETE FROM users 
          WHERE users.user_id = ?`,
          [userId],
        );
        return true;
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
        if (!badgeId) return false;
        await query(
          `DELETE FROM badges 
          WHERE badges.badge_id = ?`,
          [badgeId],
        );
        return true;
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
        if (!userId || !badgeId) return false;
        await query(
          `DELETE FROM user_badges 
          WHERE user_badges.user_id = ?
          AND user_badges.badge_id = ?`,
          [userId, badgeId],
        );
        return true;
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
        if (!userId || !serverId) return false;
        await query(
          `DELETE FROM user_servers 
          WHERE user_servers.user_id = ?
          AND user_servers.server_id = ?`,
          [userId, serverId],
        );
        return true;
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
        if (!serverId) return false;
        await query(
          `DELETE FROM servers 
          WHERE servers.server_id = ?`,
          [serverId],
        );
        return true;
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
        if (!channelId) return false;
        await query(
          `DELETE FROM channels 
          WHERE channels.channel_id = ?`,
          [channelId],
        );
        return true;
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
        if (!friendGroupId) return false;
        await query(
          `DELETE FROM friend_groups 
          WHERE friend_groups.friend_group_id = ?`,
          [friendGroupId],
        );
        return true;
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
        if (!userId || !serverId) return false;
        await query(
          `DELETE FROM members 
          WHERE members.user_id = ?
          AND members.server_id = ?`,
          [userId, serverId],
        );
        return true;
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
        if (!userId || !serverId) return false;
        await query(
          `DELETE FROM member_applications 
          WHERE member_applications.user_id = ?
          AND member_applications.server_id = ?`,
          [userId, serverId],
        );
        return true;
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
        if (!userId || !targetId) return false;
        await query(
          `DELETE FROM friends 
          WHERE friends.user_id = ?
          AND friends.target_id = ?`,
          [userId, targetId],
        );
        return true;
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
        if (!senderId || !receiverId) return false;
        await query(
          `DELETE FROM friend_applications 
          WHERE friend_applications.sender_id = ?
          AND friend_applications.receiver_id = ?`,
          [senderId, receiverId],
        );
        return true;
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
