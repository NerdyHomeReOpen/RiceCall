import StandardizedError from "@/error";

export default class AlreadyFriendError extends StandardizedError {
    constructor(userId1: string, userId2: string) {
        super({
            name: 'ValidationError',
            message: `使用者 ${userId1} 和 ${userId2} 已經是好友了`,
            part: 'FRIEND',
            tag: 'ALREADY_FRIEND_ERROR',
            statusCode: 400,
        });
    }
}