const { QuickDB } = require('quick.db');
const db = new QuickDB();

const clean = async () => {
  const users = await db.get('users');
  const badges = await db.get('badges');
  const userBadges = await db.get('userBadges');
  const userServers = await db.get('userServers');
  const servers = await db.get('servers');
  const channels = await db.get('channels');
  const channelRelations = await db.get('channelRelations');
  const friendGroups = await db.get('friendGroups');
  const members = await db.get('members');
  const memberApplications = await db.get('memberApplications');
  const friends = await db.get('friends');
  const friendApplications = await db.get('friendApplications');
  const messages = await db.get('messages');
  const directMessages = await db.get('directMessages');

  for (const user of Object.values(users)) {
    const ALLOWED_FIELDS = [
      'name',
      'avatar',
      'avatarUrl',
      'signature',
      'country',
      'level',
      'vip',
      'xp',
      'requiredXp',
      'progress',
      'birthYear',
      'birthMonth',
      'birthDay',
      'status',
      'gender',
      'currentChannelId',
      'currentServerId',
      'lastActiveAt',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(user).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    await db.set(`users.${user.id}`, filteredData);
  }

  for (const badge of Object.values(badges)) {
    const ALLOWED_FIELDS = ['name', 'description', 'imageUrl', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(badge).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    await db.set(`badges.${badge.id}`, filteredData);
  }

  for (const userBadge of Object.values(userBadges)) {
    const ALLOWED_FIELDS = ['userId', 'badgeId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(userBadge).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    await db.set(`userBadges.${userBadge.id}`, filteredData);
  }

  for (const userServer of Object.values(userServers)) {
    const ALLOWED_FIELDS = ['userId', 'serverId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(userServer).filter(([key]) =>
        ALLOWED_FIELDS.includes(key),
      ),
    );
    await db.set(`userServers.${userServer.id}`, filteredData);
  }

  for (const server of Object.values(servers)) {
    const ALLOWED_FIELDS = ['name', 'description', 'imageUrl', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(server).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    await db.set(`servers.${server.id}`, filteredData);
  }

  for (const channel of Object.values(channels)) {
    const ALLOWED_FIELDS = ['name', 'description', 'imageUrl', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(channel).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    await db.set(`channels.${channel.id}`, filteredData);
  }

  for (const channelRelation of Object.values(channelRelations)) {
    const ALLOWED_FIELDS = ['channelId', 'serverId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(channelRelation).filter(([key]) =>
        ALLOWED_FIELDS.includes(key),
      ),
    );
    await db.set(`channelRelations.${channelRelation.id}`, filteredData);
  }

  for (const friendGroup of Object.values(friendGroups)) {
    const ALLOWED_FIELDS = ['name', 'description', 'imageUrl', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(friendGroup).filter(([key]) =>
        ALLOWED_FIELDS.includes(key),
      ),
    );
    await db.set(`friendGroups.${friendGroup.id}`, filteredData);
  }

  for (const member of Object.values(members)) {
    const ALLOWED_FIELDS = ['userId', 'serverId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(member).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    await db.set(`members.${member.id}`, filteredData);
  }

  for (const memberApplication of Object.values(memberApplications)) {
    const ALLOWED_FIELDS = ['userId', 'serverId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(memberApplication).filter(([key]) =>
        ALLOWED_FIELDS.includes(key),
      ),
    );
    await db.set(`memberApplications.${memberApplication.id}`, filteredData);
  }

  for (const friend of Object.values(friends)) {
    const ALLOWED_FIELDS = ['userId', 'friendId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(friend).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    await db.set(`friends.${friend.id}`, filteredData);
  }

  for (const friendApplication of Object.values(friendApplications)) {
    const ALLOWED_FIELDS = ['userId', 'friendId', 'createdAt'];
    const filteredData = Object.fromEntries(
      Object.entries(friendApplication).filter(([key]) =>
        ALLOWED_FIELDS.includes(key),
      ),
    );
    await db.set(`friendApplications.${friendApplication.id}`, filteredData);
  }

  for (const message of Object.values(messages)) {
    const ALLOWED_FIELDS = [
      'content',
      'type',
      'senderId',
      'receiverId',
      'channelId',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(message).filter(([key]) => ALLOWED_FIELDS.includes(key)),
    );
    await db.set(`messages.${message.id}`, filteredData);
  }

  for (const directMessage of Object.values(directMessages)) {
    const ALLOWED_FIELDS = [
      'content',
      'type',
      'senderId',
      'receiverId',
      'createdAt',
    ];
    const filteredData = Object.fromEntries(
      Object.entries(directMessage).filter(([key]) =>
        ALLOWED_FIELDS.includes(key),
      ),
    );
    await db.set(`directMessages.${directMessage.id}`, filteredData);
  }
};

clean();
