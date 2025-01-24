import type { UserInfo } from './user'

export interface CommentDTO {
  commentId: string
  commentContent: string
  commentImg?: string
  parentCommentId: string
  commentList?: CommentDTO[]
  userId: string
  articleId: string
  createTime: string
  updateTime: string
  userInfo: UserInfo
  toUserInfo?: UserInfo
}


export interface CommentUserDTO {
  commentId: string
  commentContent: string
  commentImg?: string
  parentCommentId: string
  articleTitle: string
  userId: string
  articleId: string
  createTime: string
  updateTime: string
  userInfo: UserInfo
  toUserInfo?: UserInfo
}


export interface CommentPageQuery {
  articleId: string
  page: number
  pageSize: number
}

export interface CommentChildPageQuery {
  articleId: string
  commentId: string
  page: number
  pageSize: number
}

export interface CommentInsertCommand {
  articleId: string
  commentContent: string
  commentImg?: string
  parentCommentId: string
  toUserId?: string
} 

export interface CommentDeleteCommand {
  articleId: string
  commentId: string
  parentCommentId: string
}

export interface CommentUserPageQuery {
  userId: string
  page: number
  pageSize: number
}

