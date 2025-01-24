export interface MessageVO {
  messageId: string
  userId: string
  toUserId: string
  messageContent: string
  messageType: string
  messageStatus: string // online: 已读, offline: 未读
  timestamp: number
}

export interface MessageSend {
    userId: string
    toUserId: string
    messageContent: string
    messageType: string
    timestamp: number
  }


export interface MessagePageQuery {
  userId: string    // 当前用户ID
  toUserId: string  // 聊天对象ID
  pageNum: number
  pageSize: number
}

export interface MessageReqDTO {
  userId: string
  toUserId: string
  messageId: string
  timestamp: number
}

export interface MessageStatusCommand {
  messageReqDTOList: MessageReqDTO[]
}

export interface MessageLastQuery {
  userId: string    // 当前用户ID
  toUserId: string  // 聊天对象ID
}

export enum MessageType {
    PING = 'ping',
    PHOTO = 'photo',
    TEXT = 'text'
}
