import StandardizedError from "@/error";

export default class FriendGroupNotFoundError extends StandardizedError {
    constructor(friendGroupId: string) {
        super({
            name: 'ValidationError',
            message: `Friend group does not exist {friendGroupId: ${friendGroupId}}`,
            part: 'FRIEND',
            tag: 'FRIEND_GROUP_NOT_FOUND_ERROR',
            statusCode: 400,
        });
    }
}
