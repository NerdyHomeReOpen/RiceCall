import { SocketRequestHandler } from '@/handler';
import { DataValidator } from '@/middleware/data.validator';
import { Server, Socket } from 'socket.io';
import { FriendApprovalSchema } from './friendApproval.schema';
import { database } from '@/index';
import FriendApplicationNotFoundError from '@/errors/FriendApplicationNotFoundError';
import { FriendHandlerServerSide } from '../friend/friend.handler';
import StandardizedError from '@/error';
import Logger from '@/utils/logger';
import AlreadyFriendError from '@/errors/AlreadyFriendError';

export const FriendApprovalHandler: SocketRequestHandler = {
    async handle(io: Server, socket: Socket, data: any) {
        try {
            const operatorId = socket.data.userId;

            const {
                targetId,
                friendGroupId,
            } = await DataValidator.validate(
                FriendApprovalSchema,
                data,
                'FRIENDAPPROVAL',
            );

            const friendApplication = await database.get.friendApplication(
                targetId,
                operatorId,
            );
            if (!friendApplication) throw new FriendApplicationNotFoundError(targetId, operatorId);

            const friend = await database.get.friend(operatorId, targetId);
            if (friend) throw new AlreadyFriendError(targetId, operatorId);

            await FriendHandlerServerSide.createFriend(operatorId, targetId);
            await database.delete.friendApplication(targetId, operatorId);

            if (friendGroupId) await FriendHandlerServerSide.updateFriendGroup(operatorId, targetId, friendGroupId);

            socket.emit('friendApproval', {
                targetId
            });
        }
        catch (error: any) {
            if (!(error instanceof StandardizedError)) {
                new Logger('FriendApproval').error(error.message);

                error = new StandardizedError({
                    name: 'ServerError',
                    message: `處理好友申請失敗，請稍後再試`,
                    part: 'FRIENDAPPROVAL',
                    tag: 'EXCEPTION_ERROR',
                    statusCode: 500,
                });
            }

            socket.emit('error', error);
        }
        
    }
}