export interface Translation {
  RPCHomePage: string;
  RPCFriendPage: string;
  RPCFriend: string;
  RPCJoinServer: string;
  RPCUser: string;
  RPCHome: string;
  RPCServer: string;
  online: string;
  dnd: string;
  idle: string;
  gn: string;
  home: string;
  game: string;
  live: string;
  friends: string;
  systemSettings: string;
  messageHistory: string;
  changeTheme: string;
  feedback: string;
  languageSelect: string;
  logout: string;
  exit: string;
  searchPlaceholder: string;
  recentVisits: string;
  myGroups: string;
  favoriteGroups: string;
  createGroup: string;
  personalExclusive: string;
  fileSizeError: string;
  fileTypeError: string;
  updateServerError: string;
  name: string;
  id: string;
  slogan: string;
  type: string;
  avatar: string;
  other: string;
  entertainment: string;
  level: string;
  creationTime: string;
  wealth: string;
  description: string;
  changeImage: string;
  inputAnnouncement: string;
  edit: string;
  preview: string;
  markdownSupport: string;
  members: string;
  memberInfo: string;
  identity: string;
  contribution: string;
  joinDate: string;
  moveToMyChannel: string;
  kickOut: string;
  block: string;
  memberManagement: string;
  inviteToBeMember: string;
  rightClickToProcess: string;
  accessPermission: string;
  publicGroup: string;
  semiPublicGroup: string;
  semiPublicGroupDescription: string;
  privateGroup: string;
  privateGroupDescription: string;
  applicants: string;
  applicationSettings: string;
  nickname: string;
  applicationDescription: string;
  blacklist: string;
  select: string;
  viewGroupInfo: string;
  announcement: string;
  memberApplicationManagement: string;
  blacklistManagement: string;
  confirm: string;
  cancel: string;
  next: string;
  previous: string;
  signaturePlaceholder: string;
  friendActive: string;
  editUser: string;
  createServer: string;
  editServer: string;
  deleteServer: string;
  createChannel: string;
  editChannel: string;
  deleteChannel: string;
  applyMember: string;
  applyFriend: string;
  directMessage: string;
  dialogAlert: string;
  dialogSuccess: string;
  dialogWarning: string;
  dialogError: string;
  dialogInfo: string;
  none: string;
  parentChannel: string;
  channelName: string;
  friendApply: string;
  friendLabel: string;
  friendSelectGroup: string;
  friendAddGroup: string;
  friendNote: string;
  max120content: string;
  sendRequest: string;
  selectGroupType: string;
  selectGroupTypeDescription: string;
  fillInfo: string;
  remainingGroup1: string;
  remainingGroup2: string;
  canNotReadImage: string;
  imageTooLarge: string;
  uploadAvatar: string;
  groupType: string;
  groupName: string;
  groupNamePlaceholder: string;
  groupSlogan: string;
  groupSloganPlaceholder: string;
  unknownUser: string;
  channel: string;
  category: string;
  channelPermission: string;
  channelPublic: string;
  channelPrivate: string;
  channelReadonly: string;
  serverApply: string;
  serverApplyNotice: string;
  serverApplyDescription: string;
  submit: string;
  unknownError: string;
  onLogin: string;
  account: string;
  pleaseInputAccount: string;
  password: string;
  pleaseInputPassword: string;
  rememberAccount: string;
  autoLogin: string;
  login: string;
  registerAccount: string;
  forgotPassword: string;
  passwordHint: string;
  confirmPassword: string;
  pleaseInputPasswordAgain: string;
  repeatInputPassword: string;
  pleaseInputNickname: string;
  nicknameHint: string;
  register: string;
  freeSpeech: string;
  takeMic: string;
  takenMic: string;
  mixing: string;
  with: string;
  in: string;
  chatWithMembers: string;
  warningDeleteChannel: string;
  add: string;
  delete: string;
  kick: string;
  addFriend: string;
  unknownChannel: string;
  micOrder: string;
  allChannel: string;
  inputMessage: string;
  messageInputBox: string;
  deleteFriend: string;
  searchFriend: string;
  guest: string;
  member: string;
  channelAdmin: string;
  channelManager: string;
  serverAdmin: string;
  serverOwner: string;
  eventStaff: string;
  official: string;
  yesterday: string;
}

export type LanguageKey = 'tw' | 'cn' | 'en' | 'jp' | 'ru';

