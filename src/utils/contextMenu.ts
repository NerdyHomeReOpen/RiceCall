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

  addJoinChannelOption(params: { canJoin: boolean; isInChannel: boolean }, onClick: () => void): this {
    const { canJoin, isInChannel } = params;

    this.options.push({
      id: 'join-channel',
      label: 'join-channel',
      show: canJoin,
      disabled: isInChannel,
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
    const { permissionLevel } = params;

    this.options.push({
      id: 'create-channel',
      label: 'create-channel',
      show: permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addCreateSubChannelOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel } = params;

    this.options.push({
      id: 'create-sub-channel',
      label: 'create-sub-channel',
      show: permissionLevel >= Types.Permission.ChannelAdmin,
      onClick: onClick,
    });

    return this;
  }

  addDeleteChannelOption(params: { permissionLevel: Types.Permission; isChannelSubChannel: boolean }, onClick: () => void): this {
    const { permissionLevel, isChannelSubChannel } = params;

    this.options.push({
      id: 'delete-channel',
      label: 'delete-channel',
      show: isChannelSubChannel ? permissionLevel >= Types.Permission.ChannelAdmin : permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addBroadcastOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel } = params;

    this.options.push({
      id: 'broadcast',
      label: 'broadcast',
      show: permissionLevel >= Types.Permission.ChannelAdmin,
      onClick: onClick,
    });

    return this;
  }

  addMoveAllUserToChannelOption(params: { permissionLevel: Types.Permission; despermissionLevel: Types.Permission; isInChannel: boolean; userIdsToMove: string[] }, onClick: () => void): this {
    const { permissionLevel, despermissionLevel, isInChannel, userIdsToMove } = params;

    this.options.push({
      id: 'move-all-user-to-channel',
      label: 'move-all-user-to-channel',
      show:
        !isInChannel &&
        (permissionLevel >= Types.Permission.ServerAdmin || despermissionLevel >= Types.Permission.ChannelMod) &&
        permissionLevel >= Types.Permission.ChannelMod &&
        userIdsToMove.length > 0,
      onClick: onClick,
    });

    return this;
  }

  addEditChannelOrderOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel } = params;

    this.options.push({
      id: 'edit-channel-order',
      label: 'edit-channel-order',
      show: permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addKickChannelUsersFromServerOption(params: { permissionLevel: Types.Permission; userIdsToKick: string[] }, onClick: () => void): this {
    const { permissionLevel, userIdsToKick } = params;

    this.options.push({
      id: 'kick-channel-users-from-server',
      label: 'kick-channel-users-from-server',
      show: userIdsToKick.length > 0 && permissionLevel >= Types.Permission.Staff,
      onClick: onClick,
    });

    return this;
  }

  addKickAllUsersFromServerOption(params: { permissionLevel: Types.Permission; userIdsToKick: string[] }, onClick: () => void): this {
    const { permissionLevel, userIdsToKick } = params;

    this.options.push({
      id: 'kick-all-users-from-server',
      label: 'kick-all-users-from-server',
      show: userIdsToKick.length > 0 && permissionLevel >= Types.Permission.Staff,
      onClick: onClick,
    });

    return this;
  }

  addSetReceptionLobbyOption(params: { permissionLevel: Types.Permission; isChannelPrivate: boolean; isChannelReadonly: boolean; isChannelReceptionLobby: boolean }, onClick: () => void): this {
    const { permissionLevel, isChannelPrivate, isChannelReadonly, isChannelReceptionLobby } = params;

    this.options.push({
      id: 'set-reception-lobby',
      label: 'set-reception-lobby',
      show: !isChannelReceptionLobby && permissionLevel >= Types.Permission.ServerAdmin,
      disabled: isChannelPrivate || isChannelReadonly,
      onClick: onClick,
    });

    return this;
  }

  addApplyMemberOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel } = params;

    this.options.push({
      id: 'apply-member',
      label: 'apply-member',
      show: permissionLevel < Types.Permission.Member,
      onClick: onClick,
    });

    return this;
  }

  addServerSettingOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel } = params;

    this.options.push({
      id: 'member-management',
      label: 'member-management',
      icon: 'member-management',
      show: permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addEditNicknameOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'edit-nickname',
      label: 'edit-nickname',
      show: (isTargetSelf || (permissionLevel >= Types.Permission.ServerAdmin && permissionLevel > targetPermissionLevel)) && permissionLevel >= Types.Permission.Member,
      icon: 'edit-nickname',
      onClick: onClick,
    });

    return this;
  }

  addEditNicknameOptionWithNoIcon(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'edit-nickname',
      label: 'edit-nickname',
      show: (isTargetSelf || (permissionLevel >= Types.Permission.ServerAdmin && permissionLevel > targetPermissionLevel)) && permissionLevel >= Types.Permission.Member,
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

  addFavoriteServerOption(params: { isServerFavorite: boolean }, onClick: () => void): this {
    const { isServerFavorite } = params;

    this.options.push({
      id: 'favorite-server',
      label: isServerFavorite ? 'unfavorite' : 'favorite',
      icon: isServerFavorite ? 'unfavorite-server' : 'favorite-server',
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
    const { languages } = params;

    this.options.push({
      id: 'language-select',
      label: 'language-select',
      icon: 'submenu-left',
      hasSubmenu: languages.length > 0,
      submenuItems: languages.map((language) => ({
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
    const { onFaqClick, onAgreementClick, onSpecificationClick, onContactUsClick, onAboutUsClick } = params;

    this.options.push({
      id: 'help-center',
      label: 'help-center',
      icon: 'submenu-left',
      hasSubmenu: true,
      submenuItems: [
        { id: 'faq', label: 'faq', onClick: onFaqClick },
        { id: 'agreement', label: 'agreement', onClick: onAgreementClick },
        { id: 'specification', label: 'specification', onClick: onSpecificationClick },
        { id: 'contact-us', label: 'contact-us', onClick: onContactUsClick },
        { id: 'about-us', label: 'about-ricecall', onClick: onAboutUsClick },
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

  addDirectMessageOption(params: { isTargetSelf: boolean }, onClick: () => void): this {
    const { isTargetSelf } = params;

    this.options.push({
      id: 'direct-message',
      label: 'direct-message',
      show: !isTargetSelf,
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

  addKickUserFromChannelOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean; isTargetInLobby: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf, isTargetInLobby } = params;

    this.options.push({
      id: 'kick-channel',
      label: 'kick-channel',
      show: !isTargetSelf && permissionLevel > targetPermissionLevel && !isTargetInLobby && permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addKickUserFromServerOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'kick-server',
      label: 'kick-server',
      show: !isTargetSelf && permissionLevel > targetPermissionLevel && permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addBlockUserFromServerOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'block',
      label: 'block',
      show: !isTargetSelf && permissionLevel > targetPermissionLevel && permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addUnblockUserFromServerOption(params: { permissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'unblock-server',
      label: 'unblock',
      show: !isTargetSelf && permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addUnblockUserFromChannelOption(params: { permissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'unblock-channel',
      label: 'unblock',
      show: !isTargetSelf && permissionLevel >= Types.Permission.ChannelAdmin,
      onClick: onClick,
    });

    return this;
  }

  addInviteToBeMemberOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'invite-to-be-member',
      label: 'invite-to-be-member',
      show: !isTargetSelf && targetPermissionLevel < Types.Permission.Member && permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addMemberManagementOption(
    params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean },
    onClick: () => void,
    submenuItems: Types.ContextMenuItem[] = [],
  ): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'member-management',
      label: 'member-management',
      icon: 'submenu',
      show:
        !isTargetSelf &&
        permissionLevel > targetPermissionLevel &&
        targetPermissionLevel >= Types.Permission.Guest &&
        permissionLevel >= Types.Permission.ChannelMod &&
        submenuItems.filter((item) => item.show).length > 0,
      hasSubmenu: true,
      submenuItems: submenuItems,
      onClick: onClick,
    });

    return this;
  }

  addTerminateMemberOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'terminate-member',
      label: 'terminate-member',
      show:
        !isTargetSelf &&
        permissionLevel > targetPermissionLevel &&
        targetPermissionLevel >= Types.Permission.Guest &&
        targetPermissionLevel < Types.Permission.ServerOwner &&
        permissionLevel >= Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addSetChannelModOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isChannelSubChannel: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isChannelSubChannel } = params;

    this.options.push({
      id: 'set-channel-mod',
      label: targetPermissionLevel >= Types.Permission.ChannelMod ? 'unset-channel-mod' : 'set-channel-mod',
      show: isChannelSubChannel && permissionLevel >= Types.Permission.ChannelAdmin && targetPermissionLevel < Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addSetChannelAdminOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel } = params;

    this.options.push({
      id: 'set-channel-admin',
      label: targetPermissionLevel >= Types.Permission.ChannelAdmin ? 'unset-channel-admin' : 'set-channel-admin',
      show: permissionLevel >= Types.Permission.ServerAdmin && targetPermissionLevel < Types.Permission.ChannelAdmin,
      onClick: onClick,
    });

    return this;
  }

  addSetServerAdminOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel } = params;

    this.options.push({
      id: 'set-server-admin',
      label: targetPermissionLevel >= Types.Permission.ServerAdmin ? 'unset-server-admin' : 'set-server-admin',
      show: permissionLevel >= Types.Permission.ServerOwner && targetPermissionLevel < Types.Permission.ServerAdmin,
      onClick: onClick,
    });

    return this;
  }

  addEditFriendGroupNameOption(params: { friendGroupId: string }, onClick: () => void): this {
    const { friendGroupId } = params;

    this.options.push({
      id: 'edit-friend-group-name',
      label: 'edit-friend-group-name',
      show: !['', 'blacklist', 'stranger'].includes(friendGroupId),
      onClick: onClick,
    });

    return this;
  }

  addDeleteFriendGroupOption(params: { friendGroupId: string }, onClick: () => void): this {
    const { friendGroupId } = params;

    this.options.push({
      id: 'delete-friend-group',
      label: 'delete-friend-group',
      show: !['', 'blacklist', 'stranger'].includes(friendGroupId),
      onClick: onClick,
    });

    return this;
  }

  addAddFriendOption(params: { isTargetSelf: boolean; isTargetFriend: boolean }, onClick: () => void): this {
    const { isTargetSelf, isTargetFriend } = params;

    this.options.push({
      id: 'add-friend',
      label: 'add-friend',
      show: !isTargetSelf && !isTargetFriend,
      onClick: onClick,
    });

    return this;
  }

  addEditNoteOption(params: { isTargetSelf: boolean; isTargetFriend: boolean }, onClick: () => void): this {
    const { isTargetSelf, isTargetFriend } = params;

    this.options.push({
      id: 'edit-note',
      label: 'edit-note',
      show: !isTargetSelf && isTargetFriend,
      onClick: onClick,
    });

    return this;
  }

  addPermissionSettingOption(params: { isTargetSelf: boolean; isTargetFriend: boolean; onHideOrShowOnlineClick: () => void; onNotifyFriendOnlineClick: () => void }, onClick: () => void): this {
    const { isTargetSelf, isTargetFriend, onHideOrShowOnlineClick, onNotifyFriendOnlineClick } = params;

    this.options.push({
      id: 'permission-setting',
      label: 'permission-setting',
      icon: 'submenu',
      show: !isTargetSelf && isTargetFriend,
      hasSubmenu: true,
      submenuItems: [
        { id: 'hide-online-to-friend', label: 'hide-online-to-friend', show: !isTargetSelf && isTargetFriend, onClick: onHideOrShowOnlineClick },
        { id: 'notify-friend-online', label: 'notify-friend-online', show: !isTargetSelf && isTargetFriend, onClick: onNotifyFriendOnlineClick },
      ],
      onClick: onClick,
    });

    return this;
  }

  addEditFriendFriendGroupOption(params: { isTargetSelf: boolean; isTargetStranger: boolean; isTargetBlocked: boolean }, onClick: () => void, submenuItems: Types.ContextMenuItem[] = []): this {
    const { isTargetSelf, isTargetStranger, isTargetBlocked } = params;

    this.options.push({
      id: 'edit-friend-friend-group',
      label: 'edit-friend-friend-group',
      icon: 'submenu',
      show: !isTargetSelf && !isTargetStranger && !isTargetBlocked && submenuItems.filter((item) => item.show).length > 0,
      hasSubmenu: true,
      submenuItems: submenuItems,
      onClick: onClick,
    });

    return this;
  }

  addFriendGroupOption(params: { friendGroupId: string | null; friendGroups: Types.FriendGroup[] }, onClick: (friendGroupId: string | null) => void): this {
    const { friendGroupId, friendGroups } = params;

    this.options.push(
      ...friendGroups.map((group) => ({
        id: `friend-group-${group.friendGroupId}`,
        label: group.name,
        show: !((group.friendGroupId || null) === friendGroupId),
        onClick: () => onClick(group.friendGroupId || null),
      })),
    );

    return this;
  }

  addBlockUserOption(params: { isTargetSelf: boolean; isTargetBlocked: boolean }, onClick: () => void): this {
    const { isTargetSelf, isTargetBlocked } = params;

    this.options.push({
      id: 'block',
      label: isTargetBlocked ? 'unblock' : 'block',
      show: !isTargetSelf,
      onClick: onClick,
    });

    return this;
  }

  addDeleteFriendOption(params: { isTargetSelf: boolean; isTargetFriend: boolean }, onClick: () => void): this {
    const { isTargetSelf, isTargetFriend } = params;

    this.options.push({
      id: 'delete-friend',
      label: 'delete-friend',
      show: !isTargetSelf && isTargetFriend,
      onClick: onClick,
    });

    return this;
  }

  addDeleteFriendApplicationOption(params: { isTargetSelf: boolean; isTargetPending: boolean }, onClick: () => void): this {
    const { isTargetSelf, isTargetPending } = params;

    this.options.push({
      id: 'delete-friend-application',
      label: 'delete-friend-application',
      show: !isTargetSelf && isTargetPending,
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

  addTerminateSelfMembershipOption(params: { permissionLevel: Types.Permission; isTargetSelf: boolean }, onClick: () => void): this {
    const { permissionLevel, isTargetSelf } = params;

    this.options.push({
      id: 'terminate-self-membership',
      label: 'terminate-self-membership',
      show: isTargetSelf && permissionLevel >= Types.Permission.Member && permissionLevel < Types.Permission.ServerOwner,
      onClick: onClick,
    });

    return this;
  }

  addJoinUserChannelOption(params: { isTargetSelf: boolean; isTargetInSameChannel: boolean }, onClick: () => void): this {
    const { isTargetSelf, isTargetInSameChannel } = params;

    this.options.push({
      id: 'join-user-channel',
      label: 'join-user-channel',
      show: !isTargetSelf && !isTargetInSameChannel,
      onClick: onClick,
    });

    return this;
  }

  addAddToQueueOption(
    params: { permissionLevel: Types.Permission; isTargetSelf: boolean; isTargetInQueue: boolean; targetHasEqualOrLowerLevel: boolean; isChannelQueueMode: boolean },
    onClick: () => void,
  ): this {
    const { permissionLevel, isTargetSelf, isTargetInQueue, targetHasEqualOrLowerLevel, isChannelQueueMode } = params;

    this.options.push({
      id: 'add-to-queue',
      label: 'add-to-queue',
      show: !isTargetSelf && targetHasEqualOrLowerLevel && isChannelQueueMode && permissionLevel >= Types.Permission.ChannelMod,
      disabled: isTargetInQueue,
      onClick: onClick,
    });

    return this;
  }

  addSetMuteOption(params: { isTargetSelf: boolean; isTargetMuted: boolean }, onClick: () => void): this {
    const { isTargetSelf, isTargetMuted } = params;

    this.options.push({
      id: 'set-mute',
      label: isTargetMuted ? 'unmute' : 'mute',
      show: !isTargetSelf,
      onClick: onClick,
    });

    return this;
  }

  // TODO: remove target permission check logic from here
  addMoveToChannelOption(
    params: { permissionLevel: Types.Permission; channelPermissionLevel: Types.Permission; isTargetSelf: boolean; isTargetInSameChannel: boolean; targetHasEqualOrLowerLevel: boolean },
    onClick: () => void,
  ): this {
    const { permissionLevel, channelPermissionLevel, isTargetSelf, isTargetInSameChannel, targetHasEqualOrLowerLevel } = params;

    this.options.push({
      id: 'move-to-channel',
      label: 'move-to-channel',
      show: !isTargetSelf && !isTargetInSameChannel && targetHasEqualOrLowerLevel && channelPermissionLevel >= Types.Permission.ChannelMod && permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addForbidVoiceOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean; isTargetVoiceMuted: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf, isTargetVoiceMuted } = params;

    this.options.push({
      id: 'forbid-voice',
      label: isTargetVoiceMuted ? 'unforbid-voice' : 'forbid-voice',
      show: !isTargetSelf && permissionLevel > targetPermissionLevel && permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addForbidTextOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isTargetSelf: boolean; isTargetTextMuted: boolean }, onClick: () => void): this {
    const { permissionLevel, targetPermissionLevel, isTargetSelf, isTargetTextMuted } = params;

    this.options.push({
      id: 'forbid-text',
      label: isTargetTextMuted ? 'unforbid-text' : 'forbid-text',
      show: !isTargetSelf && permissionLevel > targetPermissionLevel && permissionLevel >= Types.Permission.ChannelMod,
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

  addFreeSpeechOption(params: { permissionLevel: Types.Permission; isChannelVoiceFreeMode: boolean }, onClick: () => void): this {
    const { permissionLevel, isChannelVoiceFreeMode } = params;

    this.options.push({
      id: 'free-speech',
      label: 'free-speech',
      icon: isChannelVoiceFreeMode ? 'checked' : '',
      show: permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addAdminSpeechOption(params: { permissionLevel: Types.Permission; isChannelVoiceAdminMode: boolean }, onClick: () => void): this {
    const { permissionLevel, isChannelVoiceAdminMode } = params;

    this.options.push({
      id: 'admin-speech',
      label: 'admin-speech',
      icon: isChannelVoiceAdminMode ? 'checked' : '',
      show: permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addQueueSpeechOption(params: { permissionLevel: Types.Permission; isChannelVoiceQueueMode: boolean }, onClick: () => void, submenuItems: Types.ContextMenuItem[] = []): this {
    const { permissionLevel, isChannelVoiceQueueMode } = params;

    this.options.push({
      id: 'queue-speech',
      label: 'queue-speech',
      icon: isChannelVoiceQueueMode ? 'submenu' : '',
      show: permissionLevel >= Types.Permission.ChannelMod,
      hasSubmenu: isChannelVoiceQueueMode,
      submenuItems: submenuItems,
      onClick: onClick,
    });

    return this;
  }

  addForbidQueueOption(params: { permissionLevel: Types.Permission; isChannelForbidQueue: boolean }, onClick: () => void): this {
    const { permissionLevel, isChannelForbidQueue } = params;

    this.options.push({
      id: 'forbid-queue',
      label: 'forbid-queue',
      icon: isChannelForbidQueue ? 'checked' : '',
      show: permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addControlQueueOption(params: { permissionLevel: Types.Permission; isQueueControlled: boolean }, onClick: () => void): this {
    const { permissionLevel, isQueueControlled } = params;

    this.options.push({
      id: 'control-queue',
      label: 'control-queue',
      icon: isQueueControlled ? 'checked' : '',
      show: permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });
    return this;
  }

  addIncreaseQueueTimeOption(params: { permissionLevel: Types.Permission; targetQueuePosition: number }, onClick: () => void): this {
    const { permissionLevel, targetQueuePosition } = params;

    this.options.push({
      id: 'increase-queue-time',
      label: 'increase-queue-time',
      show: targetQueuePosition === 0 && permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addMoveUpQueueOption(params: { permissionLevel: Types.Permission; targetQueuePosition: number }, onClick: () => void): this {
    const { permissionLevel, targetQueuePosition } = params;

    this.options.push({
      id: 'move-up-queue',
      label: 'move-up-queue',
      show: targetQueuePosition > 1 && permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addMoveDownQueueOption(params: { permissionLevel: Types.Permission; targetQueuePosition: number }, onClick: () => void): this {
    const { permissionLevel, targetQueuePosition } = params;

    this.options.push({
      id: 'move-down-queue',
      label: 'move-down-queue',
      show: targetQueuePosition > 0 && permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addRemoveFromQueueOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel } = params;

    this.options.push({
      id: 'remove-from-queue',
      label: 'remove-from-queue',
      show: permissionLevel >= Types.Permission.ChannelMod,
      onClick: onClick,
    });

    return this;
  }

  addClearQueueOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    const { permissionLevel } = params;

    this.options.push({
      id: 'clear-queue',
      label: 'clear-queue',
      show: permissionLevel >= Types.Permission.ChannelMod,
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
