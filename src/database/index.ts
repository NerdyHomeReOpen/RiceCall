import mysql from 'mysql2/promise';

// Config
import { dbConfig } from '@/config';

// Error
import StandardizedError from '@/error';
import Logger from '@/utils/logger';

function camelToSnake(str: string) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function snakeToCamel(str: string) {
  return str.replace(/_\w/g, (letter) => letter[1].toUpperCase());
}

function convertToSnakeCase(obj: any) {
  const snakeCaseObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    snakeCaseObj[camelToSnake(key)] = value;
  }
  return snakeCaseObj;
}

function convertToCamelCase(obj: any) {
  const camelCaseObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    camelCaseObj[snakeToCamel(key)] = value;
  }
  return camelCaseObj;
}

function validateData(data: any, allowedFields: string[]) {
  const convertedData = convertToSnakeCase(data);
  const { keys, values } = Object.entries(convertedData).reduce(
    (acc: { keys: string[]; values: any[] }, [key, value]) => {
      if (allowedFields.includes(key)) {
        acc.keys.push(key);
        acc.values.push(value);
      }
      return acc;
    },
    { keys: [], values: [] },
  );

  return { keys, values };
}

export default class Database {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool(dbConfig);
  }

  async query<T = mysql.RowDataPacket[]>(sql: string, params?: any[]) {
    const [results] = await this.pool.execute(sql, params);
    return results as T;
  }

  set = {
    account: async (account: string, data: any) => {
      try {
        if (!account || !data) return false;
        const ALLOWED_FIELDS = ['password', 'user_id'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM accounts 
          WHERE account = ?`,
          [account],
        );
        // If the account exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE accounts SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE account = ?`,
            [...values, account],
          );
        } else {
          await this.query(
            `INSERT INTO accounts (account, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [account, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(`Error setting account.${account}: ${error.message}`);
      }
    },

    user: async (userId: string, data: any) => {
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
        const exists = await this.query(
          `SELECT * 
          FROM users 
          WHERE user_id = ?`,
          [userId],
        );
        // If the user exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE users SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ?`,
            [...values, userId],
          );
        } else {
          await this.query(
            `INSERT INTO users (user_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [userId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(`Error setting user.${userId}: ${error.message}`);
      }
    },

    badge: async (badgeId: string, data: any) => {
      try {
        if (!badgeId || !data) return false;
        const ALLOWED_FIELDS = ['name', 'description', 'image'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM badges 
          WHERE badge_id = ?`,
          [badgeId],
        );
        // If the badge exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE badges SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE badge_id = ?`,
            [...values, badgeId],
          );
        } else {
          await this.query(
            `INSERT INTO badges (badge_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [badgeId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(`Error setting badge.${badgeId}: ${error.message}`);
      }
    },

    userBadge: async (userId: string, badgeId: string, data: any) => {
      try {
        if (!userId || !badgeId || !data) return false;
        const ALLOWED_FIELDS = ['user_id', 'badge_id', 'order', 'created_at'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM user_badges 
          WHERE user_id = ? 
          AND badge_id = ?`,
          [userId, badgeId],
        );
        // If the userBadge exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE user_badges SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND badge_id = ?`,
            [...values, userId, badgeId],
          );
        } else {
          await this.query(
            `INSERT INTO user_badges (user_id, badge_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, badgeId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(
          `Error setting userBadge.${userId}-${badgeId}: ${error.message}`,
        );
      }
    },

    userServer: async (userId: string, serverId: string, data: any) => {
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
        const exists = await this.query(
          `SELECT * 
          FROM user_servers 
          WHERE user_id = ? 
          AND server_id = ?`,
          [userId, serverId],
        );
        // If the userServer exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE user_servers SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND server_id = ?`,
            [...values, userId, serverId],
          );
        } else {
          await this.query(
            `INSERT INTO user_servers (user_id, server_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, serverId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(
          `Error setting userServer.${userId}-${serverId}: ${error.message}`,
        );
      }
    },

    server: async (serverId: string, data: any) => {
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
          'type',
          'visibility',
          'lobby_id',
          'reception_lobby_id',
          'owner_id',
          'created_at',
        ];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM servers 
          WHERE server_id = ?`,
          [serverId],
        );
        // If the server exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE servers SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE server_id = ?`,
            [...values, serverId],
          );
        } else {
          await this.query(
            `INSERT INTO servers (server_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [serverId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(`Error setting server.${serverId}: ${error.message}`);
      }
    },

    channel: async (channelId: string, data: any) => {
      try {
        if (!channelId || !data) return false;
        const ALLOWED_FIELDS = [
          'name',
          'announcement',
          'order',
          'bitrate',
          'password',
          'user_limit',
          'guest_text_gap_time',
          'guest_text_wait_time',
          'guest_text_max_length',
          'is_lobby',
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
        const exists = await this.query(
          `SELECT * 
          FROM channels 
          WHERE channel_id = ?`,
          [channelId],
        );
        // If the channel exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE channels SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE channel_id = ?`,
            [...values, channelId],
          );
        } else {
          await this.query(
            `INSERT INTO channels (channel_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')})
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [channelId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(`Error setting channel.${channelId}: ${error.message}`);
      }
    },

    friendGroup: async (friendGroupId: string, data: any) => {
      try {
        if (!friendGroupId || !data) return false;
        const ALLOWED_FIELDS = ['name', 'order', 'user_id', 'created_at'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM friend_groups 
          WHERE friend_group_id = ?`,
          [friendGroupId],
        );
        // If the friendGroup exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE friend_groups SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE friend_group_id = ?`,
            [...values, friendGroupId],
          );
        } else {
          await this.query(
            `INSERT INTO friend_groups (friend_group_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ${keys.map(() => '?').join(', ')})`,
            [friendGroupId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(
          `Error setting friendGroup.${friendGroupId}: ${error.message}`,
        );
      }
    },

    friend: async (userId: string, targetId: string, data: any) => {
      try {
        if (!userId || !targetId || !data) return false;
        const ALLOWED_FIELDS = ['is_blocked', 'friend_group_id', 'created_at'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM friends 
          WHERE user_id = ? 
          AND target_id = ?`,
          [userId, targetId],
        );
        // If the friend exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE friends SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND target_id = ?`,
            [...values, userId, targetId],
          );
        } else {
          await this.query(
            `INSERT INTO friends (user_id, target_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, targetId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(
          `Error setting friend.${userId}-${targetId}: ${error.message}`,
        );
      }
    },

    friendApplication: async (
      senderId: string,
      receiverId: string,
      data: any,
    ) => {
      try {
        if (!senderId || !receiverId || !data) return false;
        const ALLOWED_FIELDS = ['description', 'created_at'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM friend_applications 
          WHERE sender_id = ? 
          AND receiver_id = ?`,
          [senderId, receiverId],
        );
        // If the friendApplication exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE friend_applications SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE sender_id = ? AND receiver_id = ?`,
            [...values, senderId, receiverId],
          );
        } else {
          await this.query(
            `INSERT INTO friend_applications (sender_id, receiver_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [senderId, receiverId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(
          `Error setting friendApplication.${senderId}-${receiverId}: ${error.message}`,
        );
      }
    },

    member: async (userId: string, serverId: string, data: any) => {
      try {
        if (!userId || !serverId || !data) return false;
        const ALLOWED_FIELDS = [
          'nickname',
          'contribution',
          'is_blocked',
          'permission_level',
          'last_message_time',
          'last_join_channel_time',
          'created_at',
        ];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM members 
          WHERE user_id = ? 
          AND server_id = ?`,
          [userId, serverId],
        );
        // If the member exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE members SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND server_id = ?`,
            [...values, userId, serverId],
          );
        } else {
          await this.query(
            `INSERT INTO members (user_id, server_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, serverId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(
          `Error setting member.${userId}-${serverId}: ${error.message}`,
        );
      }
    },

    memberApplication: async (userId: string, serverId: string, data: any) => {
      try {
        if (!userId || !serverId || !data) return false;
        const ALLOWED_FIELDS = ['description', 'created_at'];
        const { keys, values } = validateData(data, ALLOWED_FIELDS);
        const exists = await this.query(
          `SELECT * 
          FROM member_applications 
          WHERE user_id = ? 
          AND server_id = ?`,
          [userId, serverId],
        );
        // If the memberApplication exists, update it
        // Else, create it
        if (exists.length > 0) {
          await this.query(
            `UPDATE member_applications SET ${keys
              .map((k) => `\`${k}\` = ?`)
              .join(', ')} WHERE user_id = ? AND server_id = ?`,
            [...values, userId, serverId],
          );
        } else {
          await this.query(
            `INSERT INTO member_applications (user_id, server_id, ${keys
              .map((k) => `\`${k}\``)
              .join(', ')}) 
            VALUES (?, ?, ${keys.map(() => '?').join(', ')})`,
            [userId, serverId, ...values],
          );
        }
        return true;
      } catch (error: any) {
        throw new Error(
          `Error setting memberApplication.${userId}-${serverId}: ${error.message}`,
        );
      }
    },
  };

  get = {
    all: async (querys: string) => {
      try {
        if (!querys) return null;
        const datas = await this.query(
          `SELECT * 
          FROM ${querys}`,
        );
        if (!datas || datas.length === 0) return null;
        return datas.map((data) => convertToCamelCase(data));
      } catch (error: any) {
        throw new Error(`Error getting ${querys}: ${error.message}`);
      }
    },

    account: async (account: string) => {
      try {
        if (!account) return null;
        const data = await this.query(
          `SELECT 
            accounts.*
          FROM accounts
          WHERE accounts.account = ?`,
          [account],
        );
        if (!data || data.length === 0) return null;
        return convertToCamelCase(data[0]);
      } catch (error: any) {
        throw new Error(`Error getting account.${account}: ${error.message}`);
      }
    },

    searchUser: async (querys: string) => {
      try {
        if (!querys) return null;
        const data = await this.query(
          `SELECT 
            accounts.user_id 
          FROM accounts
          WHERE accounts.account = ?`,
          [querys],
        );
        if (!data || data.length === 0) return null;
        return convertToCamelCase(data[0]);
      } catch (error: any) {
        throw new Error(`Error getting ${querys}: ${error.message}`);
      }
    },

    user: async (userId: string) => {
      try {
        if (!userId) return null;
        const datas = await this.query(
          `SELECT 
            u.*, 
            ub.badge_id,
            ub.order,
            ub.created_at AS badge_created_at,
            b.name AS badge_name,
            b.description AS badge_description
          FROM users AS u
          LEFT JOIN user_badges AS ub
            ON u.user_id = ub.user_id
          LEFT JOIN badges AS b
            ON ub.badge_id = b.badge_id
          WHERE u.user_id = ?`,
          [userId],
        );
        if (!datas || datas.length === 0) return null;
        const data = datas[0];
        return convertToCamelCase({ ...data, badges: [] });
      } catch (error: any) {
        throw new Error(`Error getting user.${userId}: ${error.message}`);
      }
    },

    userBadges: async (userId: string) => {
      try {
        if (!userId) return null;
        const datas = await this.query(
          `SELECT 
            user_badges.*,
            badges.*
          FROM user_badges
          INNER JOIN badges
            ON user_badges.badge_id = badges.badge_id
          WHERE user_badges.user_id = ?
          ORDER BY user_badges.\`order\`, user_badges.created_at DESC`,
          [userId],
        );
        if (!datas) return [];
        return datas.map((data) => convertToCamelCase(data));
      } catch (error: any) {
        throw new Error(`Error getting userBadges.${userId}: ${error.message}`);
      }
    },

    userFriendGroups: async (userId: string) => {
      try {
        if (!userId) return null;
        const datas = await this.query(
          `SELECT 
            friend_groups.*
          FROM friend_groups
          WHERE friend_groups.user_id = ?
          ORDER BY friend_groups.\`order\`, friend_groups.created_at DESC`,
          [userId],
        );
        if (!datas) return [];
        return datas.map((data) => convertToCamelCase(data));
      } catch (error: any) {
        throw new Error(
          `Error getting userFriendGroups.${userId}: ${error.message}`,
        );
      }
    },

    userServer: async (userId: string, serverId: string) => {
      try {
        if (!userId || !serverId) return null;
        const datas = await this.query(
          `SELECT 
            user_servers.*,
            servers.created_at AS server_created_at,
            servers.*,
            members.created_at AS member_created_at,
            members.*
            FROM user_servers
            INNER JOIN servers
              ON user_servers.server_id = servers.server_id
            INNER JOIN members
              ON user_servers.server_id = members.server_id
            AND user_servers.user_id = members.user_id
            WHERE user_servers.user_id = ?
            AND user_servers.server_id = ?
            ORDER BY user_servers.timestamp DESC`,
          [userId, serverId],
        );
        if (!datas || datas.length === 0) return null;
        const data = datas[0];
        data.created_at = data.member_created_at;
        delete data.server_created_at;
        delete data.member_created_at;
        return convertToCamelCase(data);
      } catch (error: any) {
        throw new Error(
          `Error getting userServer.${userId}-${serverId}: ${error.message}`,
        );
      }
    },

    userServers: async (userId: string) => {
      try {
        if (!userId) return null;
        const datas = await this.query(
          `SELECT 
            user_servers.*,
            servers.created_at AS server_created_at,
            servers.*,
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
        if (!datas) return [];
        return datas.map((data: any) => {
          data.created_at = data.member_created_at;
          delete data.server_created_at;
          delete data.member_created_at;
          return convertToCamelCase(data);
        });
      } catch (error: any) {
        throw new Error(
          `Error getting userServers.${userId}: ${error.message}`,
        );
      }
    },

    userFriend: async (userId: string, targetId: string) => {
      try {
        if (!userId || !targetId) return null;
        const datas = await this.query(
          `SELECT 
            f.user_id AS friend_user_id,
            f.created_at AS friend_created_at, 
            f.*, 
            u.user_id AS user_user_id,
            u.created_at AS user_created_at,
            u.*,
            ub.badge_id,
            ub.created_at AS badge_created_at,
            b.name AS badge_name,
            b.description AS badge_description
          FROM friends AS f
          INNER JOIN users AS u
            ON f.target_id = u.user_id
          LEFT JOIN user_badges AS ub
            ON u.user_id = ub.user_id
          LEFT JOIN badges AS b
            ON ub.badge_id = b.badge_id
          WHERE f.user_id = ?
          AND f.target_id = ?
          ORDER BY f.created_at DESC`,
          [userId, targetId],
        );
        if (!datas || datas.length === 0) return null;
        const data = datas[0];
        data.created_at = data.friend_created_at;
        delete data.friend_created_at;
        delete data.user_created_at;
        data.user_id = data.friend_user_id;
        delete data.friend_user_id;
        data.target_id = data.user_user_id;
        delete data.user_user_id;
        return convertToCamelCase({ ...data, badges: [] });
      } catch (error: any) {
        throw new Error(
          `Error getting userFriend.${userId}-${targetId}: ${error.message}`,
        );
      }
    },

    userFriends: async (userId: string) => {
      try {
        if (!userId) return null;
        const datas = await this.query(
          `SELECT 
            f.user_id AS friend_user_id,
            f.created_at AS friend_created_at, 
            f.*, 
            u.user_id AS user_user_id,
            u.created_at AS user_created_at,
            u.*,
            ub.badge_id,
            ub.created_at AS badge_created_at,
            b.name AS badge_name,
            b.description AS badge_description
          FROM friends AS f
          INNER JOIN users AS u
            ON f.target_id = u.user_id
          LEFT JOIN user_badges AS ub
            ON u.user_id = ub.user_id
          LEFT JOIN badges AS b
            ON ub.badge_id = b.badge_id
          WHERE f.user_id = ?
          ORDER BY f.created_at DESC`,
          [userId],
        );
        if (!datas) return [];
        return datas.map((data: any) => {
          data.created_at = data.friend_created_at;
          delete data.friend_created_at;
          delete data.user_created_at;
          data.user_id = data.friend_user_id;
          delete data.friend_user_id;
          data.target_id = data.user_user_id;
          delete data.user_user_id;
          return convertToCamelCase({ ...data, badges: [] });
        });
      } catch (error: any) {
        throw new Error(
          `Error getting userFriends.${userId}: ${error.message}`,
        );
      }
    },

    userFriendApplication: async (userId: string, senderId: string) => {
      try {
        if (!userId || !senderId) return null;
        const datas = await this.query(
          `SELECT 
            friend_applications.created_at AS friend_application_created_at,
            friend_applications.*,
            users.created_at AS user_created_at,
            users.*
          FROM friend_applications 
          INNER JOIN users 
            ON friend_applications.sender_id = users.user_id
          WHERE friend_applications.receiver_id = ?
          AND friend_applications.sender_id = ?
          ORDER BY friend_applications.created_at DESC`,
          [userId, senderId],
        );
        if (!datas || datas.length === 0) return null;
        const data = datas[0];
        data.created_at = data.friend_application_created_at;
        delete data.friend_application_created_at;
        delete data.user_created_at;
        return convertToCamelCase(data);
      } catch (error: any) {
        throw new Error(
          `Error getting userFriendApplication.${userId}-${senderId}: ${error.message}`,
        );
      }
    },

    userFriendApplications: async (userId: string) => {
      try {
        if (!userId) return null;
        const datas = await this.query(
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
        if (!datas) return [];
        return datas.map((data: any) => {
          data.created_at = data.friend_application_created_at;
          delete data.friend_application_created_at;
          delete data.user_created_at;
          return convertToCamelCase(data);
        });
      } catch (error: any) {
        throw new Error(
          `Error getting userFriendApplications.${userId}: ${error.message}`,
        );
      }
    },

    searchServer: async (querys: string) => {
      try {
        if (!querys) return null;
        const datas = await this.query(
          `SELECT 
            servers.*
          FROM servers 
          WHERE servers.name LIKE ? OR servers.display_id = ?
          ORDER BY servers.created_at DESC`,
          [`%${querys}%`, `${querys}`],
        );
        if (!datas) return [];
        return datas.map((data) => convertToCamelCase(data));
      } catch (error: any) {
        throw new Error(
          `Error getting searchServer.${querys}: ${error.message}`,
        );
      }
    },

    server: async (serverId: string) => {
      try {
        if (!serverId) return null;
        const datas = await this.query(
          `SELECT 
            servers.*
          FROM servers 
          WHERE servers.server_id = ?`,
          [serverId],
        );
        if (!datas || datas.length === 0) return null;
        return convertToCamelCase(datas[0]);
      } catch (error: any) {
        throw new Error(`Error getting server.${serverId}: ${error.message}`);
      }
    },

    serverChannels: async (serverId: string) => {
      try {
        if (!serverId) return null;
        const datas = await this.query(
          `SELECT 
            channels.*
          FROM channels
          WHERE channels.server_id = ?
          ORDER BY channels.\`order\`, channels.created_at DESC`,
          [serverId],
        );
        if (!datas) return [];
        return datas.map((data) => convertToCamelCase(data));
      } catch (error: any) {
        throw new Error(
          `Error getting serverChannels.${serverId}: ${error.message}`,
        );
      }
    },

    serverMember: async (serverId: string, userId: string) => {
      try {
        if (!serverId || !userId) return null;
        const datas = await this.query(
          `SELECT 
            m.created_at AS member_created_at,
            m.*, 
            u.created_at AS user_created_at,
            u.*,
            ub.badge_id,
            ub.created_at AS badge_created_at,
            b.name AS badge_name,
            b.description AS badge_description
          FROM members AS m
          INNER JOIN users AS u
            ON m.user_id = u.user_id
          LEFT JOIN user_badges AS ub
            ON u.user_id = ub.user_id
          LEFT JOIN badges AS b
            ON ub.badge_id = b.badge_id
          WHERE m.server_id = ?
          AND m.user_id = ?
          ORDER BY m.created_at DESC`,
          [serverId, userId],
        );
        if (!datas || datas.length === 0) return null;
        const data = datas[0];
        data.created_at = data.member_created_at;
        delete data.member_created_at;
        delete data.user_created_at;
        return convertToCamelCase({ ...data, badges: [] });
      } catch (error: any) {
        throw new Error(
          `Error getting serverMember.${serverId}-${userId}: ${error.message}`,
        );
      }
    },

    serverOnlineMembers: async (serverId: string) => {
      try {
        if (!serverId) return null;
        const datas = await this.query(
          `SELECT 
            m.created_at AS member_created_at,
            m.*, 
            u.created_at AS user_created_at,
            u.*,
            ub.badge_id,
            ub.created_at AS badge_created_at,
            b.name AS badge_name,
            b.description AS badge_description
          FROM members AS m
          INNER JOIN users AS u
            ON m.user_id = u.user_id
          LEFT JOIN user_badges AS ub
            ON u.user_id = ub.user_id
          LEFT JOIN badges AS b
            ON ub.badge_id = b.badge_id
          WHERE m.server_id = ?
          AND u.current_server_id = ?
          ORDER BY m.created_at DESC`,
          [serverId, serverId],
        );
        if (!datas) return [];
        return datas.map((data: any) => {
          data.created_at = data.member_created_at;
          delete data.member_created_at;
          delete data.user_created_at;
          return convertToCamelCase({ ...data, badges: [] });
        });
      } catch (error: any) {
        throw new Error(
          `Error getting serverOnlineMembers.${serverId}: ${error.message}`,
        );
      }
    },

    serverMembers: async (serverId: string) => {
      try {
        if (!serverId) return null;
        const datas = await this.query(
          `SELECT 
            m.created_at AS member_created_at,
            m.*, 
            u.created_at AS user_created_at,
            u.*,
            ub.badge_id,
            ub.created_at AS badge_created_at,
            b.name AS badge_name,
            b.description AS badge_description
          FROM members AS m
          INNER JOIN users AS u
            ON m.user_id = u.user_id
          LEFT JOIN user_badges AS ub
            ON u.user_id = ub.user_id
          LEFT JOIN badges AS b
            ON ub.badge_id = b.badge_id
          WHERE m.server_id = ?
          ORDER BY m.created_at DESC`,
          [serverId],
        );
        if (!datas) return [];
        return datas.map((data: any) => {
          data.created_at = data.member_created_at;
          delete data.member_created_at;
          delete data.user_created_at;
          return convertToCamelCase({ ...data, badges: [] });
        });
      } catch (error: any) {
        throw new Error(
          `Error getting serverMembers.${serverId}: ${error.message}`,
        );
      }
    },

    serverMemberApplication: async (serverId: string, userId: string) => {
      try {
        if (!serverId || !userId) return null;
        const datas = await this.query(
          `SELECT 
            member_applications.created_at AS member_application_created_at,
            member_applications.*,
            users.created_at AS user_created_at,
            users.*
          FROM member_applications 
          INNER JOIN users 
            ON member_applications.user_id = users.user_id
          WHERE member_applications.server_id = ?
          AND member_applications.user_id = ?
          ORDER BY member_applications.created_at DESC`,
          [serverId, userId],
        );
        if (!datas || datas.length === 0) return null;
        const data = datas[0];
        data.created_at = data.member_application_created_at;
        delete data.member_application_created_at;
        delete data.user_created_at;
        return convertToCamelCase(data);
      } catch (error: any) {
        throw new Error(
          `Error getting serverMemberApplication.${serverId}-${userId}: ${error.message}`,
        );
      }
    },

    serverMemberApplications: async (serverId: string) => {
      try {
        if (!serverId) return null;
        const datas = await this.query(
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
        if (!datas) return [];
        return datas.map((data: any) => {
          data.created_at = data.member_application_created_at;
          delete data.member_application_created_at;
          delete data.user_created_at;
          return convertToCamelCase(data);
        });
      } catch (error: any) {
        throw new Error(
          `Error getting serverMemberApplications.${serverId}: ${error.message}`,
        );
      }
    },

    category: async (categoryId: string) => {
      try {
        if (!categoryId) return null;
        const datas = await this.query(
          `SELECT 
            categories.*
          FROM categories 
          WHERE categories.category_id = ?
          ORDER BY categories.\`order\`, categories.created_at DESC`,
          [categoryId],
        );
        if (!datas || datas.length === 0) return null;
        return convertToCamelCase(datas[0]);
      } catch (error: any) {
        throw new Error(
          `Error getting category.${categoryId}: ${error.message}`,
        );
      }
    },

    channel: async (channelId: string) => {
      try {
        if (!channelId) return null;
        const datas = await this.query(
          `SELECT 
            channels.*
          FROM channels 
          WHERE channels.channel_id = ?
          ORDER BY channels.\`order\`, channels.created_at DESC`,
          [channelId],
        );
        if (!datas || datas.length === 0) return null;
        return convertToCamelCase(datas[0]);
      } catch (error: any) {
        throw new Error(`Error getting channel.${channelId}: ${error.message}`);
      }
    },

    channelChildren: async (channelId: string) => {
      try {
        if (!channelId) return null;
        const datas = await this.query(
          `SELECT 
            channels.*
          FROM channels 
          WHERE channels.category_id = ?
          ORDER BY channels.\`order\`, channels.created_at DESC`,
          [channelId],
        );
        if (!datas) return [];
        return datas.map((data) => convertToCamelCase(data));
      } catch (error: any) {
        throw new Error(
          `Error getting channelChildren.${channelId}: ${error.message}`,
        );
      }
    },

    channelUsers: async (channelId: string) => {
      try {
        if (!channelId) return null;
        const datas = await this.query(
          `SELECT 
            users.*
          FROM users
          WHERE users.current_channel_id = ?
          ORDER BY users.created_at DESC`,
          [channelId],
        );
        if (!datas) return [];
        return datas.map((data: any) =>
          convertToCamelCase({ ...data, badges: [] }),
        );
      } catch (error: any) {
        throw new Error(
          `Error getting channelUsers.${channelId}: ${error.message}`,
        );
      }
    },

    friendGroup: async (friendGroupId: string) => {
      try {
        if (!friendGroupId) return null;
        const datas = await this.query(
          `SELECT 
            friend_groups.*
          FROM friend_groups 
          WHERE friend_groups.friend_group_id = ?`,
          [friendGroupId],
        );
        if (!datas || datas.length === 0) return null;
        return convertToCamelCase(datas[0]);
      } catch (error: any) {
        throw new Error(
          `Error getting friendGroup.${friendGroupId}: ${error.message}`,
        );
      }
    },

    friendGroupFriends: async (friendGroupId: string) => {
      try {
        if (!friendGroupId) return null;
        const datas = await this.query(
          `SELECT 
            friends.*
          FROM friend_groups
          INNER JOIN friends
          ON friend_groups.friend_group_id = friends.friend_group_id
          WHERE friend_groups.friend_group_id = ?
          ORDER BY friends.created_at DESC`,
          [friendGroupId],
        );
        if (!datas) return [];
        return datas.map((data) => convertToCamelCase(data));
      } catch (error: any) {
        throw new Error(
          `Error getting friendGroupFriends.${friendGroupId}: ${error.message}`,
        );
      }
    },

    member: async (userId: string, serverId: string) => {
      try {
        if (!userId || !serverId) return null;
        const datas = await this.query(
          `SELECT 
            members.*
          FROM members 
          WHERE members.user_id = ?
          AND members.server_id = ?`,
          [userId, serverId],
        );
        if (!datas || datas.length === 0) return null;
        return convertToCamelCase(datas[0]);
      } catch (error: any) {
        throw new Error(
          `Error getting member.${userId}-${serverId}: ${error.message}`,
        );
      }
    },

    memberApplication: async (userId: string, serverId: string) => {
      try {
        if (!userId || !serverId) return null;
        const datas = await this.query(
          `SELECT 
            member_applications.*
          FROM member_applications 
          WHERE member_applications.user_id = ?
          AND member_applications.server_id = ?`,
          [userId, serverId],
        );
        if (!datas || datas.length === 0) return null;
        return convertToCamelCase(datas[0]);
      } catch (error: any) {
        throw new Error(
          `Error getting memberApplication.${userId}-${serverId}: ${error.message}`,
        );
      }
    },

    friend: async (userId: string, targetId: string) => {
      try {
        if (!userId || !targetId) return null;
        const datas = await this.query(
          `SELECT 
            friends.*
          FROM friends 
          WHERE friends.user_id = ?
          AND friends.target_id = ?`,
          [userId, targetId],
        );
        if (!datas || datas.length === 0) return null;
        return convertToCamelCase(datas[0]);
      } catch (error: any) {
        throw new Error(
          `Error getting friend.${userId}-${targetId}: ${error.message}`,
        );
      }
    },

    friendApplication: async (senderId: string, receiverId: string) => {
      try {
        if (!senderId || !receiverId) return null;
        const datas = await this.query(
          `SELECT 
            friend_applications.*
          FROM friend_applications 
          WHERE friend_applications.sender_id = ?
          AND friend_applications.receiver_id = ?`,
          [senderId, receiverId],
        );
        if (!datas || datas.length === 0) return null;
        return convertToCamelCase(datas[0]);
      } catch (error: any) {
        throw new Error(
          `Error getting friendApplication.${senderId}-${receiverId}: ${error.message}`,
        );
      }
    },
  };

  delete = {
    user: async (userId: string) => {
      try {
        if (!userId) return false;
        await this.query(
          `DELETE FROM users 
          WHERE users.user_id = ?`,
          [userId],
        );
        return true;
      } catch (error: any) {
        throw new Error(`Error deleting user.${userId}: ${error.message}`);
      }
    },

    badge: async (badgeId: string) => {
      try {
        if (!badgeId) return false;
        await this.query(
          `DELETE FROM badges 
          WHERE badges.badge_id = ?`,
          [badgeId],
        );
        return true;
      } catch (error: any) {
        throw new Error(`Error deleting badge.${badgeId}: ${error.message}`);
      }
    },

    userBadge: async (userId: string, badgeId: string) => {
      try {
        if (!userId || !badgeId) return false;
        await this.query(
          `DELETE FROM user_badges 
          WHERE user_badges.user_id = ?
          AND user_badges.badge_id = ?`,
          [userId, badgeId],
        );
        return true;
      } catch (error: any) {
        throw new Error(
          `Error deleting userBadge.${userId}-${badgeId}: ${error.message}`,
        );
      }
    },

    userServer: async (userId: string, serverId: string) => {
      try {
        if (!userId || !serverId) return false;
        await this.query(
          `DELETE FROM user_servers 
          WHERE user_servers.user_id = ?
          AND user_servers.server_id = ?`,
          [userId, serverId],
        );
        return true;
      } catch (error: any) {
        throw new Error(
          `Error deleting userServer.${userId}-${serverId}: ${error.message}`,
        );
      }
    },

    server: async (serverId: string) => {
      try {
        if (!serverId) return false;
        await this.query(
          `DELETE FROM servers 
          WHERE servers.server_id = ?`,
          [serverId],
        );
        return true;
      } catch (error: any) {
        throw new Error(`Error deleting server.${serverId}: ${error.message}`);
      }
    },

    channel: async (channelId: string) => {
      try {
        if (!channelId) return false;
        await this.query(
          `DELETE FROM channels 
          WHERE channels.channel_id = ?`,
          [channelId],
        );
        return true;
      } catch (error: any) {
        throw new Error(
          `Error deleting channel.${channelId}: ${error.message}`,
        );
      }
    },

    friendGroup: async (friendGroupId: string) => {
      try {
        if (!friendGroupId) return false;
        await this.query(
          `DELETE FROM friend_groups 
          WHERE friend_groups.friend_group_id = ?`,
          [friendGroupId],
        );
        return true;
      } catch (error: any) {
        throw new Error(
          `Error deleting friendGroup.${friendGroupId}: ${error.message}`,
        );
      }
    },

    member: async (userId: string, serverId: string) => {
      try {
        if (!userId || !serverId) return false;
        await this.query(
          `DELETE FROM members 
          WHERE members.user_id = ?
          AND members.server_id = ?`,
          [userId, serverId],
        );
        return true;
      } catch (error: any) {
        throw new Error(
          `Error deleting member.${userId}-${serverId}: ${error.message}`,
        );
      }
    },

    memberApplication: async (userId: string, serverId: string) => {
      try {
        if (!userId || !serverId) return false;
        await this.query(
          `DELETE FROM member_applications 
          WHERE member_applications.user_id = ?
          AND member_applications.server_id = ?`,
          [userId, serverId],
        );
        return true;
      } catch (error: any) {
        throw new Error(
          `Error deleting memberApplication.${userId}-${serverId}: ${error.message}`,
        );
      }
    },

    friend: async (userId: string, targetId: string) => {
      try {
        if (!userId || !targetId) return false;
        await this.query(
          `DELETE FROM friends 
          WHERE friends.user_id = ?
          AND friends.target_id = ?`,
          [userId, targetId],
        );
        return true;
      } catch (error: any) {
        throw new Error(
          `Error deleting friend.${userId}-${targetId}: ${error.message}`,
        );
      }
    },

    friendApplication: async (senderId: string, receiverId: string) => {
      try {
        if (!senderId || !receiverId) return false;
        await this.query(
          `DELETE FROM friend_applications 
          WHERE friend_applications.sender_id = ?
          AND friend_applications.receiver_id = ?`,
          [senderId, receiverId],
        );
        return true;
      } catch (error: any) {
        throw new Error(
          `Error deleting friendApplication.${senderId}-${receiverId}: ${error.message}`,
        );
      }
    },
  };
}