export const translations: Record<LanguageKey, Translation> = {
  tw: {
    RPCHomePage: '正在瀏覽主頁',
    RPCFriendPage: '正在瀏覽好友列表',
    RPCFriend: '好友列表',
    RPCJoinServer: '加入我們的Discord伺服器',
    RPCUser: '使用者:',
    RPCHome: '主頁',
    RPCServer: '群組聊天',
    online: '線上',
    dnd: '請勿打擾',
    idle: '閒置',
    gn: '離線',
    home: '首頁',
    game: '遊戲',
    live: '直播',
    friends: '好友',
    systemSettings: '系統設定',
    messageHistory: '訊息紀錄',
    changeTheme: '更換主題',
    feedback: '意見反饋',
    languageSelect: '語言選擇',
    logout: '登出',
    exit: '退出',
    searchPlaceholder: '輸入群ID或群名稱',
    recentVisits: '最近訪問',
    myGroups: '我的語音群',
    favoriteGroups: '收藏的語音群',
    createGroup: '創建語音群',
    personalExclusive: '個人專屬',
    fileSizeError: '檔案大小不能超過 5MB',
    fileTypeError: '不支援的檔案格式',
    updateServerError: '更新伺服器失敗',
    name: '名稱',
    id: 'ID',
    slogan: '口號',
    type: '類型',
    avatar: '頭像',
    other: '其他',
    entertainment: '娛樂',
    level: '等級',
    creationTime: '創建時間',
    wealth: '財富值',
    description: '介紹',
    changeImage: '更換新增圖像',
    inputAnnouncement: '輸入公告內容',
    edit: '編輯',
    preview: '預覽',
    markdownSupport:
      '支援 Markdown 語法：**粗體**, *斜體*, # 標題, - 列表, ```程式碼```, [連結](https://)',
    members: '會員',
    memberInfo: '會員資料',
    identity: '身分',
    contribution: '貢獻',
    joinDate: '入會時間',
    moveToMyChannel: '移至我的頻道',
    kickOut: '踢出群',
    block: '封鎖',
    memberManagement: '會員管理',
    inviteToBeMember: '邀請成為會員',
    rightClickToProcess: '右鍵可以進行處理',
    accessPermission: '訪問許可權',
    publicGroup: '公開群',
    semiPublicGroup: '半公開群',
    semiPublicGroupDescription: '(非會員只允許加入大廳)',
    privateGroup: '私密群',
    privateGroupDescription:
      '(該群只允許會員進入，不參與排行，只能通過ID搜索到)',
    applicants: '申請人數',
    applicationSettings: '申請設定',
    nickname: '暱稱',
    applicationDescription: '申請說明',
    blacklist: '黑名單',
    select: '勾選',
    viewGroupInfo: '查看群資料',
    announcement: '公告',
    memberApplicationManagement: '會員申請管理',
    blacklistManagement: '黑名單管理',
    confirm: '確定',
    cancel: '取消',
    next: '下一步',
    previous: '上一步',
    signaturePlaceholder: '點擊更改簽名',
    friendActive: '好友動態',
    editUser: '編輯使用者',
    createServer: '創建語音群',
    editServer: '編輯語音群',
    deleteServer: '刪除語音群',
    createChannel: '創建頻道',
    editChannel: '編輯頻道',
    deleteChannel: '刪除頻道',
    applyMember: '申請會員',
    applyFriend: '好友請求',
    directMessage: '私訊',
    dialogAlert: '警告',
    dialogSuccess: '成功',
    dialogWarning: '警告',
    dialogError: '錯誤',
    dialogInfo: '資訊',
    none: '無',
    parentChannel: '上級頻道',
    channelName: '頻道名稱',
    friendApply: '好友申請已發送，正等待對方的確認！',
    friendLabel: '您將添加以下聯絡人',
    friendSelectGroup: '選擇分組：',
    friendAddGroup: '添加分組',
    friendNote: '附言：',
    max120content: '最多只能輸入120個字元',
    sendRequest: '傳送請求',
    selectGroupType: '選擇語音群類型',
    selectGroupTypeDescription: '請您選擇語音群類型',
    fillInfo: '填寫資料',
    remainingGroup1: '您還可以創建',
    remainingGroup2: '個群，創建之後不能刪除或轉讓',
    canNotReadImage: '無法讀取圖片',
    imageTooLarge: '圖片大小不能超過5MB',
    uploadAvatar: '更換頭像',
    groupType: '群類型',
    groupName: '群名稱',
    groupNamePlaceholder:
      '6-30個字元組成，首尾輸入的空格無效，不能包含不雅詞彙。',
    groupSlogan: '群口號',
    groupSloganPlaceholder: '0-30個字元，口號是您建立團隊的目標',
    unknownUser: '未知使用者',
    channel: '頻道',
    category: '類別',
    channelPermission: '頻道權限',
    channelPublic: '任何人可以訪問',
    channelPrivate: '禁止遊客訪問',
    channelReadonly: '唯讀',
    serverApply: '申請已送出，請等待管理員審核',
    serverApplyNotice: '申請須知',
    serverApplyDescription: '申請說明',
    submit: '送出',
    unknownError: '未知錯誤',
    onLogin: '登入中...',
    account: '帳號',
    pleaseInputAccount: '請輸入帳號',
    password: '密碼',
    pleaseInputPassword: '請輸入密碼',
    rememberAccount: '記住帳號',
    autoLogin: '自動登入',
    login: '登入',
    registerAccount: '註冊帳號',
    forgotPassword: '忘記密碼',
    passwordHint: '8-20位，區分大小寫',
    confirmPassword: '確認密碼',
    pleaseInputPasswordAgain: '請再次輸入密碼',
    repeatInputPassword: '重複輸入密碼',
    pleaseInputNickname: '請輸入暱稱',
    nicknameHint: '2-10位，支持中英文',
    register: '註冊',
    freeSpeech: '自由發言',
    takeMic: '拿麥發言',
    takenMic: '已拿麥',
    mixing: '混音',
    with: '與',
    in: '在',
    chatWithMembers: '位成員聊天',
    warningDeleteChannel: '確定要刪除此頻道嗎？',
    add: '新增',
    delete: '刪除',
    kick: '踢出',
    addFriend: '新增好友',
    unknownChannel: '未知頻道',
    micOrder: '麥序',
    allChannel: '所有頻道',
    inputMessage: '輸入訊息...',
    messageInputBox: '訊息輸入框',
    deleteFriend: '刪除好友',
    searchFriend: '搜尋好友',
    guest: '遊客',
    member: '會員',
    channelAdmin: '二級頻道管理員',
    channelManager: '頻道管理員',
    serverAdmin: '群管理員',
    serverOwner: '群創建者',
    eventStaff: '官方客服',
    official: '超級管理員',
    yesterday: '昨天',
  },
  cn: {
    RPCHomePage: '正在浏览主页',
    RPCFriendPage: '正在浏览好友列表',
    RPCFriend: '好友列表',
    RPCJoinServer: '加入我们的Discord服务器',
    RPCUser: '用户:',
    RPCHome: '主页',
    RPCServer: '群组聊天',
    online: '在线',
    dnd: '请勿打扰',
    idle: '空闲',
    gn: '离线',
    home: '首页',
    game: '游戏',
    live: '直播',
    friends: '好友',
    systemSettings: '系统设置',
    messageHistory: '消息记录',
    changeTheme: '更换主题',
    feedback: '意见反馈',
    languageSelect: '语言选择',
    logout: '登出',
    exit: '退出',
    searchPlaceholder: '输入群ID或群名称',
    recentVisits: '最近访问',
    myGroups: '我的语音群',
    favoriteGroups: '收藏的语音群',
    createGroup: '创建语音群',
    personalExclusive: '个人专属',
    fileSizeError: '文件大小不能超过 5MB',
    fileTypeError: '不支持的文件格式',
    updateServerError: '更新服务器失败',
    name: '名称',
    id: 'ID',
    slogan: '口号',
    type: '类型',
    avatar: '头像',
    other: '其他',
    entertainment: '娱乐',
    level: '等级',
    creationTime: '创建时间',
    wealth: '财富值',
    description: '介绍',
    changeImage: '更换图像',
    inputAnnouncement: '输入公告内容',
    edit: '编辑',
    preview: '预览',
    markdownSupport:
      '支持 Markdown 语法：**粗体**, *斜体*, # 标题, - 列表, ```代码```, [链接](https://)',
    members: '会员',
    memberInfo: '会员资料',
    identity: '身份',
    contribution: '贡献',
    joinDate: '入会时间',
    moveToMyChannel: '移至我的频道',
    kickOut: '踢出群',
    block: '封锁',
    memberManagement: '会员管理',
    inviteToBeMember: '邀请成为会员',
    rightClickToProcess: '右键可以进行处理',
    accessPermission: '访问权限',
    publicGroup: '公开群',
    semiPublicGroup: '半公开群',
    semiPublicGroupDescription: '(非会员只允许加入大厅)',
    privateGroup: '私密群',
    privateGroupDescription:
      '(该群只允许会员进入，不参与排行，只能通过ID搜索到)',
    applicants: '申请人数',
    applicationSettings: '申请设置',
    nickname: '昵称',
    applicationDescription: '申请说明',
    blacklist: '黑名单',
    select: '勾选',
    viewGroupInfo: '查看群资料',
    announcement: '公告',
    memberApplicationManagement: '会员申请管理',
    blacklistManagement: '黑名单管理',
    confirm: '确定',
    cancel: '取消',
    next: '下一步',
    previous: '上一步',
    signaturePlaceholder: '点击更改签名',
    friendActive: '好友动态',
    editUser: '编辑用户',
    createServer: '创建语音群',
    editServer: '编辑语音群',
    deleteServer: '删除语音群',
    createChannel: '创建频道',
    editChannel: '编辑频道',
    deleteChannel: '删除频道',
    applyMember: '申请会员',
    applyFriend: '好友请求',
    directMessage: '私信',
    dialogAlert: '警告',
    dialogSuccess: '成功',
    dialogWarning: '警告',
    dialogError: '错误',
    dialogInfo: '信息',
    none: '无',
    parentChannel: '上级频道',
    channelName: '频道名称',
    friendApply: '好友申请已发送，正等待对方的确认！',
    friendLabel: '您将添加以下联系人',
    friendSelectGroup: '选择分组：',
    friendAddGroup: '添加分组',
    friendNote: '附言：',
    max120content: '最多只能输入120个字符',
    sendRequest: '发送请求',
    selectGroupType: '选择语音群类型',
    selectGroupTypeDescription: '请选择语音群类型',
    fillInfo: '填写资料',
    remainingGroup1: '您还可以创建',
    remainingGroup2: '个群，创建之后不能删除或转让',
    canNotReadImage: '无法读取图片',
    imageTooLarge: '图片大小不能超过5MB',
    uploadAvatar: '更换头像',
    groupType: '群类型',
    groupName: '群名称',
    groupNamePlaceholder:
      '6-30个字符组成，首尾输入的空格无效，不能包含不雅词汇。',
    groupSlogan: '群口号',
    groupSloganPlaceholder: '0-30个字符，口号是您建立团队的目标',
    unknownUser: '未知用户',
    channel: '频道',
    category: '类别',
    channelPermission: '频道权限',
    channelPublic: '任何人可以访问',
    channelPrivate: '禁止游客访问',
    channelReadonly: '只读',
    serverApply: '申请已送出，请等待管理员审核',
    serverApplyNotice: '申请须知',
    serverApplyDescription: '申请说明',
    submit: '送出',
    unknownError: '未知错误',
    onLogin: '登录中...',
    account: '账号',
    pleaseInputAccount: '请输入账号',
    password: '密码',
    pleaseInputPassword: '请输入密码',
    rememberAccount: '记住账号',
    autoLogin: '自动登录',
    login: '登录',
    registerAccount: '注册账号',
    forgotPassword: '忘记密码',
    passwordHint: '8-20位，区分大小写',
    confirmPassword: '确认密码',
    pleaseInputPasswordAgain: '请再次输入密码',
    repeatInputPassword: '重复输入密码',
    pleaseInputNickname: '请输入昵称',
    nicknameHint: '2-10位，支持中英文',
    register: '注册',
    freeSpeech: '自由发言',
    takeMic: '拿麦发言',
    takenMic: '已拿麦',
    mixing: '混音',
    with: '与',
    in: '在',
    chatWithMembers: '位成员聊天',
    warningDeleteChannel: '确定要删除此频道吗？',
    add: '新增',
    delete: '删除',
    kick: '踢出',
    addFriend: '新增好友',
    unknownChannel: '未知频道',
    micOrder: '麦序',
    allChannel: '所有频道',
    inputMessage: '输入消息...',
    messageInputBox: '消息输入框',
    deleteFriend: '删除好友',
    searchFriend: '搜索好友',
    guest: '游客',
    member: '会员',
    channelAdmin: '二级频道管理员',
    channelManager: '频道管理员',
    serverAdmin: '群管理员',
    serverOwner: '群创建者',
    eventStaff: '官方客服',
    official: '超级管理员',
    yesterday: '昨天',
  },
  en: {
    RPCHomePage: 'Browsing Homepage',
    RPCFriendPage: 'Browsing Friend List',
    RPCFriend: 'Friend List',
    RPCJoinServer: 'Join our Discord server',
    RPCUser: 'User:',
    RPCHome: 'Home',
    RPCServer: 'Group Chat',
    online: 'Online',
    dnd: 'Do Not Disturb',
    idle: 'Idle',
    gn: 'Offline',
    home: 'Home',
    game: 'Game',
    live: 'Live',
    friends: 'Friends',
    systemSettings: 'System Settings',
    messageHistory: 'Message History',
    changeTheme: 'Change Theme',
    feedback: 'Feedback',
    languageSelect: 'Language Select',
    logout: 'Logout',
    exit: 'Exit',
    searchPlaceholder: 'Enter group ID or name',
    recentVisits: 'Recent Visits',
    myGroups: 'My Voice Groups',
    favoriteGroups: 'Favorite Voice Groups',
    createGroup: 'Create Voice Group',
    personalExclusive: 'Personal Exclusive',
    fileSizeError: 'File size cannot exceed 5MB',
    fileTypeError: 'Unsupported file format',
    updateServerError: 'Failed to update server',
    name: 'Name',
    id: 'ID',
    slogan: 'Slogan',
    type: 'Type',
    avatar: 'Avatar',
    other: 'Other',
    entertainment: 'Entertainment',
    level: 'Level',
    creationTime: 'Creation Time',
    wealth: 'Wealth',
    description: 'Description',
    changeImage: 'Change Image',
    inputAnnouncement: 'Input Announcement Content',
    edit: 'Edit',
    preview: 'Preview',
    markdownSupport:
      'Supports Markdown syntax: **bold**, *italic*, # heading, - list, ```code```, [link](https://)',
    members: 'Members',
    memberInfo: 'Member Info',
    identity: 'Identity',
    contribution: 'Contribution',
    joinDate: 'Join Date',
    moveToMyChannel: 'Move to My Channel',
    kickOut: 'Kick Out',
    block: 'Block',
    memberManagement: 'Member Management',
    inviteToBeMember: 'Invite to be Member',
    rightClickToProcess: 'Right-click to process',
    accessPermission: 'Access Permission',
    publicGroup: 'Public Group',
    semiPublicGroup: 'Semi-Public Group',
    semiPublicGroupDescription:
      '(Non-members are only allowed to join the lobby)',
    privateGroup: 'Private Group',
    privateGroupDescription:
      '(The group only allows members to enter, does not participate in rankings, and can only be searched by ID)',
    applicants: 'Applicants',
    applicationSettings: 'Application Settings',
    nickname: 'Nickname',
    applicationDescription: 'Application Description',
    blacklist: 'Blacklist',
    select: 'Select',
    viewGroupInfo: 'View Group Info',
    announcement: 'Announcement',
    memberApplicationManagement: 'Member Application Management',
    blacklistManagement: 'Blacklist Management',
    confirm: 'Confirm',
    cancel: 'Cancel',
    next: 'Next',
    previous: 'Previous',
    signaturePlaceholder: 'Click to change signature',
    friendActive: 'Friend Active',
    editUser: 'Edit User',
    createServer: 'Create Voice Group',
    editServer: 'Edit Voice Group',
    deleteServer: 'Delete Voice Group',
    createChannel: 'Create Channel',
    editChannel: 'Edit Channel',
    deleteChannel: 'Delete Channel',
    applyMember: 'Apply Member',
    applyFriend: 'Friend Request',
    directMessage: 'Direct Message',
    dialogAlert: 'Alert',
    dialogSuccess: 'Success',
    dialogWarning: 'Warning',
    dialogError: 'Error',
    dialogInfo: 'Info',
    none: 'None',
    parentChannel: 'Parent Channel',
    channelName: 'Channel Name',
    friendApply: 'Friend request sent, waiting for confirmation!',
    friendLabel: 'You will add the following contact',
    friendSelectGroup: 'Select group:',
    friendAddGroup: 'Add group',
    friendNote: 'Note:',
    max120content: 'You can enter up to 120 characters',
    sendRequest: 'Send request',
    selectGroupType: 'Select voice group type',
    selectGroupTypeDescription: 'Please select the type of voice group',
    fillInfo: 'Fill in the information',
    remainingGroup1: 'You can still create',
    remainingGroup2:
      'groups, once created, they cannot be deleted or transferred',
    canNotReadImage: 'Cannot read image',
    imageTooLarge: 'Image size cannot exceed 5MB',
    uploadAvatar: 'Upload avatar',
    groupType: 'Group type',
    groupName: 'Group name',
    groupNamePlaceholder:
      '6-30 characters, leading and trailing spaces are invalid, and cannot contain obscene words.',
    groupSlogan: 'Group slogan',
    groupSloganPlaceholder: '0-30 characters, the slogan is your team goal',
    unknownUser: 'Unknown user',
    channel: 'Channel',
    category: 'Category',
    channelPermission: 'Channel permission',
    channelPublic: 'Anyone can access',
    channelPrivate: 'No guest access',
    channelReadonly: 'Read-only',
    serverApply: 'Application submitted, please wait for admin review',
    serverApplyNotice: 'Application notice',
    serverApplyDescription: 'Application description',
    submit: 'Submit',
    unknownError: 'Unknown error',
    onLogin: 'Logging in...',
    account: 'Account',
    pleaseInputAccount: 'Please enter account',
    password: 'Password',
    pleaseInputPassword: 'Please enter password',
    rememberAccount: 'Remember account',
    autoLogin: 'Auto login',
    login: 'Login',
    registerAccount: 'Register account',
    forgotPassword: 'Forgot password',
    passwordHint: '8-20 characters, case sensitive',
    confirmPassword: 'Confirm password',
    pleaseInputPasswordAgain: 'Please enter password again',
    repeatInputPassword: 'Repeat password',
    pleaseInputNickname: 'Please enter nickname',
    nicknameHint: '2-10 characters, supports Chinese and English',
    register: 'Register',
    freeSpeech: 'Free speech',
    takeMic: 'Take mic',
    takenMic: 'Mic taken',
    mixing: 'Mixing',
    with: 'with',
    in: 'in',
    chatWithMembers: 'members chatting',
    warningDeleteChannel: 'Are you sure you want to delete this channel?',
    add: 'Add',
    delete: 'Delete',
    kick: 'Kick',
    addFriend: 'Add friend',
    unknownChannel: 'Unknown channel',
    micOrder: 'Mic order',
    allChannel: 'All channels',
    inputMessage: 'Input message...',
    messageInputBox: 'Message input box',
    deleteFriend: 'Delete friend',
    searchFriend: 'Search friend',
    guest: 'Guest',
    member: 'Member',
    channelAdmin: 'Channel admin',
    channelManager: 'Channel manager',
    serverAdmin: 'Server admin',
    serverOwner: 'Server owner',
    eventStaff: 'Event staff',
    official: 'Official',
    yesterday: 'Yesterday',
  },
  jp: {
    RPCHomePage: 'ホームページを閲覧中',
    RPCFriendPage: '友達リストを閲覧中',
    RPCFriend: '友達リスト',
    RPCJoinServer: 'Discordサーバーに参加する',
    RPCUser: 'ユーザー:',
    RPCHome: 'ホーム',
    RPCServer: 'グループチャット',
    online: 'オンライン',
    dnd: '取り込み中',
    idle: 'アイドル',
    gn: 'オフライン',
    home: 'ホーム',
    game: 'ゲーム',
    live: 'ライブ',
    friends: '友達',
    systemSettings: 'システム設定',
    messageHistory: 'メッセージ履歴',
    changeTheme: 'テーマを変更',
    feedback: 'フィードバック',
    languageSelect: '言語選択',
    logout: 'ログアウト',
    exit: '終了',
    searchPlaceholder: 'グループIDまたは名前を入力',
    recentVisits: '最近の訪問',
    myGroups: '私のボイスグループ',
    favoriteGroups: 'お気に入りのボイスグループ',
    createGroup: 'ボイスグループを作成',
    personalExclusive: '個人専用',
    fileSizeError: 'ファイルサイズは5MBを超えることはできません',
    fileTypeError: 'サポートされていないファイル形式',
    updateServerError: 'サーバーの更新に失敗しました',
    name: '名前',
    id: 'ID',
    slogan: 'スローガン',
    type: 'タイプ',
    avatar: 'アバター',
    other: 'その他',
    entertainment: 'エンターテインメント',
    level: 'レベル',
    creationTime: '作成時間',
    wealth: '富',
    description: '説明',
    changeImage: '画像を変更',
    inputAnnouncement: 'アナウンス内容を入力',
    edit: '編集',
    preview: 'プレビュー',
    markdownSupport:
      'Markdown構文をサポート：**太字**, *斜体*, # 見出し, - リスト, ```コード```, [リンク](https://)',
    members: 'メンバー',
    memberInfo: 'メンバー情報',
    identity: 'アイデンティティ',
    contribution: '貢献',
    joinDate: '参加日',
    moveToMyChannel: '私のチャンネルに移動',
    kickOut: '追い出す',
    block: 'ブロック',
    memberManagement: 'メンバー管理',
    inviteToBeMember: 'メンバーに招待',
    rightClickToProcess: '右クリックで処理',
    accessPermission: 'アクセス許可',
    publicGroup: '公開グループ',
    semiPublicGroup: '半公開グループ',
    semiPublicGroupDescription: '(非メンバーはロビーにのみ参加できます)',
    privateGroup: 'プライベートグループ',
    privateGroupDescription:
      '(グループはメンバーのみが参加でき、ランキングには参加せず、IDでのみ検索できます)',
    applicants: '応募者',
    applicationSettings: 'アプリケーション設定',
    nickname: 'ニックネーム',
    applicationDescription: 'アプリケーションの説明',
    blacklist: 'ブラックリスト',
    select: '選択',
    viewGroupInfo: 'グループ情報を表示',
    announcement: 'アナウンス',
    memberApplicationManagement: 'メンバーアプリケーション管理',
    blacklistManagement: 'ブラックリスト管理',
    confirm: '確認',
    cancel: 'キャンセル',
    next: '次へ',
    previous: '前へ',
    signaturePlaceholder: 'クリックして署名を変更',
    friendActive: '友達のアクティブ',
    editUser: 'ユーザーを編集',
    createServer: 'ボイスグループを作成',
    editServer: 'ボイスグループを編集',
    deleteServer: 'ボイスグループを削除',
    createChannel: 'チャンネルを作成',
    editChannel: 'チャンネルを編集',
    deleteChannel: 'チャンネルを削除',
    applyMember: 'メンバーを申請',
    applyFriend: '友達リクエスト',
    directMessage: 'ダイレクトメッセージ',
    dialogAlert: '警告',
    dialogSuccess: '成功',
    dialogWarning: '警告',
    dialogError: 'エラー',
    dialogInfo: '情報',
    none: 'なし',
    parentChannel: '親チャンネル',
    channelName: 'チャンネル名',
    friendApply: '友達リクエストが送信されました。確認を待っています！',
    friendLabel: '次の連絡先を追加します',
    friendSelectGroup: 'グループを選択：',
    friendAddGroup: 'グループを追加',
    friendNote: 'メモ：',
    max120content: '最大120文字まで入力できます',
    sendRequest: 'リクエストを送信',
    selectGroupType: 'ボイスグループの種類を選択',
    selectGroupTypeDescription: 'ボイスグループの種類を選択してください',
    fillInfo: '情報を入力',
    remainingGroup1: 'まだ作成できます',
    remainingGroup2: 'グループ、作成後は削除または譲渡できません',
    canNotReadImage: '画像を読み取れません',
    imageTooLarge: '画像サイズは5MBを超えることはできません',
    uploadAvatar: 'アバターをアップロード',
    groupType: 'グループの種類',
    groupName: 'グループ名',
    groupNamePlaceholder:
      '6〜30文字、先頭と末尾のスペースは無効で、不適切な言葉を含めることはできません。',
    groupSlogan: 'グループのスローガン',
    groupSloganPlaceholder: '0〜30文字、スローガンはチームの目標です',
    unknownUser: '不明なユーザー',
    channel: 'チャンネル',
    category: 'カテゴリー',
    channelPermission: 'チャンネルの権限',
    channelPublic: '誰でもアクセス可能',
    channelPrivate: 'ゲストアクセス禁止',
    channelReadonly: '読み取り専用',
    serverApply: '申請が送信されました。管理者のレビューをお待ちください',
    serverApplyNotice: '申請通知',
    serverApplyDescription: '申請の説明',
    submit: '送信',
    unknownError: '不明なエラー',
    onLogin: 'ログイン中...',
    account: 'アカウント',
    pleaseInputAccount: 'アカウントを入力してください',
    password: 'パスワード',
    pleaseInputPassword: 'パスワードを入力してください',
    rememberAccount: 'アカウントを記憶',
    autoLogin: '自動ログイン',
    login: 'ログイン',
    registerAccount: 'アカウントを登録',
    forgotPassword: 'パスワードを忘れた',
    passwordHint: '8〜20文字、大文字と小文字を区別',
    confirmPassword: 'パスワードを確認',
    pleaseInputPasswordAgain: 'もう一度パスワードを入力してください',
    repeatInputPassword: 'パスワードを繰り返し入力',
    pleaseInputNickname: 'ニックネームを入力してください',
    nicknameHint: '2〜10文字、中国語と英語をサポート',
    register: '登録',
    freeSpeech: '自由な発言',
    takeMic: 'マイクを取る',
    takenMic: 'マイクを取った',
    mixing: 'ミキシング',
    with: 'と',
    in: 'で',
    chatWithMembers: 'メンバーとチャット',
    warningDeleteChannel: 'このチャンネルを削除してもよろしいですか？',
    add: '追加',
    delete: '削除',
    kick: 'キック',
    addFriend: '友達を追加',
    unknownChannel: '不明なチャンネル',
    micOrder: 'マイクの順序',
    allChannel: 'すべてのチャンネル',
    inputMessage: 'メッセージを入力...',
    messageInputBox: 'メッセージ入力ボックス',
    deleteFriend: '友達を削除',
    searchFriend: '友達を検索',
    guest: 'ゲスト',
    member: 'メンバー',
    channelAdmin: 'チャンネル管理者',
    channelManager: 'チャンネルマネージャー',
    serverAdmin: 'サーバー管理者',
    serverOwner: 'グループ作成者',
    eventStaff: '公式カスタマーサービス',
    official: 'スーパー管理者',
    yesterday: '昨日',
  },
  ru: {
    RPCHomePage: 'Просмотр главной страницы',
    RPCFriendPage: 'Просмотр списка друзей',
    RPCFriend: 'Список друзей',
    RPCJoinServer: 'Присоединяйтесь к нашему Discord',
    RPCUser: 'Пользователь:',
    RPCHome: 'Главная',
    RPCServer: 'Групповой чат',
    online: 'Онлайн',
    dnd: 'Не беспокоить',
    idle: 'Не активен',
    gn: 'Оффлайн',
    home: 'Главная',
    game: 'Игры',
    live: 'Прямой эфир',
    friends: 'Друзья',
    systemSettings: 'Системные настройки',
    messageHistory: 'История сообщений',
    changeTheme: 'Сменить тему',
    feedback: 'Обратная связь',
    languageSelect: 'Выбор языка',
    logout: 'Выйти',
    exit: 'Выход',
    searchPlaceholder: 'Введите ID группы или название',
    recentVisits: 'Недавние посещения',
    myGroups: 'Мои голосовые группы',
    favoriteGroups: 'Избранные голосовые группы',
    createGroup: 'Создать голосовую группу',
    personalExclusive: 'Личное',
    fileSizeError: 'Размер файла не может превышать 5 МБ',
    fileTypeError: 'Неподдерживаемый формат файла',
    updateServerError: 'Не удалось обновить сервер',
    name: 'Имя',
    id: 'ID',
    slogan: 'Слоган',
    type: 'Тип',
    avatar: 'Аватар',
    other: 'Другое',
    entertainment: 'Развлечение',
    level: 'Уровень',
    creationTime: 'Время создания',
    wealth: 'Богатство',
    description: 'Описание',
    changeImage: 'Изменить изображение',
    inputAnnouncement: 'Введите содержание объявления',
    edit: 'Редактировать',
    preview: 'Предварительный просмотр',
    markdownSupport:
      'Поддерживает синтаксис Markdown: **жирный**, *курсив*, # заголовок, - список, ```код```, [ссылка](https://)',
    members: 'Члены',
    memberInfo: 'Информация о членах',
    identity: 'Идентичность',
    contribution: 'Вклад',
    joinDate: 'Дата вступления',
    moveToMyChannel: 'Переместить в мой канал',
    kickOut: 'Выгнать',
    block: 'Заблокировать',
    memberManagement: 'Управление членами',
    inviteToBeMember: 'Пригласить стать членом',
    rightClickToProcess: 'Щелкните правой кнопкой мыши для обработки',
    accessPermission: 'Разрешение на доступ',
    publicGroup: 'Публичная группа',
    semiPublicGroup: 'Полупубличная группа',
    semiPublicGroupDescription:
      '(Не члены могут присоединиться только к лобби)',
    privateGroup: 'Частная группа',
    privateGroupDescription:
      '(Группа допускает только членов, не участвует в рейтингах и может быть найдена только по ID)',
    applicants: 'Заявители',
    applicationSettings: 'Настройки приложения',
    nickname: 'Псевдоним',
    applicationDescription: 'Описание заявки',
    blacklist: 'Черный список',
    select: 'Выбрать',
    viewGroupInfo: 'Просмотр информации о группе',
    announcement: 'Объявление',
    memberApplicationManagement: 'Управление заявками на членство',
    blacklistManagement: 'Управление черным списком',
    confirm: 'Подтвердить',
    cancel: 'Отмена',
    next: 'Далее',
    previous: 'Назад',
    signaturePlaceholder: 'Нажмите, чтобы изменить подпись',
    friendActive: 'Активность друзей',
    editUser: 'Редактировать пользователя',
    createServer: 'Создать голосовую группу',
    editServer: 'Редактировать голосовую группу',
    deleteServer: 'Удалить голосовую группу',
    createChannel: 'Создать канал',
    editChannel: 'Редактировать канал',
    deleteChannel: 'Удалить канал',
    applyMember: 'Применить участника',
    applyFriend: 'Запрос друга',
    directMessage: 'Личное сообщение',
    dialogAlert: 'Предупреждение',
    dialogSuccess: 'Успех',
    dialogWarning: 'Предупреждение',
    dialogError: 'Ошибка',
    dialogInfo: 'Информация',
    none: 'Нет',
    parentChannel: 'Родительский канал',
    channelName: 'Название канала',
    friendApply:
      'Запрос на добавление в друзья отправлен, ожидается подтверждение!',
    friendLabel: 'Вы добавите следующий контакт',
    friendSelectGroup: 'Выберите группу:',
    friendAddGroup: 'Добавить группу',
    friendNote: 'Примечание:',
    max120content: 'Можно ввести до 120 символов',
    sendRequest: 'Отправить запрос',
    selectGroupType: 'Выберите тип голосовой группы',
    selectGroupTypeDescription: 'Пожалуйста, выберите тип голосовой группы',
    fillInfo: 'Заполните информацию',
    remainingGroup1: 'Вы все еще можете создать',
    remainingGroup2: 'группы, после создания их нельзя удалить или передать',
    canNotReadImage: 'Не удается прочитать изображение',
    imageTooLarge: 'Размер изображения не может превышать 5 МБ',
    uploadAvatar: 'Загрузить аватар',
    groupType: 'Тип группы',
    groupName: 'Название группы',
    groupNamePlaceholder:
      '6-30 символов, начальные и конечные пробелы недействительны и не могут содержать непристойных слов.',
    groupSlogan: 'Слоган группы',
    groupSloganPlaceholder: '0-30 символов, слоган - это цель вашей команды',
    unknownUser: 'Неизвестный пользователь',
    channel: 'Канал',
    category: 'Категория',
    channelPermission: 'Разрешение на канал',
    channelPublic: 'Доступен для всех',
    channelPrivate: 'Нет доступа для гостей',
    channelReadonly: 'Только для чтения',
    serverApply:
      'Заявка отправлена, пожалуйста, дождитесь проверки администратора',
    serverApplyNotice: 'Уведомление о заявке',
    serverApplyDescription: 'Описание заявки',
    submit: 'Отправить',
    unknownError: 'Неизвестная ошибка',
    onLogin: 'Вход...',
    account: 'Аккаунт',
    pleaseInputAccount: 'Пожалуйста, введите аккаунт',
    password: 'Пароль',
    pleaseInputPassword: 'Пожалуйста, введите пароль',
    rememberAccount: 'Запомнить аккаунт',
    autoLogin: 'Автоматический вход',
    login: 'Войти',
    registerAccount: 'Зарегистрировать аккаунт',
    forgotPassword: 'Забыли пароль',
    passwordHint: '8-20 символов, чувствительных к регистру',
    confirmPassword: 'Подтвердите пароль',
    pleaseInputPasswordAgain: 'Пожалуйста, введите пароль еще раз',
    repeatInputPassword: 'Повторите ввод пароля',
    pleaseInputNickname: 'Пожалуйста, введите псевдоним',
    nicknameHint: '2-10 символов, поддерживает китайский и английский',
    register: 'Зарегистрироваться',
    freeSpeech: 'Свободная речь',
    takeMic: 'Взять микрофон',
    takenMic: 'Микрофон взят',
    mixing: 'Смешивание',
    with: 'с',
    in: 'в',
    chatWithMembers: 'члены чата',
    warningDeleteChannel: 'Вы уверены, что хотите удалить этот канал?',
    add: 'Добавить',
    delete: 'Удалить',
    kick: 'Выгнать',
    addFriend: 'Добавить друга',
    unknownChannel: 'Неизвестный канал',
    micOrder: 'Порядок микрофонов',
    allChannel: 'Все каналы',
    inputMessage: 'Введите сообщение...',
    messageInputBox: 'Поле ввода сообщения',
    deleteFriend: 'Удалить друга',
    searchFriend: 'Поиск друга',
    guest: 'Гость',
    member: 'Член',
    channelAdmin: 'Администратор канала',
    channelManager: 'Менеджер канала',
    serverAdmin: 'Администратор сервера',
    serverOwner: 'Создатель группы',
    eventStaff: 'Официальная поддержка',
    official: 'Супер администратор',
    yesterday: 'Вчера',
  },
};

