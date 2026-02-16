export type InsertRecordType = {
  userId: number;
  token: string;
  tokenExpiry: Date;
}

export type InsertReturnType = {
  error: boolean,
  message?: string
}

export type PasswordTokenRecordType = {
  token: string;
}

export type GetPasswordTokenReturnType = {
  error: boolean,
  message?: string,
  email?: string,
  tokenExpiry?: Date,
  isValidExpiry?: boolean
}

export type RemoveReturnType = {
  error: boolean,
  message?: string
}


