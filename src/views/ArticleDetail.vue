<template>
  <div class="app-container">
    <AppHeader />
    <el-container class="main-container">
      <el-main>
        <div class="article-detail" v-loading="loading">
          <div v-if="article" class="article-content-wrapper">
            <div class="article-header">
              <h1 class="article-title">{{ article.articleTitle }}</h1>
              <div class="article-meta">
                <div class="author-info">
                  <el-avatar :size="40" :src="article.userInfo.userPhoto || '/default-avatar.png'" />
                  <div class="author-details">
                    <span class="author-name">{{ article.userInfo.userName }}</span>
                    <span class="publish-time">{{ formatDate(article.createTime) }}</span>
                  </div>
                </div>
                <div class="meta-item">
                  <el-icon>
                    <View />
                  </el-icon>
                  <span>{{ article.viewCount || 0 }}</span>
                </div>
                <div class="meta-item">
                  <el-button :icon="Star" text @click="handleLike">
                    {{ article.likeCount || 0 }}
                  </el-button>
                </div>
              </div>
            </div>

            <div class="article-main">
              <div class="article-content markdown-body" v-html="sanitizedContent">
              </div>
            </div>

            <div class="article-actions">
              <el-button type="primary" @click="goBack">返回列表</el-button>
            </div>
          </div>

          <div v-else-if="!loading" class="empty-state">
            <el-empty description="暂无文章内容" />
          </div>

          <div class="comments-section">
            <h3 class="comments-title">评论 ({{ total }})</h3>

            <div class="comment-input-wrapper">
              <el-input v-model="commentContent" type="textarea" :rows="3" placeholder="写下你的评论..." :maxlength="500"
                show-word-limit />
              <div class="comment-toolbar">
                <div class="toolbar-left">
                  <el-upload v-if="!commentImage" class="image-uploader" :action="uploadAction"
                    :before-upload="beforeCommentImageUpload" :http-request="handleCommentImageUpload">
                    <el-button class="upload-button" type="primary" plain>
                      <el-icon>
                        <Picture />
                      </el-icon>
                      <span>添加图片</span>
                    </el-button>
                  </el-upload>
                </div>

              </div>
              <div v-if="commentImage" class="uploaded-image-wrapper">
                <div class="uploaded-image">
                  <el-image :src="commentImage" class="preview-image" :preview-src-list="[commentImage]" />
                  <el-button type="danger" circle class="remove-image" @click="removeCommentImage">
                    <el-icon>
                      <Close />
                    </el-icon>
                  </el-button>
                </div>
              </div>
              <div class="submit-button-container">
                <el-button type="primary" @click="submitComment" :loading="submitting" class="submit-button">
                  发表评论
                </el-button>
              </div>
            </div>

            <div class="comments-list" v-loading="loadingComments">
              <template v-if="comments.length > 0">
                <div v-for="comment in comments" :key="comment.commentId" class="comment-item" :data-comment-id="comment.commentId">
                  <div class="comment-main">
                    <el-avatar :size="40" :src="comment.userInfo.userPhoto" />
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="username">{{ comment.userInfo.userName }}</span>
                        <span class="time">{{ formatDate(comment.createTime) }}</span>
                      </div>
                      <p class="comment-text">{{ comment.commentContent }}</p>
                      <div v-if="comment.commentImg" class="comment-image-wrapper">
                        <el-image :src="comment.commentImg" class="comment-image"
                          :preview-src-list="[comment.commentImg]" fit="cover" :initial-index="0" preview-teleported />
                      </div>
                      <div class="comment-footer">
                        <div class="comment-actions">
                          <el-button link type="primary" class="action-btn" @click="showReplyInput(comment)">
                            <el-icon>
                              <ChatLineRound />
                            </el-icon>
                            回复
                          </el-button>
                          <el-button v-if="userStore.userInfo?.userId === comment.userId" link type="danger"
                            class="action-btn" @click="deleteComment(comment)">
                            <el-icon>
                              <Delete />
                            </el-icon>
                            删除
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="replies-list" v-if="comment.commentList && comment.commentList.length > 0">
                    <div v-for="(reply, index) in comment.commentList" :key="reply.commentId" class="reply-item"
                      v-show="expandedComments.has(comment.commentId) || index < 2">
                      <div class="reply-users">
                        <div class="reply-user from">
                          <el-avatar :size="32" :src="reply.userInfo.userPhoto" />
                          <span class="username">{{ reply.userInfo.userName }}</span>
                        </div>
                        <el-icon class="reply-arrow">
                          <ArrowRight />
                        </el-icon>
                        <div class="reply-user to" v-if="reply.toUserInfo">
                          <el-avatar :size="32" :src="reply.toUserInfo.userPhoto" />
                          <span class="username">{{ reply.toUserInfo.userName }}</span>
                        </div>
                      </div>
                      <div class="reply-content">
                        <p class="reply-text">{{ reply.commentContent }}</p>
                        <el-image v-if="reply.commentImg" :src="reply.commentImg" class="reply-image"
                          :preview-src-list="[reply.commentImg]" />
                        <div class="reply-footer">
                          <span class="time">{{ formatDate(reply.createTime) }}</span>
                          <div class="reply-actions">
                            <el-button link type="primary" @click="showReplyInput(comment, reply)">
                              回复
                            </el-button>
                            <el-button v-if="userStore.userInfo?.userId === reply.userId" link type="danger"
                              @click="deleteComment(reply)">
                              删除
                            </el-button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="expand-replies" v-if="(childCommentTotals.get(comment.commentId) || 0) > 2">
                      <el-button link type="primary" @click="toggleChildComments(comment.commentId)">
                        {{ expandedComments.has(comment.commentId) ? '收起' : `查看全部
                        ${childCommentTotals.get(comment.commentId)} 条回复` }}
                      </el-button>
                    </div>

                    <div class="child-pagination" v-if="expandedComments.has(comment.commentId)">
                      <el-pagination :current-page="getChildCurrentPage(comment.commentId)"
                        :page-size="getChildPageSize(comment.commentId)" :total="getChildTotal(comment.commentId)"
                        :page-sizes="[5]" layout="sizes, prev, pager, next"
                        @update:current-page="(page: number) => setChildCurrentPage(comment.commentId, page)"
                        @update:page-size="(size: number) => setChildPageSize(comment.commentId, size)" />
                    </div>
                  </div>

                  <div v-if="replyTo?.commentId === comment.commentId" class="reply-input-wrapper" ref="replyInputRef">
                    <el-input v-model="replyContent" type="textarea" :rows="2"
                      :placeholder="replyTo.toUser ? `回复 ${replyTo.toUser.userName}` : '写下你的回复...'" />
                    <div v-if="replyImage" class="uploaded-image">
                      <el-image :src="replyImage" class="preview-image" :preview-src-list="[replyImage]"
                        :initial-index="0" preview-teleported />
                      <el-button type="danger" circle class="remove-image" @click="removeReplyImage">
                        <el-icon>
                          <Close />
                        </el-icon>
                      </el-button>
                    </div>
                    <div class="reply-toolbar">
                      <div class="toolbar-left">
                        <el-upload v-if="!replyImage" class="image-uploader" :action="uploadAction"
                          :before-upload="beforeReplyImageUpload" :http-request="handleReplyImageUpload">
                          <el-button class="upload-reply-button" type="primary" plain>
                            <el-icon>
                              <Picture />
                            </el-icon>
                            <span>添加图片</span>
                          </el-button>
                        </el-upload>
                      </div>
                    </div>
                    <div class="reply-actions">
                      <el-button @click="cancelReply">取消</el-button>
                      <el-button type="primary" @click="submitReply" :loading="submitting">
                        回复
                      </el-button>
                    </div>
                  </div>
                </div>
              </template>
              <el-empty v-else description="暂无评论" />
            </div>

            <div class="pagination-wrapper" v-if="total > 0">
              <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
                :page-sizes="[10]" layout="total, sizes, prev, pager, next" @size-change="handleSizeChange"
                @current-change="handleCurrentChange" />
            </div>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useArticleApi } from '@/services/modules/article'
