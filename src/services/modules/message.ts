import { http } from '../http'
import type { MessageVO, MessagePageQuery, MessageStatusCommand, MessageLastQuery } from '@/types/message'
import type { PageDTO } from '@/services/types'

export const useMessageApi = {
  // 获取消息历史
  page(params: MessagePageQuery) {
    return http.get<PageDTO<MessageVO>>('/message-netty/page', { params })
  },

  // 更改消息状态为已读
  changeStatus(params: MessageStatusCommand) {
    return http.post('/message-netty/change-status', params)
  },

  // 获取最后一条消息
  getLastMessage(params: MessageLastQuery) {
    return http.get<MessageVO>('/message-netty/last-message', { params })
  },

  // 获取离线消息数量
  getOfflineMessageCount(params: { userIds: string[], userId: string }) {
    return http.get<Record<string, number>>('/message-netty/offline/count', { params })
  }

} 