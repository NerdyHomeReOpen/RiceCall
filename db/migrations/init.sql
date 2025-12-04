-- Messages
CREATE TABLE IF NOT EXISTS channel_messages (
  messageId CHAR(36) PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  serverId CHAR(36) NOT NULL,
  channelId CHAR(36) NOT NULL,
  contentType TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_channel_messages ON channel_messages(serverId, channelId);
CREATE INDEX IF NOT EXISTS idx_channel_sender ON channel_messages(userId);

CREATE TABLE IF NOT EXISTS direct_messages (
  messageId CHAR(36) PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  senderId CHAR(36) NOT NULL,
  contentType TEXT NOT NULL DEFAULT 'text',
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_direct_messages ON direct_messages(userId);
CREATE INDEX IF NOT EXISTS idx_direct_sender ON direct_messages(senderId);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
)