import type { ArticleDTO } from '@/types/article'
import { ElMessage } from 'element-plus'
import { View, Star, ArrowRight, Picture, Close, ChatLineRound, Delete } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useCommentApi } from '@/services/modules/comment'
import type { CommentDTO } from '@/types/comment'
import { useUploadApi } from '@/services/modules/upload'
import { UserInfo } from '@/types/user'
import DOMPurify from 'isomorphic-dompurify'


const route = useRoute()
const router = useRouter()
const article = ref<ArticleDTO | null>(null)
const loading = ref(false)
const userStore = useUserStore()
const comments = ref<CommentDTO[]>([])
const loadingComments = ref(false)
const submitting = ref(false)
const commentContent = ref('')
const replyContent = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const replyTo = ref<{
  commentId: string;
  toUser?: UserInfo;
  parentCommentId?: string;
} | null>(null)
const commentImage = ref('')
const replyImage = ref('')
const replyInputRef = ref<HTMLElement | null>(null)

// 子评论分页相关
const expandedComments = ref<Set<string>>(new Set())
const childCommentPages = ref<Map<string, number>>(new Map())
const childCommentSizes = ref<Map<string, number>>(new Map())
const childCommentTotals = ref<Map<string, number>>(new Map())

// 获取和设置子评论页码
const getChildCurrentPage = (commentId: string) => childCommentPages.value.get(commentId) || 1
const setChildCurrentPage = (commentId: string, page: number) => {
  childCommentPages.value.set(commentId, page)
  handleChildPageChange(commentId, page)
}

