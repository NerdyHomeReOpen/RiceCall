import StandardizedError from '@/error';

export default class AlreadyMemberError extends StandardizedError {
  constructor(userId: string, serverId: string) {
    super({
      name: 'AlreadyMemberError',
      message: `User(${userId}) is already a member of server(${serverId}).`,
      part: 'MEMBER',
      tag: 'ALREADY_EXISTS_ERROR',
      statusCode: 409,
    });
  }
}
