import { EventRouters } from '../EventRoutes';

// Handlers
import {
  ConnectChannelHandler,
  CreateChannelHandler,
  DeleteChannelHandler,
  DisconnectChannelHandler,
  UpdateChannelHandler,
  UpdateChannelsHandler,
} from './channel/channel.handler';
import {
  CreateFriendHandler,
  DeleteFriendHandler,
  UpdateFriendHandler,
} from './friend/friend.handler';
import {
  ApproveFriendApplicationHandler,
  CreateFriendApplicationHandler,
  DeleteFriendApplicationHandler,
  UpdateFriendApplicationHandler,
} from './friendApplication/friendApplication.handler';
import {
  CreateFriendGroupHandler,
  DeleteFriendGroupHandler,
  UpdateFriendGroupHandler,
} from './friendGroup/friendGroup.handler';
import {
  CreateMemberHandler,
  DeleteMemberHandler,
  UpdateMemberHandler,
} from './member/member.handler';
import {
  CreateMemberApplicationHandler,
  DeleteMemberApplicationHandler,
  UpdateMemberApplicationHandler,
  ApproveMemberApplicationHandler,
} from './memberApplication/memberApplication.handler';
import {
  SendDirectMessageHandler,
  SendActionMessageHandler,
  SendMessageHandler,
  ShakeWindowHandler,
} from './message/message.handler';
import {
  RTCAnswerHandler,
  RTCCandidateHandler,
  RTCOfferHandler,
} from './rtc/rtc.handler';
import {
  ConnectServerHandler,
  CreateServerHandler,
  DisconnectServerHandler,
  FavoriteServerHandler,
  SearchServerHandler,
  UpdateServerHandler,
} from './server/server.handler';
import { SearchUserHandler, UpdateUserHandler } from './user/user.handler';

export default function (eventRouter: EventRouters) {
  // User
  eventRouter.addRoute('searchUser', SearchUserHandler);
  eventRouter.addRoute('updateUser', UpdateUserHandler);

  // Server
  eventRouter.addRoute('searchServer', SearchServerHandler);
  eventRouter.addRoute('connectServer', ConnectServerHandler);
  eventRouter.addRoute('disconnectServer', DisconnectServerHandler);
  eventRouter.addRoute('createServer', CreateServerHandler);
  eventRouter.addRoute('updateServer', UpdateServerHandler);
  eventRouter.addRoute('favoriteServer', FavoriteServerHandler);

  // Channel
  eventRouter.addRoute('connectChannel', ConnectChannelHandler);
  eventRouter.addRoute('disconnectChannel', DisconnectChannelHandler);
  eventRouter.addRoute('createChannel', CreateChannelHandler);
  eventRouter.addRoute('updateChannel', UpdateChannelHandler);
  eventRouter.addRoute('updateChannels', UpdateChannelsHandler);
  eventRouter.addRoute('deleteChannel', DeleteChannelHandler);

  // Friend Group
  eventRouter.addRoute('createFriendGroup', CreateFriendGroupHandler);
  eventRouter.addRoute('updateFriendGroup', UpdateFriendGroupHandler);
  eventRouter.addRoute('deleteFriendGroup', DeleteFriendGroupHandler);

  // Member
  eventRouter.addRoute('createMember', CreateMemberHandler);
  eventRouter.addRoute('updateMember', UpdateMemberHandler);
  eventRouter.addRoute('deleteMember', DeleteMemberHandler);
  eventRouter.addRoute(
    'createMemberApplication',
    CreateMemberApplicationHandler,
  );
  eventRouter.addRoute(
    'updateMemberApplication',
    UpdateMemberApplicationHandler,
  );
  eventRouter.addRoute(
    'deleteMemberApplication',
    DeleteMemberApplicationHandler,
  );
  eventRouter.addRoute(
    'approveMemberApplication',
    ApproveMemberApplicationHandler,
  );

  // Friend
  eventRouter.addRoute('createFriend', CreateFriendHandler);
  eventRouter.addRoute('updateFriend', UpdateFriendHandler);
  eventRouter.addRoute('deleteFriend', DeleteFriendHandler);

  // Friend Application
  eventRouter.addRoute(
    'createFriendApplication',
    CreateFriendApplicationHandler,
  );
  eventRouter.addRoute(
    'updateFriendApplication',
    UpdateFriendApplicationHandler,
  );
  eventRouter.addRoute(
    'deleteFriendApplication',
    DeleteFriendApplicationHandler,
  );
  eventRouter.addRoute(
    'approveFriendApplication',
    ApproveFriendApplicationHandler,
  );

  // Message
  eventRouter.addRoute('message', SendMessageHandler);
  eventRouter.addRoute('actionMessage', SendActionMessageHandler);
  eventRouter.addRoute('directMessage', SendDirectMessageHandler);
  eventRouter.addRoute('shakeWindow', ShakeWindowHandler);

  // RTC
  eventRouter.addRoute('RTCOffer', RTCOfferHandler);
  eventRouter.addRoute('RTCAnswer', RTCAnswerHandler);
  eventRouter.addRoute('RTCIceCandidate', RTCCandidateHandler);
}
