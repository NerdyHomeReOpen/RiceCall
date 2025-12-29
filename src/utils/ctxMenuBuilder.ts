import type * as Types from '@/types';

import * as Permission from '@/utils/permission';

export default class ContextMenuClass {
  private options: Types.ContextMenuItem[] = [];

  addSeparator(): this {
    this.options.push({
      id: 'separator',
      label: '',
    });
    return this;
  }

  addJoinChannelOption(params: { canJoin: boolean; isInChannel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'join-channel',
      label: 'join-channel',
      show: params.canJoin,
      disabled: params.isInChannel,
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
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addCreateSubChannelOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'create-sub-channel',
      label: 'create-sub-channel',
      show: Permission.isChannelAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addDeleteChannelOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'delete-channel',
      label: 'delete-channel',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addBroadcastOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'broadcast',
      label: 'broadcast',
      show: Permission.isChannelAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addMoveAllUserToChannelOption(params: { isInChannel: boolean; currentPermissionLevel: Types.Permission; permissionLevel: Types.Permission; movableUserIds: string[] }, onClick: () => void): this {
    this.options.push({
      id: 'move-all-user-to-channel',
      label: 'move-all-user-to-channel',
      show: !params.isInChannel && Permission.isChannelMod(params.currentPermissionLevel) && Permission.isChannelMod(params.permissionLevel) && params.movableUserIds.length > 0,
      onClick: onClick,
    });
    return this;
  }

  addEditChannelOrderOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'edit-channel-order',
      label: 'edit-channel-order',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addKickChannelUsersFromServerOption(params: { permissionLevel: Types.Permission; movableUserIds: string[] }, onClick: () => void): this {
    this.options.push({
      id: 'kick-channel-users-from-server',
      label: 'kick-channel-users-from-server',
      show: params.movableUserIds.length > 0 && Permission.isStaff(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addKickAllUsersFromServerOption(params: { permissionLevel: Types.Permission; movableUserIds: string[] }, onClick: () => void): this {
    this.options.push({
      id: 'kick-all-users-from-server',
      label: 'kick-all-users-from-server',
      show: params.movableUserIds.length > 0 && Permission.isStaff(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addSetReceptionLobbyOption(params: { permissionLevel: Types.Permission; isPrivateChannel: boolean; isReadonlyChannel: boolean; isReceptionLobby: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'set-reception-lobby',
      label: 'set-reception-lobby',
      show: !params.isReceptionLobby && Permission.isServerAdmin(params.permissionLevel),
      disabled: params.isPrivateChannel || params.isReadonlyChannel,
      onClick: onClick,
    });
    return this;
  }

  addApplyMemberOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'apply-member',
      label: 'apply-member',
      show: !Permission.isMember(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addServerSettingOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'member-management',
      label: 'member-management',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addEditNicknameOption(params: { permissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'edit-nickname',
      label: 'edit-nickname',
      show: (params.isSelf || (Permission.isServerAdmin(params.permissionLevel) && params.isSuperior)) && Permission.isMember(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addLocateMeOption(onClick: () => void): this {
    this.options.push({
      id: 'locate-me',
      label: 'locate-me',
      onClick: onClick,
    });
    return this;
  }

  addReportOption(onClick: () => void): this {
    this.options.push({
      id: 'report',
      label: 'report',
      onClick: onClick,
    });
    return this;
  }

  addFavoriteServerOption(params: { isFavorite: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'favorite-server',
      label: params.isFavorite ? 'unfavorite' : 'favorite',
      onClick: onClick,
    });
    return this;
  }

  addSystemSettingOption(onClick: () => void): this {
    this.options.push({
      id: 'system-setting',
      label: 'system-setting',
      onClick: onClick,
    });
    return this;
  }

  addChangeThemeOption(onClick: () => void): this {
    this.options.push({
      id: 'change-theme',
      label: 'change-theme',
      onClick: onClick,
    });
    return this;
  }

  addFeedbackOption(onClick: () => void): this {
    this.options.push({
      id: 'feedback',
      label: 'feedback',
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
        { id: 'about-us', label: 'about-us', onClick: params.onAboutUsClick },
      ],
      onClick: onClick,
    });
    return this;
  }

  addFAQOption(onClick: () => void): this {
    this.options.push({
      id: 'faq',
      label: 'faq',
      onClick: onClick,
    });
    return this;
  }

  addAgreementOption(onClick: () => void): this {
    this.options.push({
      id: 'agreement',
      label: 'agreement',
      onClick: onClick,
    });
    return this;
  }

  addSpecificationOption(onClick: () => void): this {
    this.options.push({
      id: 'specification',
      label: 'specification',
      onClick: onClick,
    });
    return this;
  }

  addContactUsOption(onClick: () => void): this {
    this.options.push({
      id: 'contact-us',
      label: 'contact-us',
      onClick: onClick,
    });
    return this;
  }
  addAboutUsOption(onClick: () => void): this {
    this.options.push({
      id: 'about-us',
      label: 'about-us',
      onClick: onClick,
    });
    return this;
  }

  addLogoutOption(onClick: () => void): this {
    this.options.push({
      id: 'logout',
      label: 'logout',
      onClick: onClick,
    });
    return this;
  }

  addExitOption(onClick: () => void): this {
    this.options.push({
      id: 'exit',
      label: 'exit',
      onClick: onClick,
    });
    return this;
  }

  addDirectMessageOption(params: { isSelf: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'direct-message',
      label: 'direct-message',
      show: !params.isSelf,
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

  addKickUserFromChannelOption(params: { permissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean; isInLobby: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'kick-channel',
      label: 'kick-channel',
      show: !params.isSelf && params.isSuperior && !params.isInLobby && Permission.isChannelMod(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addKickUserFromServerOption(params: { permissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'kick-server',
      label: 'kick-server',
      show: !params.isSelf && params.isSuperior && Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addBlockUserFromServerOption(params: { permissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'block',
      label: 'block',
      show: !params.isSelf && params.isSuperior && Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addUnblockUserFromServerOption(params: { permissionLevel: Types.Permission; isSelf: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'unblock-user-from-server',
      label: 'unblock-user-from-server',
      show: !params.isSelf && Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addUnblockUserFromChannelOption(params: { permissionLevel: Types.Permission; isSelf: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'unblock-user-from-channel',
      label: 'unblock-user-from-channel',
      show: !params.isSelf && Permission.isChannelAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addInviteToBeMemberOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'invite-to-be-member',
      label: 'invite-to-be-member',
      show: !params.isSelf && !Permission.isMember(params.targetPermissionLevel) && Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addMemberManagementOption(
    params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean; channelCategoryId: string | null },
    onClick: () => void,
    submenuItems: Types.ContextMenuItem[] = [],
  ): this {
    this.options.push({
      id: 'member-management',
      label: 'member-management',
      icon: 'submenu',
      show:
        !params.isSelf &&
        params.isSuperior &&
        Permission.isMember(params.targetPermissionLevel) &&
        (!!params.channelCategoryId ? Permission.isServerAdmin(params.permissionLevel) : Permission.isChannelAdmin(params.permissionLevel)),
      hasSubmenu: submenuItems.length > 0,
      submenuItems: submenuItems,
      onClick: onClick,
    });
    return this;
  }

  addTerminateMemberOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'terminate-member',
      label: 'terminate-member',
      show:
        !params.isSelf &&
        params.isSuperior &&
        Permission.isMember(params.targetPermissionLevel) &&
        !Permission.isServerOwner(params.targetPermissionLevel) &&
        Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addSetChannelModOption(
    params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean; channelCategoryId: string | null },
    onClick: () => void,
  ): this {
    this.options.push({
      id: 'set-channel-mod',
      label: Permission.isChannelMod(params.targetPermissionLevel) ? 'unset-channel-mod' : 'set-channel-mod',
      show: !!params.channelCategoryId && Permission.isChannelAdmin(params.permissionLevel) && !Permission.isChannelAdmin(params.targetPermissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addSetChannelAdminOption(
    params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean; channelCategoryId: string | null },
    onClick: () => void,
  ): this {
    this.options.push({
      id: 'set-channel-admin',
      label: Permission.isChannelAdmin(params.targetPermissionLevel) ? 'unset-channel-admin' : 'set-channel-admin',
      show: Permission.isServerAdmin(params.permissionLevel) && !Permission.isServerAdmin(params.targetPermissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addSetServerAdminOption(params: { permissionLevel: Types.Permission; targetPermissionLevel: Types.Permission; isSelf: boolean; isSuperior: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'set-server-admin',
      label: Permission.isServerAdmin(params.targetPermissionLevel) ? 'unset-server-admin' : 'set-server-admin',
      show: Permission.isServerOwner(params.permissionLevel) && !Permission.isServerOwner(params.targetPermissionLevel),
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

  addAddFriendOption(params: { isSelf: boolean; isFriend: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'add-friend',
      label: 'add-friend',
      show: !params.isSelf && !params.isFriend,
      onClick: onClick,
    });
    return this;
  }

  addEditNoteOption(params: { isSelf: boolean; isFriend: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'edit-note',
      label: 'edit-note',
      show: !params.isSelf && params.isFriend,
      onClick: onClick,
    });
    return this;
  }

  addPermissionSettingOption(params: { isSelf: boolean; isFriend: boolean; onHideOrShowOnlineClick: () => void; onNotifyFriendOnlineClick: () => void }, onClick: () => void): this {
    this.options.push({
      id: 'permission-setting',
      label: 'permission-setting',
      icon: 'submenu',
      show: !params.isSelf && params.isFriend,
      hasSubmenu: true,
      submenuItems: [
        { id: 'hide-online-to-friend', label: 'hide-online-to-friend', show: !params.isSelf && params.isFriend, onClick: params.onHideOrShowOnlineClick },
        { id: 'notify-friend-online', label: 'notify-friend-online', show: !params.isSelf && params.isFriend, onClick: params.onNotifyFriendOnlineClick },
      ],
      onClick: onClick,
    });
    return this;
  }

  addEditFriendFriendGroupOption(params: { isSelf: boolean; isStranger: boolean; isBlocked: boolean }, onClick: () => void, submenuItems: Types.ContextMenuItem[] = []): this {
    this.options.push({
      id: 'edit-friend-friend-group',
      label: 'edit-friend-friend-group',
      icon: 'submenu',
      show: !params.isSelf && !params.isStranger && !params.isBlocked,
      hasSubmenu: submenuItems.length > 0,
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

  addBlockUserOption(params: { isSelf: boolean; isBlocked: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'block',
      label: params.isBlocked ? 'unblock' : 'block',
      show: !params.isSelf,
      onClick: onClick,
    });
    return this;
  }

  addDeleteFriendOption(params: { isSelf: boolean; isFriend: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'delete-friend',
      label: 'delete-friend',
      show: !params.isSelf && params.isFriend,
      onClick: onClick,
    });
    return this;
  }

  addDeleteFriendApplicationOption(params: { isSelf: boolean; isPending: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'delete-friend-application',
      label: 'delete-friend-application',
      show: !params.isSelf && params.isPending,
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

  addTerminateSelfMembershipOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'terminate-self-membership',
      label: 'terminate-self-membership',
      show: Permission.isMember(params.permissionLevel) && !Permission.isServerOwner(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addJoinUserChannelOption(params: { isSelf: boolean; isInSameChannel: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'join-user-channel',
      label: 'join-user-channel',
      show: !params.isSelf && !params.isInSameChannel,
      onClick: onClick,
    });
    return this;
  }

  addAddToQueueOption(params: { isSelf: boolean; isEqualOrSuperior: boolean; isQueueMode: boolean; isInQueue: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'add-to-queue',
      label: 'add-to-queue',
      show: !params.isSelf && params.isEqualOrSuperior && params.isQueueMode,
      disabled: params.isInQueue,
      onClick: onClick,
    });
    return this;
  }

  addSetMuteOption(params: { isSelf: boolean; isMuted: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'set-mute',
      label: params.isMuted ? 'unmute' : 'mute',
      show: !params.isSelf,
      onClick: onClick,
    });
    return this;
  }

  addMoveToChannelOption(
    params: { currentPermissionLevel: Types.Permission; permissionLevel: Types.Permission; isSelf: boolean; isInSameChannel: boolean; isEqualOrSuperior: boolean },
    onClick: () => void,
  ): this {
    this.options.push({
      id: 'move-to-channel',
      label: 'move-to-channel',
      show: !params.isSelf && !params.isInSameChannel && params.isEqualOrSuperior && Permission.isChannelMod(params.currentPermissionLevel) && Permission.isChannelMod(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addForbidVoiceOption(params: { isSelf: boolean; isSuperior: boolean; isVoiceMuted: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'forbid-voice',
      label: params.isVoiceMuted ? 'unforbid-voice' : 'forbid-voice',
      show: !params.isSelf && params.isSuperior,
      onClick: onClick,
    });
    return this;
  }

  addForbidTextOption(params: { isSelf: boolean; isSuperior: boolean; isTextMuted: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'forbid-text',
      label: params.isTextMuted ? 'unforbid-text' : 'forbid-text',
      show: !params.isSelf && params.isSuperior,
      onClick: onClick,
    });
    return this;
  }

  addOpenAnnouncementOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'open-announcement',
      label: 'open-announcement',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addCloseAnnouncementOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'close-announcement',
      label: 'close-announcement',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addCleanUpMessageOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'clean-up-message',
      label: 'clean-up-message',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addOpenChannelEventOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'channel-event',
      label: 'channel-event',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addFreeSpeechOption(params: { permissionLevel: Types.Permission; isFreeMode: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'free-speech',
      label: 'free-speech',
      icon: params.isFreeMode ? 'checked' : '',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addAdminSpeechOption(params: { permissionLevel: Types.Permission; isAdminMode: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'admin-speech',
      label: 'admin-speech',
      icon: params.isAdminMode ? 'checked' : '',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addQueueSpeechOption(params: { permissionLevel: Types.Permission; isQueueMode: boolean }, onClick: () => void, submenuItems: Types.ContextMenuItem[] = []): this {
    this.options.push({
      id: 'queue-speech',
      label: 'queue-speech',
      icon: params.isQueueMode ? 'submenu' : '',
      show: Permission.isServerAdmin(params.permissionLevel),
      hasSubmenu: params.isQueueMode,
      submenuItems: submenuItems,
      onClick: onClick,
    });
    return this;
  }

  addForbidQueueOption(params: { permissionLevel: Types.Permission; isForbidQueue: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'forbid-queue',
      label: 'forbid-queue',
      icon: params.isForbidQueue ? 'checked' : '',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addControlQueueOption(params: { permissionLevel: Types.Permission; isQueueControlled: boolean }, onClick: () => void): this {
    this.options.push({
      id: 'control-queue',
      label: 'control-queue',
      icon: params.isQueueControlled ? 'checked' : '',
      show: Permission.isServerAdmin(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addIncreaseQueueTimeOption(params: { queuePosition: number; permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'increase-queue-time',
      label: 'increase-queue-time',
      show: params.queuePosition === 0 && Permission.isChannelMod(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addMoveUpQueueOption(params: { queuePosition: number; permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'move-up-queue',
      label: 'move-up-queue',
      show: params.queuePosition > 1 && Permission.isChannelMod(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addMoveDownQueueOption(params: { queuePosition: number; permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'move-down-queue',
      label: 'move-down-queue',
      show: params.queuePosition > 0 && Permission.isChannelMod(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addRemoveFromQueueOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'remove-from-queue',
      label: 'remove-from-queue',
      show: Permission.isChannelMod(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  addClearQueueOption(params: { permissionLevel: Types.Permission }, onClick: () => void): this {
    this.options.push({
      id: 'clear-queue',
      label: 'clear-queue',
      show: Permission.isChannelMod(params.permissionLevel),
      onClick: onClick,
    });
    return this;
  }

  build(): Types.ContextMenuItem[] {
    return this.options;
  }
}