export type Visibility = 'public' | 'private' | 'readonly';
export const enum Permission {
  Guest = 1,
  Member = 2,
  ChannelAdmin = 3,
  ChannelManager = 4,
  ServerAdmin = 5,
  ServerOwner = 6,
  EventStaff = 7,
  Official = 8,
}

export interface User {
  id: string;
  name: string;
  avatar: string | null;
  avatarUrl: string | null;
  signature: string;
  status: 'online' | 'dnd' | 'idle' | 'gn';
  gender: 'Male' | 'Female';
  level: number;
  xp: number;
  requiredXp: number;
  progress: number;
  currentChannelId: string;
  currentServerId: string;
  lastActiveAt: number;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  members?: Member[];
  badges?: Badge[];
  friends?: Friend[];
  friendGroups?: FriendGroup[];
  friendApplications?: FriendApplication[];
  recentServers?: Server[];
  ownedServers?: Server[];
  favServers?: Server[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Friend {
  id: string;
  isBlocked: boolean;
  groupId: string;
  user1Id: string;
  user2Id: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  user?: User;
  directMessages?: DirectMessage[];
}

export interface FriendGroup {
  id: string;
  name: string;
  order: number;
  userId: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  friends?: Friend[];
}

export interface FriendApplication {
  id: string;
  senderId: string;
  receiverId: string;
  description: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
}

export interface Member {
  id: string;
  isBlocked: boolean;
  nickname: string;
  contribution: number;
  permissionLevel: Permission;
  userId: string;
  serverId: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  user: User | null;
}

export interface Server {
  id: string;
  name: string;
  avatar: string | null;
  avatarUrl: string | null;
  announcement: string;
  description: string;
  type: string;
  displayId: string;
  slogan: string;
  level: number;
  wealth: number; // 財富值，但不知道是做什麼用的
  lobbyId: string;
  ownerId: string;
  settings: {
    allowDirectMessage: boolean;
    visibility: 'public' | 'private' | 'invisible';
    defaultChannelId: string;
  };
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  lobby?: Channel;
  owner?: User;
  users?: User[];
  channels?: Channel[];
  applications?: ServerApplication[];
  members?: {
    [userId: string]: Member;
  };
}

export interface ServerApplication {
  id: string;
  description: string;
  userId: string;
  serverId: string;
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  user: User | null;
}

export interface Channel {
  id: string;
  name: string;
  isRoot: boolean;
  isCategory: boolean;
  isLobby: boolean;
  voiceMode: 'free' | 'queue' | 'forbidden';
  chatMode: 'free' | 'forbidden';
  order: number;
  serverId: string;
  settings: {
    bitrate: number;
    slowmode: boolean;
    userLimit: number;
    visibility: Visibility;
  };
  createdAt: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  subChannels?: Channel[];
  messages?: Message[];
  users?: User[];
  rtcConnections?: string[];
}

export interface voicePresences {
  id: string;
  username: string;
  isSpeaker: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
}

export interface Message {
  id: string;
  content: string;
  type: 'general' | 'info';
  permissionLevel: Permission;
  senderId: string;
  channelId: string;
  timestamp: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  sender?: User | null;
}

export interface DirectMessage {
  id: string;
  content: string;
  type: 'general' | 'info';
  senderId: string;
  friendId: string;
  timestamp: number;
  // THESE WERE NOT SAVE IN THE DATABASE
  sender?: User | null;
}

export interface ModalTabItem {
  id: string;
  label: string;
  onClick: () => void;
}
export interface ModalButton {
  label: string;
  type?: 'submit';
  style: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
}

export interface ContextMenuItem {
  id?: string;
  label: string;
  show?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export interface Emoji {
  id: number;
  alt: string;
  path: string;
}

export interface discordPresence {
  details: string;
  state: string;
  largeImageKey: string;
  largeImageText: string;
  smallImageKey: string;
  smallImageText: string;
  timestamp: number;
  buttons: {
    label: string;
    url: string;
  }[];
}

export enum SocketClientEvent {
  SEARCH_USER = 'searchUser',
  CONNECT_USER = 'connectUser',
  DISCONNECT_USER = 'disconnectUser',
  REFRESH_USER = 'refreshUser',
  UPDATE_USER = 'updateUser',
  SEARCH_SERVER = 'searchServer',
  CONNECT_SERVER = 'connectServer',
  DISCONNECT_SERVER = 'disconnectServer',
  CREATE_SERVER = 'createServer',
  UPDATE_SERVER = 'updateServer',
  DELETE_SERVER = 'deleteServer',
  UPDATE_MEMBER = 'updateMember',
  CONNECT_CHANNEL = 'connectChannel',
  DISCONNECT_CHANNEL = 'disconnectChannel',
  CREATE_CHANNEL = 'createChannel',
  UPDATE_CHANNEL = 'updateChannel',
  DELETE_CHANNEL = 'deleteChannel',
  SEND_MESSAGE = 'message',
  SEND_DIRECT_MESSAGE = 'directMessage',
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
}

export enum SocketServerEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  NOTIFICATION = 'notification', // not used yet
  USER_CONNECT = 'userConnect', // deprecated
  USER_DISCONNECT = 'userDisconnect', // deprecated
  USER_UPDATE = 'userUpdate',
  SERVER_SEARCH = 'serverSearch',
  SERVER_CONNECT = 'serverConnect',
  SERVER_DISCONNECT = 'serverDisconnect',
  SERVER_UPDATE = 'serverUpdate',
  CHANNEL_CONNECT = 'channelConnect',
  CHANNEL_DISCONNECT = 'channelDisconnect',
  CHANNEL_UPDATE = 'channelUpdate',
  ERROR = 'error',
  RTC_CONNECT = 'RTCConnect',
  RTC_OFFER = 'RTCOffer',
  RTC_ANSWER = 'RTCAnswer',
  RTC_ICE_CANDIDATE = 'RTCIceCandidate',
  RTC_JOIN = 'RTCJoin',
  RTC_LEAVE = 'RTCLeave',
}

export enum popupType {
  CREATE_SERVER = 'createServer',
  EDIT_SERVER = 'editServer',
  DELETE_SERVER = 'deleteServer',
  CREATE_CHANNEL = 'createChannel',
  EDIT_CHANNEL = 'editChannel',
  DELETE_CHANNEL = 'deleteChannel',
  EDIT_USER = 'editUser',
  APPLY_MEMBER = 'applyMember',
  APPLY_FRIEND = 'applyFriend',
  DIRECT_MESSAGE = 'directMessage',
  DIALOG_ALERT = 'dialogAlert',
  DIALOG_ALERT2 = 'dialogAlert2',
  DIALOG_SUCCESS = 'dialogSuccess',
  DIALOG_WARNING = 'dialogWarning',
  DIALOG_ERROR = 'dialogError',
  DIALOG_INFO = 'dialogInfo',
}
