import StandardizedError from "@/error";

export default class FriendApplicationNotFoundError extends StandardizedError {
    constructor(userId1: string, userId2: string) {
        super({
            name: 'ValidationError',
            message: `來自 ${userId1} 對於 ${userId2} 的好友申請不存在`,
            part: 'FRIEND',
            tag: 'FRIEND_APPLICATION_NOT_FOUND_ERROR',
            statusCode: 400,
        });
    }
}