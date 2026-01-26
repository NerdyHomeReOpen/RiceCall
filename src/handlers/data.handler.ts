/**
 * Data handlers - shared between Electron and Web.
 * Provides data fetching from API.
 */

import type { HandlerContext } from '@/platform/ipc/types';
import type { HandlerRegistration } from '@/platform/ipc/types';
import type * as Types from '@/types';

function toQuery(params: Record<string, unknown>): string {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      filtered[k] = String(v);
    }
  }
  return new URLSearchParams(filtered).toString();
}

/**
 * Create data handlers.
 * All handlers use the API client from context.
 */
export function createDataHandlers(): HandlerRegistration {
  return {
    async: {
      'data-user': async (ctx: HandlerContext, params: { userId: string }): Promise<Types.User | null> => {
        return ctx.api.get(`/user?${toQuery(params)}`);
      },

      'data-user-hot-reload': async (ctx: HandlerContext, params: { userId: string }): Promise<Types.User | null> => {
        return ctx.api.get(`/user?${toQuery(params)}`);
      },

      'data-friend': async (ctx: HandlerContext, params: { userId: string; targetId: string }): Promise<Types.Friend | null> => {
        return ctx.api.get(`/friend?${toQuery(params)}`);
      },

      'data-friends': async (ctx: HandlerContext, params: { userId: string }): Promise<Types.Friend[]> => {
        return (await ctx.api.get(`/friends?${toQuery(params)}`)) ?? [];
      },

      'data-friendActivities': async (ctx: HandlerContext, params: { userId: string }): Promise<Types.FriendActivity[]> => {
        return (await ctx.api.get(`/friendActivities?${toQuery(params)}`)) ?? [];
      },

      'data-friendGroup': async (ctx: HandlerContext, params: { userId: string; friendGroupId: string }): Promise<Types.FriendGroup | null> => {
        return ctx.api.get(`/friendGroup?${toQuery(params)}`);
      },

      'data-friendGroups': async (ctx: HandlerContext, params: { userId: string }): Promise<Types.FriendGroup[]> => {
        return (await ctx.api.get(`/friendGroups?${toQuery(params)}`)) ?? [];
      },

      'data-friendApplication': async (ctx: HandlerContext, params: { receiverId: string; senderId: string }): Promise<Types.FriendApplication | null> => {
        return ctx.api.get(`/friendApplication?${toQuery(params)}`);
      },

      'data-friendApplications': async (ctx: HandlerContext, params: { receiverId: string }): Promise<Types.FriendApplication[]> => {
        return (await ctx.api.get(`/friendApplications?${toQuery(params)}`)) ?? [];
      },

      'data-server': async (ctx: HandlerContext, params: { userId: string; serverId: string }): Promise<Types.Server | null> => {
        return ctx.api.get(`/server?${toQuery(params)}`);
      },

      'data-servers': async (ctx: HandlerContext, params: { userId: string }): Promise<Types.Server[]> => {
        return (await ctx.api.get(`/servers?${toQuery(params)}`)) ?? [];
      },

      'data-serverMembers': async (ctx: HandlerContext, params: { serverId: string }): Promise<Types.Member[]> => {
        return (await ctx.api.get(`/serverMembers?${toQuery(params)}`)) ?? [];
      },

      'data-serverOnlineMembers': async (ctx: HandlerContext, params: { serverId: string }): Promise<Types.OnlineMember[]> => {
        return (await ctx.api.get(`/serverOnlineMembers?${toQuery(params)}`)) ?? [];
      },

      'data-channel': async (ctx: HandlerContext, params: { userId: string; serverId: string; channelId: string }): Promise<Types.Channel | null> => {
        return ctx.api.get(`/channel?${toQuery(params)}`);
      },

      'data-channels': async (ctx: HandlerContext, params: { userId: string; serverId: string }): Promise<Types.Channel[]> => {
        return (await ctx.api.get(`/channels?${toQuery(params)}`)) ?? [];
      },

      'data-channelMembers': async (ctx: HandlerContext, params: { serverId: string; channelId: string }): Promise<Types.Member[]> => {
        return (await ctx.api.get(`/channelMembers?${toQuery(params)}`)) ?? [];
      },

      'data-member': async (ctx: HandlerContext, params: { userId: string; serverId: string; channelId?: string }): Promise<Types.Member | null> => {
        return ctx.api.get(`/member?${toQuery(params)}`);
      },

      'data-memberApplication': async (ctx: HandlerContext, params: { userId: string; serverId: string }): Promise<Types.MemberApplication | null> => {
        return ctx.api.get(`/memberApplication?${toQuery(params)}`);
      },

      'data-memberApplications': async (ctx: HandlerContext, params: { serverId: string }): Promise<Types.MemberApplication[]> => {
        return (await ctx.api.get(`/memberApplications?${toQuery(params)}`)) ?? [];
      },

      'data-memberInvitation': async (ctx: HandlerContext, params: { receiverId: string; serverId: string }): Promise<Types.MemberInvitation | null> => {
        return ctx.api.get(`/memberInvitation?${toQuery(params)}`);
      },

      'data-memberInvitations': async (ctx: HandlerContext, params: { receiverId: string }): Promise<Types.MemberInvitation[]> => {
        return (await ctx.api.get(`/memberInvitations?${toQuery(params)}`)) ?? [];
      },

      'data-notifications': async (ctx: HandlerContext, params: { region: string }): Promise<Types.Notification[]> => {
        return (await ctx.api.get(`/notifications?${toQuery(params)}`)) ?? [];
      },

      'data-announcements': async (ctx: HandlerContext, params: { region: string }): Promise<Types.Announcement[]> => {
        return (await ctx.api.get(`/announcements?${toQuery(params)}`)) ?? [];
      },

      'data-recommendServers': async (ctx: HandlerContext, params: { region: string }): Promise<Types.RecommendServer[]> => {
        return (await ctx.api.get(`/recommendServers?${toQuery(params)}`)) ?? [];
      },

      'data-uploadImage': async (ctx: HandlerContext, params: { folder: string; imageName: string; imageUnit8Array: Uint8Array }): Promise<{ imageName: string; imageUrl: string } | null> => {
        const formData = new FormData();
        formData.append('folder', params.folder);
        formData.append('imageName', params.imageName);
        const bytes = params.imageUnit8Array;
        const copied = bytes.slice().buffer;
        formData.append('image', new Blob([copied], { type: 'image/webp' }), `${params.imageName}.webp`);
        return ctx.api.post('/upload/image', formData);
      },

      'data-searchServer': async (ctx: HandlerContext, params: { query: string }): Promise<Types.Server[]> => {
        return (await ctx.api.get(`/server/search?${toQuery(params)}`)) ?? [];
      },

      'data-searchUser': async (ctx: HandlerContext, params: { query: string }): Promise<Types.User[]> => {
        return (await ctx.api.get(`/user/search?${toQuery(params)}`)) ?? [];
      },
    },
  };
}
