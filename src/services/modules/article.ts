import { http } from '../http'
import type {
    ArticleDTO,
    ArticlePageQuery,
    CreateArticleParams,
    UserArticleDataDTO,
    ArticleUserPageQuery
} from '@/types/article'

import type { PageDTO } from '@/services/types'

export const useArticleApi = {
    // 分页查询文章列表
    page(params: ArticlePageQuery) {
        return http.get<PageDTO<ArticleDTO>>('/article/page', { params })
    },

    // 创建文章
    create(params: CreateArticleParams) {
        return http.post<ArticleDTO>('/article/insert', params)
    },

    // 删除文章
    delete(articleId: string) {
        return http.post('/article/delete', { articleId })
    },

    // 获取文章详情
    getArticleById: (articleId: string) => {
        return http.get<ArticleDTO>(`/article/get/${articleId}`)
    },

    // 增加浏览量
    incrementView(articleId: string) {
        return http.post('/article/view', { articleId })
    },

    // 增加点赞量
    incrementLike(articleId: string) {
        return http.post('/article/like', { articleId })
    },

    // 未登录增加浏览量
    incrementViewNoLogin(articleId: string) {
        return http.post('/article/view/no_login', { articleId })
    },

    // 未登录增加点赞量
    incrementLikeNoLogin(articleId: string) {
        return http.post('/article/like/no_login', { articleId })
    },

    // 更新文章
    updateArticle(params: {
        articleId: string;
        articleTitle: string;
        articleContent: string;
        labelIdList: string[];
    }) {
        return http.post('/article/update', params);
    },

    //获取用户信息
    userArticleData(){
        return http.get<UserArticleDataDTO>('/article/userArticleData');
    },

    // 获取用户的文章列表
    getUserArticles(params: ArticleUserPageQuery) {
        return http.get<PageDTO<ArticleDTO>>('/article/user/page', { params })
    },
} 