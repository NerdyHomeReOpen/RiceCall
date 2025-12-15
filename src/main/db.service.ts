import { initDatabase } from '../../db/index.js';

export type table_channel_message = {
  messageId: string,
  userId: string,
  serverId: string,
  channelId: string,
  contentType: string,
  content: string,
  created_at: number,
}

export type table_direct_message = {
  messageId: string,
  userId: string,
  senderId: string,
  contentType: string,
  content: string,
  created_at: number,
}

const db = initDatabase();

class dbService {
  static get = {
    channelMessage: async (serverId: string, channelId: string, length: number = 100, start_at: number = 0) => {
      try {
        const stmt = db.prepare(`
          SELECT * FROM channel_messages
          WHERE serverId=? AND channelId=?
          ORDER BY created_at ASC
          LIMIT (?, ?)
        `);
        return stmt.all(serverId, channelId, start_at, length);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Error get channelMessage(${serverId}-${channelId}): ${error.message}`);
        }
        throw new Error(`Error set channelMessage(${serverId}-${channelId}): ${String(error)}`);
      }
    },

    directMessage: async (userId: string, length: number = 100, start_at: number = 0) => {
      try {
          const stmt = db.prepare(`
          SELECT * FROM direct_messages
          WHERE serverId=?
          ORDER BY created_at ASC
          LIMIT (?, ?)
        `);
        return stmt.all(userId, start_at, length);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Error get directMessage(${userId}): ${error.message}`);
        }
        throw new Error(`Error set directMessage(${userId}): ${String(error)}`);
      }
    },
  };

  static set = {
    channelMessage: async (message: table_channel_message) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO channel_messages (messageId, userId, serverId, channelId, contentType, content, created_at)
          VALUES (@messageId, @userId, @serverId, @channelId, @contentType, @content, @created_at)
          ON CONFLICT(messageId) DO UPDATE SET
            content = excluded.content,
            contentType = excluded.contentType,
            created_at = excluded.created_at
        `);
        stmt.run(message);
        return true;
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Error set.channelMessage.${message.messageId}: ${error.message}`);
        }
        throw new Error(`Error set.channelMessage.${message.messageId}: ${String(error)}`);
      }
    },

    directMessage: async (message: table_direct_message) => {
      try {
        const stmt = db.prepare(`
          INSERT INTO direct_messages (messageId, userId, senderId, contentType, content, created_at)
          VALUES (@messageId, @userId, @senderId, @contentType, @content, @created_at)
          ON CONFLICT(messageId) DO UPDATE SET
            content = excluded.content,
            contentType = excluded.contentType,
            created_at = excluded.created_at
        `);
        stmt.run(message);
        return true;
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Error set.directMessage.${message.messageId}: ${error.message}`);
        }
        throw new Error(`Error set.directMessage.${message.messageId}: ${String(error)}`);
      }
    },
  };
};

export default dbService;