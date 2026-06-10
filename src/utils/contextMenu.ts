import * as Types from '@/types';

// TODO: change all permissionLevel name to userPermissionLevel

/**
 * ContextMenu class
 * @example
 * const menu = new ContextMenu()
 * menu.addSeparator()
 * menu.addJoinChannelOption({ canJoin: true, isInChannel: false }, () => {
 *   console.log('join channel')
 * })
 * menu.build()
 * @returns The context menu items
 */
export default class ContextMenu {
  private options: Types.ContextMenuItem[] = [];

  addSeparator(): this {
    this.options.push({
      id: 'separator',
      label: '',
    });
    return this;
  }

  addJoinChannelOption(params: { userCanJoinChannel: boolean; userIsInChannel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'join-channel',
      label: 'join-channel',
      show: params.userCanJoinChannel,
      disabled: params.userIsInChannel,
      onClick: onClick,
    });
    return this;
  }

  addViewOrEditOption(onClick: () => void): this {
    this.options.push({
      id: 'view-or-edit',
      label: 'view-or-edit',
      show: true,
      onClick: onClick,
    });
    return this;
  }

  addCreateChannelOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'create-channel',
      label: 'create-channel',
      show: params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addCreateSubChannelOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'create-sub-channel',
      label: 'create-sub-channel',
      show: params.permissionLevel >= Types.Permission.ChannelAdmin,
      onClick: onClick,
    });
    return this;
  }

  addDeleteChannelOption(params: { permissionLevel: Types.Permission; channelIsSubChannel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'delete-channel',
      label: 'delete-channel',
      show: params.channelIsSubChannel ? params.permissionLevel >= Types.Permission.ChannelAdmin : params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addBroadcastOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'broadcast',
      label: 'broadcast',
      show: params.permissionLevel >= Types.Permission.ChannelAdmin,
      onClick: onClick,
    });
    return this;
  }

  addMoveAllUserToChannelOption(
    params: { permissionLevel: Types.Permission; channelPermissionLevel: Types.Permission; userIsInChannel: boolean; userIdsToMove: string[] },
    onClick: () => void,
  ): this {
    this.options.push({
      id: 'move-all-user-to-channel',
      label: 'move-all-user-to-channel',
      show: !params.userIsInChannel && (params.permissionLevel >= Types.Permission.ServerAdmin || params.channelPermissionLevel >= Types.Permission.ChannelMod) && params.permissionLevel >= Types.Permission.ChannelMod && params.userIdsToMove.length > 0,
      onClick: onClick,
    });
    return this;
  }

  addEditChannelOrderOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'edit-channel-order',
      label: 'edit-channel-order',
      show: params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addKickChannelUsersFromServerOption(params: { permissionLevel: Types.Permission; userIdsToKick: string[] }, onClick: () => void): this {
    this.options.push({
      id: 'kick-channel-users-from-server',
      label: 'kick-channel-users-from-server',
      show: params.userIdsToKick.length > 0 && params.permissionLevel >= Types.Permission.Staff,
      onClick: onClick,
    });
    return this;
  }

  addKickAllUsersFromServerOption(params: { permissionLevel: Types.Permission; userIdsToKick: string[] }, onClick: () => void): this {
    this.options.push({
      id: 'kick-all-users-from-server',
      label: 'kick-all-users-from-server',
      show: params.userIdsToKick.length > 0 && params.permissionLevel >= Types.Permission.Staff,
      onClick: onClick,
    });
    return this;
  }

  addSetReceptionLobbyOption(params: { permissionLevel: Types.Permission; channelIsPrivateChannel: boolean; channelIsReadonlyChannel: boolean; isReceptionLobby: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'set-reception-lobby',
      label: 'set-reception-lobby',
      show: !params.isReceptionLobby && params.permissionLevel >= Types.Permission.ServerAdmin,
      disabled: params.channelIsPrivateChannel || params.channelIsReadonlyChannel,
      onClick: onClick,
    });
    return this;
  }

  addApplyMemberOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'apply-member',
      label: 'apply-member',
      show: params.permissionLevel < Types.Permission.Member,
      onClick: onClick,
    });
    return this;
  }

  addServerSettingOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'member-management',
      label: 'member-management',
      icon: 'member-management',
      show: params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addEditNicknameOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'edit-nickname',
      label: 'edit-nickname',
      show: (params.targetIsSelf || (params.permissionLevel >= Types.Permission.ServerAdmin && params.targetHasLowerLevel)) && params.permissionLevel >= Types.Permission.Member,
      icon: 'edit-nickname',
      onClick: onClick,
    });
    return this;
  }

  addEditNicknameOptionWithNoIcon(params: { permissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'edit-nickname',
      label: 'edit-nickname',
      show: (params.targetIsSelf || (params.permissionLevel >= Types.Permission.ServerAdmin && params.targetHasLowerLevel)) && params.permissionLevel >= Types.Permission.Member,
      icon: 'edit-nickname-no-icon',
      onClick: onClick,
    });
    return this;
  }

  addLocateMeOption(onClick: () => void): this {
    this.options.push({
      id: 'locate-me',
      label: 'locate-me',
      icon: 'locate-me',
      onClick: onClick,
    });
    return this;
  }

  addReportOption(onClick: () => void): this {
    this.options.push({
      id: 'report',
      label: 'report',
      icon: 'report',
      onClick: onClick,
    });
    return this;
  }

  addFavoriteServerOption(params: { serverIsFavorite: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'favorite-server',
      label: params.serverIsFavorite ? 'unfavorite' : 'favorite',
      icon: params.serverIsFavorite ? 'unfavorite-server' : 'favorite-server',
      onClick: onClick,
    });
    return this;
  }

  addSystemSettingOption(onClick: () => void): this {
    this.options.push({
      id: 'system-setting',
      label: 'system-setting',
      icon: 'system-setting',
      onClick: onClick,
    });
    return this;
  }

  addChangeThemeOption(onClick: () => void): this {
    this.options.push({
      id: 'change-theme',
      label: 'change-theme',
      icon: 'change-theme',
      onClick: onClick,
    });
    return this;
  }

  addFeedbackOption(onClick: () => void): this {
    this.options.push({
      id: 'feedback',
      label: 'feedback',
      icon: 'feedback',
      onClick: onClick,
    });
    return this;
  }

  addLanguageSelectOption(params: { languages: { code: Types.LanguageKey; label: string }[] }, onClick: (code: Types.LanguageKey | null) => void): this {
    this.options.push({
      id: 'language-select',
      label: 'language-select',
      icon: 'submenu-left',
      hasSubmenu: params.languages.length > 0,
      submenuItems: params.languages.map((language) => ({
        id: `language-select-${language.code}`,
        label: language.label,
        onClick: () => onClick(language.code),
      })),
      onClick: () => onClick(null),
    });
    return this;
  }

  addHelpCenterOption(
    params: { onFaqClick: () => void; onAgreementClick: () => void; onSpecificationClick: () => void; onContactUsClick: () => void; onAboutUsClick: () => void },
    onClick: () => void,
  ): this {
    this.options.push({
      id: 'help-center',
      label: 'help-center',
      icon: 'submenu-left',
      hasSubmenu: true,
      submenuItems: [
        { id: 'faq', label: 'faq', onClick: params.onFaqClick },
        { id: 'agreement', label: 'agreement', onClick: params.onAgreementClick },
        { id: 'specification', label: 'specification', onClick: params.onSpecificationClick },
        { id: 'contact-us', label: 'contact-us', onClick: params.onContactUsClick },
        { id: 'about-us', label: 'about-ricecall', onClick: params.onAboutUsClick },
      ],
      onClick: onClick,
    });
    return this;
  }

  addLogoutOption(onClick: () => void): this {
    this.options.push({
      id: 'logout',
      label: 'logout',
      icon: 'logout',
      onClick: onClick,
    });
    return this;
  }

  addExitOption(onClick: () => void): this {
    this.options.push({
      id: 'exit',
      label: 'exit',
      icon: 'exit',
      onClick: onClick,
    });
    return this;
  }

  addDirectMessageOption(params: { targetIsSelf: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'direct-message',
      label: 'direct-message',
      show: !params.targetIsSelf,
      onClick: onClick,
    });
    return this;
  }

  addViewProfileOption(onClick: () => void): this {
    this.options.push({
      id: 'view-profile',
      label: 'view-profile',
      onClick: onClick,
    });
    return this;
  }

  addKickUserFromChannelOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean; targetIsInLobby: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'kick-channel',
      label: 'kick-channel',
      show: !params.targetIsSelf && params.targetHasLowerLevel && !params.targetIsInLobby && params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addKickUserFromServerOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'kick-server',
      label: 'kick-server',
      show: !params.targetIsSelf && params.targetHasLowerLevel && params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addBlockUserFromServerOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'block',
      label: 'block',
      show: !params.targetIsSelf && params.targetHasLowerLevel && params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addUnblockUserFromServerOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'unblock-server',
      label: 'unblock',
      show: !params.targetIsSelf && params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addUnblockUserFromChannelOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'unblock-channel',
      label: 'unblock',
      show: !params.targetIsSelf && params.permissionLevel >= Types.Permission.ChannelAdmin,
      onClick: onClick,
    });
    return this;
  }

  addInviteToBeMemberOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'invite-to-be-member',
      label: 'invite-to-be-member',
      show: !params.targetIsSelf && params.targetPermissionLevel < Types.Permission.Member && params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addMemberManagementOption(
    params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean },
    onClick: () => void,
    submenuItems: Types.ContextMenuItem[] = [],
  ): this {
    this.options.push({
      id: 'member-management',
      label: 'member-management',
      icon: 'submenu',
      show:
        !params.targetIsSelf &&
        params.targetHasLowerLevel &&
        params.targetPermissionLevel >= Types.Permission.Guest &&
        params.permissionLevel >= Types.Permission.ChannelMod &&
        submenuItems.filter((item) => item.show).length > 0,
      hasSubmenu: true,
      submenuItems: submenuItems,
      onClick: onClick,
    });
    return this;
  }

  addTerminateMemberOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'terminate-member',
      label: 'terminate-member',
      show:
        !params.targetIsSelf &&
        params.targetHasLowerLevel &&
        params.targetPermissionLevel >= Types.Permission.Guest &&
        params.targetPermissionLevel < Types.Permission.ServerOwner &&
        params.permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addSetChannelModOption(
    params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean; channelIsSubChannel: boolean },
    onClick: () => void,
  ): this {
    this.options.push({
      id: 'set-channel-mod',
      label: params.targetPermissionLevel >= Types.Permission.ChannelMod ? 'unset-channel-mod' : 'set-channel-mod',
      show: params.channelIsSubChannel && params.permissionLevel >= Types.Permission.ChannelAdmin && params.targetPermissionLevel < Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addSetChannelAdminOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'set-channel-admin',
      label: params.targetPermissionLevel >= Types.Permission.ChannelAdmin ? 'unset-channel-admin' : 'set-channel-admin',
      show: params.permissionLevel >= Types.Permission.ServerAdmin && params.targetPermissionLevel < Types.Permission.ChannelAdmin,
      onClick: onClick,
    });
    return this;
  }

  addSetServerAdminOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'set-server-admin',
      label: params.targetPermissionLevel >= Types.Permission.ServerAdmin ? 'unset-server-admin' : 'set-server-admin',
      show: params.permissionLevel >= Types.Permission.ServerOwner && params.targetPermissionLevel < Types.Permission.ServerAdmin,
      onClick: onClick,
    });
    return this;
  }

  addEditFriendGroupNameOption(params: { friendGroupId: string }, onClick: () => void): this {
    this.options.push({
      id: 'edit-friend-group-name',
      label: 'edit-friend-group-name',
      show: !['', 'blacklist', 'stranger'].includes(params.friendGroupId),
      onClick: onClick,
    });
    return this;
  }

  addDeleteFriendGroupOption(params: { friendGroupId: string }, onClick: () => void): this {
    this.options.push({
      id: 'delete-friend-group',
      label: 'delete-friend-group',
      show: !['', 'blacklist', 'stranger'].includes(params.friendGroupId),
      onClick: onClick,
    });
    return this;
  }

  addAddFriendOption(params: { targetIsSelf: boolean; targetIsFriend: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'add-friend',
      label: 'add-friend',
      show: !params.targetIsSelf && !params.targetIsFriend,
      onClick: onClick,
    });
    return this;
  }

  addEditNoteOption(params: { targetIsSelf: boolean; targetIsFriend: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'edit-note',
      label: 'edit-note',
      show: !params.targetIsSelf && params.targetIsFriend,
      onClick: onClick,
    });
    return this;
  }

  addPermissionSettingOption(params: { targetIsSelf: boolean; targetIsFriend: boolean; onHideOrShowOnlineClick: () => void; onNotifyFriendOnlineClick: () => void }, onClick: () => void): this {
    this.options.push({
      id: 'permission-setting',
      label: 'permission-setting',
      icon: 'submenu',
      show: !params.targetIsSelf && params.targetIsFriend,
      hasSubmenu: true,
      submenuItems: [
        { id: 'hide-online-to-friend', label: 'hide-online-to-friend', show: !params.targetIsSelf && params.targetIsFriend, onClick: params.onHideOrShowOnlineClick },
        { id: 'notify-friend-online', label: 'notify-friend-online', show: !params.targetIsSelf && params.targetIsFriend, onClick: params.onNotifyFriendOnlineClick },
      ],
      onClick: onClick,
    });
    return this;
  }

  addEditFriendFriendGroupOption(params: { targetIsSelf: boolean; targetIsStranger: boolean; targetIsBlocked: boolean }, onClick: () => void, submenuItems: Types.ContextMenuItem[] = []): this {
    this.options.push({
      id: 'edit-friend-friend-group',
      label: 'edit-friend-friend-group',
      icon: 'submenu',
      show: !params.targetIsSelf && !params.targetIsStranger && !params.targetIsBlocked && submenuItems.filter((item) => item.show).length > 0,
      hasSubmenu: true,
      submenuItems: submenuItems,
      onClick: onClick,
    });
    return this;
  }

  addFriendGroupOption(params: { friendGroupId: string | null; friendGroups: Types.FriendGroup[] }, onClick: (friendGroupId: string | null) => void): this {
    this.options.push(
      ...params.friendGroups.map((group) => ({
        id: `friend-group-${group.friendGroupId}`,
        label: group.name,
        show: !((group.friendGroupId || null) === params.friendGroupId),
        onClick: () => onClick(group.friendGroupId || null),
      })),
    );
    return this;
  }

  addBlockUserOption(params: { targetIsSelf: boolean; targetIsBlocked: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'block',
      label: params.targetIsBlocked ? 'unblock' : 'block',
      show: !params.targetIsSelf,
      onClick: onClick,
    });
    return this;
  }

  addDeleteFriendOption(params: { targetIsSelf: boolean; targetIsFriend: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'delete-friend',
      label: 'delete-friend',
      show: !params.targetIsSelf && params.targetIsFriend,
      onClick: onClick,
    });
    return this;
  }

  addDeleteFriendApplicationOption(params: { targetIsSelf: boolean; targetIsPending: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'delete-friend-application',
      label: 'delete-friend-application',
      show: !params.targetIsSelf && params.targetIsPending,
      onClick: onClick,
    });
    return this;
  }

  addJoinServerOption(onClick: () => void): this {
    this.options.push({
      id: 'join-server',
      label: 'join-server',
      onClick: onClick,
    });
    return this;
  }

  addViewServerInfoOption(onClick: () => void): this {
    this.options.push({
      id: 'view-server-info',
      label: 'view-server-info',
      onClick: onClick,
    });
    return this;
  }

  addTerminateSelfMembershipOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'terminate-self-membership',
      label: 'terminate-self-membership',
      show: params.targetIsSelf && params.permissionLevel >= Types.Permission.Member && params.permissionLevel < Types.Permission.ServerOwner,
      onClick: onClick,
    });
    return this;
  }

  addJoinUserChannelOption(params: { targetIsSelf: boolean; targetIsInSameChannel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'join-user-channel',
      label: 'join-user-channel',
      show: !params.targetIsSelf && !params.targetIsInSameChannel,
      onClick: onClick,
    });
    return this;
  }

  addAddToQueueOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean; targetHasEqualOrLowerLevel: boolean; channelIsQueueMode: boolean; targetIsInQueue: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'add-to-queue',
      label: 'add-to-queue',
      show: !params.targetIsSelf && params.targetHasEqualOrLowerLevel && params.channelIsQueueMode && params.permissionLevel >= Types.Permission.ChannelMod,
      disabled: params.targetIsInQueue,
      onClick: onClick,
    });
    return this;
  }

  addSetMuteOption(params: { targetIsSelf: boolean; targetIsMuted: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'set-mute',
      label: params.targetIsMuted ? 'unmute' : 'mute',
      show: !params.targetIsSelf,
      onClick: onClick,
    });
    return this;
  }

  // TODO: remove target permission check logic from here
  addMoveToChannelOption(
    params: { permissionLevel: Types.Permission; channelPermissionLevel: Types.Permission; targetIsSelf: boolean; targetIsInSameChannel: boolean; targetHasEqualOrLowerLevel: boolean },
    onClick: () => void,
  ): this {
    this.options.push({
      id: 'move-to-channel',
      label: 'move-to-channel',
      show:
        !params.targetIsSelf &&
        !params.targetIsInSameChannel &&
        params.targetHasEqualOrLowerLevel &&
        params.channelPermissionLevel >= Types.Permission.ChannelMod &&
        params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addForbidVoiceOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean; targetIsVoiceMuted: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'forbid-voice',
      label: params.targetIsVoiceMuted ? 'unforbid-voice' : 'forbid-voice',
      show: !params.targetIsSelf && params.targetHasLowerLevel && params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addForbidTextOption(params: { permissionLevel: Types.Permission; targetIsSelf: boolean; targetHasLowerLevel: boolean; targetIsTextMuted: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'forbid-text',
      label: params.targetIsTextMuted ? 'unforbid-text' : 'forbid-text',
      show: !params.targetIsSelf && params.targetHasLowerLevel && params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addOpenAnnouncementOption(onClick: () => void): this {
    this.options.push({
      id: 'open-announcement',
      label: 'open-announcement',
      onClick: onClick,
    });
    return this;
  }

  addCloseAnnouncementOption(onClick: () => void): this {
    this.options.push({
      id: 'close-announcement',
      label: 'close-announcement',
      onClick: onClick,
    });
    return this;
  }

  addCleanUpMessageOption(onClick: () => void): this {
    this.options.push({
      id: 'clean-up-message',
      label: 'clean-up-message',
      onClick: onClick,
    });
    return this;
  }

  addOpenChannelEventOption(onClick: () => void): this {
    this.options.push({
      id: 'channel-event',
      label: 'channel-event',
      onClick: onClick,
    });
    return this;
  }

  addFreeSpeechOption(params: { permissionLevel: Types.Permission; channelVoiceIsFreeMode: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'free-speech',
      label: 'free-speech',
      icon: params.channelVoiceIsFreeMode ? 'checked' : '',
      show: params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addAdminSpeechOption(params: { permissionLevel: Types.Permission; channelVoiceIsAdminMode: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'admin-speech',
      label: 'admin-speech',
      icon: params.channelVoiceIsAdminMode ? 'checked' : '',
      show: params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addQueueSpeechOption(params: { permissionLevel: Types.Permission; channelVoiceIsQueueMode: boolean }, onClick: () => void, submenuItems: Types.ContextMenuItem[] = []): this {
    this.options.push({
      id: 'queue-speech',
      label: 'queue-speech',
      icon: params.channelVoiceIsQueueMode ? 'submenu' : '',
      show: params.permissionLevel >= Types.Permission.ChannelMod,
      hasSubmenu: params.channelVoiceIsQueueMode,
      submenuItems: submenuItems,
      onClick: onClick,
    });
    return this;
  }

  addForbidQueueOption(params: { permissionLevel: Types.Permission; channelForbidQueue: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'forbid-queue',
      label: 'forbid-queue',
      icon: params.channelForbidQueue ? 'checked' : '',
      show: params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addControlQueueOption(params: { permissionLevel: Types.Permission; queueIsControlled: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'control-queue',
      label: 'control-queue',
      icon: params.queueIsControlled ? 'checked' : '',
      show: params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addIncreaseQueueTimeOption(params: { permissionLevel: Types.Permission; targetQueuePosition: number; }, onClick: () => void): this {
    this.options.push({
      id: 'increase-queue-time',
      label: 'increase-queue-time',
      show: params.targetQueuePosition === 0 && params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addMoveUpQueueOption(params: { permissionLevel: Types.Permission; targetQueuePosition: number; }, onClick: () => void): this {
    this.options.push({
      id: 'move-up-queue',
      label: 'move-up-queue',
      show: params.targetQueuePosition > 1 && params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addMoveDownQueueOption(params: { permissionLevel: Types.Permission; targetQueuePosition: number; }, onClick: () => void): this {
    this.options.push({
      id: 'move-down-queue',
      label: 'move-down-queue',
      show: params.targetQueuePosition > 0 && params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addRemoveFromQueueOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'remove-from-queue',
      label: 'remove-from-queue',
      show: params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addClearQueueOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'clear-queue',
      label: 'clear-queue',
      show: params.permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addNetworkDiagnosisOption(onClick: () => void): this {
    this.options.push({
      id: 'network-diagnosis',
      label: 'network-diagnosis',
      onClick: onClick,
    });
    return this;
  }

  build(): Types.ContextMenuItem[] {
    return this.options;
  }
}