// 获取和设置子评论每页条数
const getChildPageSize = (commentId: string) => childCommentSizes.value.get(commentId) || 10
const setChildPageSize = (commentId: string, size: number) => {
  childCommentSizes.value.set(commentId, size)
  handleChildSizeChange(commentId, size)
}

// 获取子评论总数
const getChildTotal = (commentId: string) => childCommentTotals.value.get(commentId) || 0

const loadArticle = async () => {
  const articleId = route.params.id as string
  if (!articleId) return

  try {
    loading.value = true
    const articleDTO = await useArticleApi.getArticleById(articleId)
    article.value = articleDTO

    // 增加浏览量
    if (userStore.userInfo) {
      await useArticleApi.incrementView(articleId)
    } else {
      await useArticleApi.incrementViewNoLogin(articleId)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章详情失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const goBack = () => {
  router.back()
}

// 处理点赞
const handleLike = async () => {
  if (!article.value) return

  try {
    if (userStore.userInfo) {
      await useArticleApi.incrementLike(article.value.articleId)
    } else {
      await useArticleApi.incrementLikeNoLogin(article.value.articleId)
    }
    // 更新点赞数
    article.value.likeCount = (article.value.likeCount || 0) + 1
    ElMessage.success('点赞成功')
  } catch (error: any) {
    ElMessage.error(error.message || '点赞失败')
  }
}

// 加载评论列表
const loadComments = async () => {
  if (!article.value?.articleId) return

  try {
    loadingComments.value = true
    // 获取主评论
    const response = await useCommentApi.page({
      articleId: article.value.articleId,
      page: currentPage.value,
      pageSize: pageSize.value
    })

    if (!response.data && !response.total) {
      comments.value = []
      total.value = 0
      return
    }

    const { data = [], total: totalCount = 0 } = response

    // 获取每个主评论的子评论和总数 - 改为并行请求
    const childCommentsPromises = data.map(comment =>
      useCommentApi.pageChild({
        articleId: article.value!.articleId,
        commentId: comment.commentId,
        page: 1,
        pageSize: 2  // 默认只加载2条子评论
      }).catch(error => {
        console.error('Failed to load child comments:', error)
        return { data: [], total: 0 }
      })
    )

    // 等待所有子评论请求完成
    const childResponses = await Promise.all(childCommentsPromises)

    // 将子评论数据合并到主评论中
    const commentsWithReplies = data.map((comment, index) => {
      const childResponse = childResponses[index]
      if (childResponse) {
        // 保存子评论总数
        childCommentTotals.value.set(comment.commentId, childResponse.total)
        return {
          ...comment,
          commentList: childResponse.data || []
        }
      }
      return {
        ...comment,
        commentList: []
      }
    })

    comments.value = commentsWithReplies
    total.value = totalCount
  } catch (error: any) {
    ElMessage.error(error.message || '获取评论失败')
    comments.value = []
    total.value = 0
  } finally {
    loadingComments.value = false
  }
}

const sanitizedContent = computed(() => {
  if (!article.value?.articleContent) return ''
  return DOMPurify.sanitize(article.value.articleContent)
})

// 图片上传前的验证
const beforeCommentImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理图片上传
const handleCommentImageUpload = async (options: any) => {
  try {
    const formData = new FormData()
    formData.append('imageFile', options.file)
    const { fileUrl } = await useUploadApi.uploadImage(formData)
    commentImage.value = fileUrl
    ElMessage.success('图片上传成功')
  } catch (error: any) {
    ElMessage.error(error.message || '图片上传失败')
  }
}

// 移除已上传的图片
const removeCommentImage = () => {
  commentImage.value = ''
}

// 修改显示回复输入框的方法
const showReplyInput = (comment: CommentDTO, replyToComment?: CommentDTO) => {
  replyTo.value = {
    commentId: comment.commentId,
    toUser: replyToComment ? replyToComment.userInfo : comment.userInfo,
    parentCommentId: comment.commentId  // 修改这里，直接使用主评论的 ID
  }
  replyContent.value = ''
  replyImage.value = ''
  
  // 使用 nextTick 确保 DOM 已更新后再滚动
  nextTick(() => {
    setTimeout(() => {
      // 查找回复输入框元素
      const replyInputElement = document.querySelector(
        `.comment-item[data-comment-id="${comment.commentId}"] .reply-input-wrapper`
      )
      
      if (replyInputElement) {
        // 滚动到回复输入框
        replyInputElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        // 如果找不到回复输入框，则滚动到评论元素
        const commentElement = document.querySelector(`[data-comment-id="${comment.commentId}"]`)
        if (commentElement) {
          commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, 100) // 短暂延迟确保DOM已更新
  })
}

// 取消回复
const cancelReply = () => {
  replyTo.value = null
  replyContent.value = ''
  replyImage.value = ''
}

// 展开/收起子评论
const toggleChildComments = async (commentId: string) => {
  if (expandedComments.value.has(commentId)) {
    // 收起评论时，重置为只显示前2条
    expandedComments.value.delete(commentId)
    const comment = comments.value.find(c => c.commentId === commentId)
    if (comment) {
      const childResponse = await useCommentApi.pageChild({
        articleId: article.value!.articleId,
        commentId: comment.commentId,
        page: 1,
        pageSize: 2
      })
      if (childResponse) {
        comments.value = comments.value.map(c => {
          if (c.commentId === commentId) {
            return {
              ...c,
              commentList: childResponse.data || []
            }
          }
          return c
        })
      }
    }
  } else {
    // 展开评论时，加载全部评论
    expandedComments.value.add(commentId)
    // 初始化子评论分页
    childCommentPages.value.set(commentId, 1)
    childCommentSizes.value.set(commentId, 5) // 默认每页显示10条
    await loadChildComments(commentId)
  }
}

// 加载子评论
const loadChildComments = async (commentId: string) => {
  if (!article.value?.articleId) return

  try {
    const page = childCommentPages.value.get(commentId) || 1
    const pageSize = childCommentSizes.value.get(commentId) || 10
    const isExpanded = expandedComments.value.has(commentId)

    const response = await useCommentApi.pageChild({
      articleId: article.value.articleId,
      commentId: commentId,
      page,
      pageSize: isExpanded ? pageSize : 2 // 根据是否展开决定加载数量
    })

    if (!response) return

    const { data = [], total = 0 } = response

    // 更新评论列表中的子评论
    comments.value = comments.value.map(comment => {
      if (comment.commentId === commentId) {
        return {
          ...comment,
          commentList: data
        }
      }
      return comment
    })

    childCommentTotals.value.set(commentId, total)
  } catch (error) {
    console.error('Failed to load child comments:', error)
  }
}

// 处理子评论分页变化
const handleChildPageChange = async (commentId: string, page: number) => {
  childCommentPages.value.set(commentId, page)
  await loadChildComments(commentId)
}

// 处理子评论每页条数变化
const handleChildSizeChange = async (commentId: string, size: number) => {
  childCommentSizes.value.set(commentId, size)
  childCommentPages.value.set(commentId, 1)
  await loadChildComments(commentId)
}

// 修改提交评论方法
const submitComment = async () => {
  if (!userStore.userInfo) {
    ElMessage.warning('请先登录')
    return
  }

  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  try {
    submitting.value = true
    await useCommentApi.create({
      articleId: article.value!.articleId,
      commentContent: commentContent.value.trim(),
      commentImg: commentImage.value || undefined,
      parentCommentId: '0', // 顶层评论的parentCommentId为'0'
      toUserId: article.value!.userId
    })
    ElMessage.success('评论成功')
    commentContent.value = ''
    commentImage.value = ''
    await loadComments()
  } catch (error: any) {
    ElMessage.error(error.message || '评论失败')
  } finally {
    submitting.value = false
  }
}

const submitReply = async () => {
  if (!userStore.userInfo || !replyTo.value) return

  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  try {
    submitting.value = true
    await useCommentApi.create({
      articleId: article.value!.articleId,
      commentContent: replyContent.value.trim(),
      commentImg: replyImage.value || undefined,
      parentCommentId: replyTo.value.commentId,  // 使用主评论的 ID
      toUserId: replyTo.value.toUser?.userId
    })
    ElMessage.success('回复成功')
    
    // 保存当前评论的展开状态
    const commentId = replyTo.value.commentId
    const wasExpanded = expandedComments.value.has(commentId)
    
    // 清空回复状态
    replyContent.value = ''
    replyImage.value = ''
    replyTo.value = null
    
    // 重新加载评论
    await loadComments()
    
    // 如果之前是展开状态，重新加载后也保持展开状态
    if (wasExpanded) {
      nextTick(() => {
        expandedComments.value.add(commentId)
        loadChildComments(commentId)
      })
    }
  } catch (error: any) {
    ElMessage.error(error.message || '回复失败')
  } finally {
    submitting.value = false
  }
}

// 删除评论
const deleteComment = async (comment: CommentDTO) => {
  try {
    await useCommentApi.delete({
      articleId: article.value!.articleId,
      commentId: comment.commentId,
      parentCommentId: comment.parentCommentId || '0'
    })
    ElMessage.success('删除成功')
    await loadComments()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadComments()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadComments()
}

// 添加上传地址
const uploadAction = ref('/api/oss/file/upload')  // 或者你的实际上传地址

// 移除回复图片
const removeReplyImage = () => {
  replyImage.value = ''
}

// 图片上传前的验证
const beforeReplyImageUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 处理回复图片上传
const handleReplyImageUpload = async (options: any) => {
  try {
    const formData = new FormData()
    formData.append('imageFile', options.file)
    const { fileUrl } = await useUploadApi.uploadImage(formData)
    replyImage.value = fileUrl
    ElMessage.success('图片上传成功')
  } catch (error: any) {
    ElMessage.error(error.message || '图片上传失败')
  }
}

onMounted(async () => {
  await loadArticle()
  await loadComments()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 60px;
  /* 为固定的 header 留出空间 */
}

.main-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.article-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  min-height: calc(100vh - 140px);
  /* 减去头部和padding的高度 */
}

.article-content-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.article-header {
  padding: 24px 32px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fff;
}

.article-title {
  font-size: 28px;
  color: #1a1a1a;
  margin: 0 0 24px 0;
  line-height: 1.4;
  font-weight: 600;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  font-size: 16px;
  color: #1a1a1a;
  font-weight: 500;
}

.publish-time {
  font-size: 14px;
  color: #86909c;
}

.meta-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #86909c;
  font-size: 14px;
}

.meta-item .el-icon {
  font-size: 16px;
}

.meta-item .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #86909c;
  transition: all 0.3s;
}

.meta-item .el-button:hover {
  color: #409EFF;
}

.article-main {
  padding: 32px;
  min-height: 300px;
  background-color: #ffffff;
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.article-content :deep(p) {
  margin: 16px 0;
  line-height: 1.8;
  word-wrap: break-word;
  word-break: break-all;
  overflow-wrap: break-word;
}

.article-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 4px;
}

.article-content :deep(pre) {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 16px 0;
}

.article-content :deep(code) {
  background-color: #f6f8fa;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}

.article-actions {
  padding: 24px 32px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
  background-color: #fafafa;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.comments-section {
  margin-top: 40px;
  padding: 0 32px 32px;
}

.comments-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.comment-input-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
}

.comment-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.upload-button {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.3s;
}

.upload-button:hover {
  opacity: 0.9;
}

.submit-button-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.submit-button {
  height: 36px;
  padding: 0 24px;
  font-size: 14px;
}

.submit-button {
  height: 36px;
  padding: 0 24px;
  font-size: 14px;
}

.uploaded-image-wrapper {
  margin-top: 12px;
}

.uploaded-image {
  position: relative;
  display: inline-block;
  margin: 8px 0;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 4px;
  font-size: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.remove-image :deep(.el-icon) {
  color: var(--el-color-danger);
  font-size: 14px;
  font-weight: bold;
}

.remove-image:hover {
  background-color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

.remove-image:hover :deep(.el-icon) {
  color: white;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
}

.comment-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.comment-main {
  display: flex;
  gap: 16px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  margin-bottom: 12px;
}

.username {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.time {
  font-size: 13px;
  color: #909399;
  margin-left: 12px;
}

.comment-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 8px 0;
  white-space: pre-wrap;
}

.comment-image-wrapper {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  display: inline-block;
}

.comment-image {
  max-width: 200px;
  max-height: 200px;
  object-fit: cover;
  border-radius: 6px;
  transition: transform 0.3s;
}

.comment-image:hover {
  transform: scale(1.02);
}

.comment-footer {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.comment-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* 将按钮靠右对齐 */
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 13px;
  height: 32px;
  /* 固定按钮高度 */
}

.action-btn .el-icon {
  font-size: 14px;
  margin-right: 2px;
  /* 图标和文字之间的间距 */
}

/* 回复按钮样式 */
.action-btn:hover {
  background-color: var(--el-color-primary-light-9);
  border-radius: 4px;
}

/* 删除按钮样式 */
.action-btn[type="danger"]:hover {
  background-color: var(--el-color-danger-light-9);
  border-radius: 4px;
}

/* 子评论的回复和删除按钮样式 */
.reply-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  /* 子评论按钮也靠右对齐 */
  gap: 16px;
  margin-top: 8px;
}

.reply-actions .el-button {
  font-size: 13px;
  height: 28px;
  /* 子评论按钮稍小一些 */
}

.replies-list {
  margin-left: 56px;
  margin-top: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
}

.reply-item {
  padding: 16px;
  margin-bottom: 12px;
  /* 添加底部间距 */
  background-color: #fff;
  /* 白色背景 */
  border-radius: 8px;
  /* 圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  /* 轻微阴影 */
}

.reply-item:last-child {
  margin-bottom: 0;
  /* 最后一个评论不需要底部间距 */
}

.reply-users {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  /* 添加内边距 */
  border-bottom: 1px solid #f0f0f0;
  /* 添加分隔线 */
}

.reply-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background-color: #f8f9fa;
  /* 浅灰色背景 */
  border-radius: 20px;
  transition: all 0.3s ease;
}

.reply-user.from {
  color: var(--el-color-primary);
}

.reply-user.to {
  color: var(--el-color-success);
}

.reply-arrow {
  color: #909399;
  font-size: 16px;
}

.reply-content {
  padding: 0 12px;
  /* 修改内边距 */
}

.reply-text {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin: 0;
  white-space: pre-wrap;
}

.reply-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.time {
  font-size: 12px;
  color: #909399;
}

.reply-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
}

.upload-reply-button {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.3s;
  background-color: #f0f7ff;
}

.upload-reply-button:hover {
  background-color: #e0f0ff;
  opacity: 0.9;
}

.reply-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.expand-replies {
  margin-top: 8px;
  text-align: center;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.child-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  padding-left: 0;
}

.reply-input-wrapper {
  margin-top: 24px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .article-header {
    padding: 16px;
  }

  .article-title {
    font-size: 22px;
    margin-bottom: 16px;
  }

  .article-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .meta-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .article-main {
    padding: 16px;
  }

  .replies-list {
    margin-left: 32px;
    padding: 12px;
  }

  .reply-item {
    padding: 12px;
  }

  .reply-users {
    flex-wrap: wrap;
    padding-bottom: 8px;
    margin-bottom: 8px;
  }


}
</style>