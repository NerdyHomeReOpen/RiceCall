import StandardizedError from '@/error';

export default class MemberApplicationNotFoundError extends StandardizedError {
  constructor(userId: string, serverId: string) {
    super({
      name: 'MemberApplicationNotFoundError',
      message: `Member application from user(${userId}) to server(${serverId}) not found.`,
      part: 'MEMBER_APPLICATION',
      tag: 'NOT_FOUND_ERROR',
      statusCode: 404,
    });
  }
}
