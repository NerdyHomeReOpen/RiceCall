// AccountRecover 測試相關類型定義

export interface AccountRecoverData {
  userId: string;
  resetToken: string;
  tried: number;
}

export interface AccountData {
  userId: string;
  account: string;
  password: string;
}

export interface UserData {
  userId: string;
  name: string;
  lastActiveAt: number;
}

export interface RequestAccountRecoverInput {
  account: string;
}

export interface ResetPasswordInput {
  userId: string;
  resetToken: string;
  newPassword: string;
}

export interface MockInstances {
  mockDataValidator: any;
  mockDatabase: any;
  mockLogger: any;
  mockBcrypt: any;
  mockSendEmail: any;
  mockGenerateRandomString: any;
}
