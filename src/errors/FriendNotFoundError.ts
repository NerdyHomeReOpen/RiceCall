import StandardizedError from "@/error";

export default class FriendNotFoundError extends StandardizedError {
    userId1: string;
    userId2: string;
    constructor(userId1: string, userId2: string) {
        super({
            name: 'ValidationError',
            message: `User ${userId1} and User ${userId2} are not friends.`,
            part: 'FRIEND',
            tag: 'FRIEND_NOT_FOUND_ERROR',
            statusCode: 400,
        });
        this.userId1 = userId1;
        this.userId2 = userId2;
    }
}
