import { PostRouters } from '../PostRouters';

// Handlers
import { LoginHandler } from './login/login.handler';
import { RegisterHandler } from './register/register.handler';
import { RefreshChannelHandler } from './refresh/channel/refreshChannel.handler';
import { RefreshFriendHandler } from './refresh/friend/refreshFriend.handler';
import { RefreshFriendApplicationHandler } from './refresh/friendApplication/refreshFriendApplication.handler';
import { RefreshFriendGroupHandler } from './refresh/friendGroup/refreshFriendGroup.handler';
import { RefreshMemberHandler } from './refresh/member/refreshMember.handler';
import { RefreshMemberApplicationHandler } from './refresh/memberApplication/refreshMemberApplication.handler';
import {
  RefreshServerHandler,
  RefreshServerChannelsHandler,
  RefreshServerMemberApplicationsHandler,
  RefreshServerMembersHandler,
} from './refresh/server/refreshServer.handler';
import {
  RefreshUserHandler,
  RefreshUserFriendApplicationsHandler,
  RefreshUserFriendGroupsHandler,
  RefreshUserFriendsHandler,
  RefreshUserServersHandler,
} from './refresh/user/refreshUser.handler';
import { RequestAccountRecoverHandler, ResetPasswordHandler } from './accountRecover/accountRecover.handler'; // Changed

export default function () {
  PostRouters.addRoute('/login', LoginHandler);
  PostRouters.addRoute('/register', RegisterHandler);
  PostRouters.addRoute('/refresh/channel', RefreshChannelHandler);
  PostRouters.addRoute('/refresh/friend', RefreshFriendHandler);
  PostRouters.addRoute(
    '/refresh/friendApplication',
    RefreshFriendApplicationHandler,
  );
  PostRouters.addRoute('/refresh/friendGroup', RefreshFriendGroupHandler);
  PostRouters.addRoute('/refresh/member', RefreshMemberHandler);
  PostRouters.addRoute(
    '/refresh/memberApplication',
    RefreshMemberApplicationHandler,
  );
  PostRouters.addRoute('/refresh/server', RefreshServerHandler);
  PostRouters.addRoute('/refresh/serverChannels', RefreshServerChannelsHandler);
  PostRouters.addRoute(
    '/refresh/serverMemberApplications',
    RefreshServerMemberApplicationsHandler,
  );
  PostRouters.addRoute('/refresh/serverMembers', RefreshServerMembersHandler);
  PostRouters.addRoute('/refresh/user', RefreshUserHandler);
  PostRouters.addRoute(
    '/refresh/userFriendApplications',
    RefreshUserFriendApplicationsHandler,
  );
  PostRouters.addRoute(
    '/refresh/userFriendGroups',
    RefreshUserFriendGroupsHandler,
  );
  PostRouters.addRoute('/refresh/userFriends', RefreshUserFriendsHandler);
  PostRouters.addRoute('/refresh/userServers', RefreshUserServersHandler);
  PostRouters.addRoute('/accountRecover/request', RequestAccountRecoverHandler); // Changed
  PostRouters.addRoute('/accountRecover/reset', ResetPasswordHandler); // Changed
}
