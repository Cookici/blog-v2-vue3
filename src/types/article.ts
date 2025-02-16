import type { UserInfo } from './user'

// 文章标签
export interface LabelDTO {
  labelId: string
  labelName: string
}

// 文章信息
export interface ArticleDTO {
  articleId: string
  userId: string
  articleTitle: string
  articleContent: string
  createTime: string
  updateTime: string
  userInfo: UserInfo
  labels: LabelDTO[]
  viewCount: number
  likeCount: number
}

// 分页查询参数
export interface ArticlePageQuery {
  page: number
  pageSize: number
  articleTitle?: string
  articleContent?: string
  labelNameList?: string[]
}

// 分页查询参数
export interface ArticleLikePageQuery {
  userId: string
  page: number
  pageSize: number
  articleTitle?: string
  articleContent?: string
  labelNameList?: string[]
}

// 分页查询参数
export interface ArticleUserPageQuery {
  userId: string
  page: number
  pageSize: number
  articleTitle?: string
  articleContent?: string
  labelNameList?: string[]
}


// 创建文章参数
export interface CreateArticleParams {
  articleTitle: string
  articleContent: string
  labelIdList: string[]
}

// 添加点赞请求参数
export interface ArticleLikeParams {
  articleId: string
} 

export interface UserArticleDataDTO {
  articleCount: number;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  friendApplyCount: number;
}

export interface ArticleRecommendQuery{
  userId :string,
  page: number,
  pageSize: number,
  articleTitle?: string,
  articleContent?: string,
  labelNameList?: string[]
}