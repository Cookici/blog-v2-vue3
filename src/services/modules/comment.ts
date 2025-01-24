import { http } from '../http'
import type { CommentDTO, CommentPageQuery, CommentChildPageQuery, 
  CommentInsertCommand, CommentDeleteCommand,CommentUserPageQuery,CommentUserDTO } from '@/types/comment'
import type { PageDTO } from '@/services/types'

export const useCommentApi = {
  // 获取评论列表
  page(params: CommentPageQuery) {
    return http.get<PageDTO<CommentDTO>>('/comment/page', { params })
  },

  // 获取子评论列表
  pageChild(params: CommentChildPageQuery) {
    return http.get<PageDTO<CommentDTO>>('/comment/page_child', { params })
  },

  // 发表评论
  create(params: CommentInsertCommand) {
    return http.post('/comment/insert', params)
  },

  // 删除评论
  delete(params: CommentDeleteCommand) {
    return http.post('/comment/delete', params)
  },

  // 获取我的评论列表
  getMyComments(params: CommentUserPageQuery) {
    return http.get<PageDTO<CommentUserDTO>>('/comment/user/page', { params })
  }
} 