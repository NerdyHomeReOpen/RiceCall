export default class AlreadyFriendError extends Error {
    userId1: string;
    userId2: string;
    constructor(userId1: string, userId2: string) {
        super(`User ${userId1} and User ${userId2} are already friends.`);
        this.name = 'AlreadyFriendError';
        this.userId1 = userId1;
        this.userId2 = userId2;
    }
}