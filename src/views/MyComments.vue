<template>
  <div class="app-container">
    <AppHeader />
    <el-container class="main-container">
      <el-main>
        <div class="my-comments-content">
          <h2>我的评论</h2>
          
          <el-table 
            v-loading="loading"
            :data="comments" 
            style="width: 100%"
            :row-class-name="tableRowClassName"
          >
            <el-table-column label="评论内容" min-width="400">
              <template #default="{ row }">
                <div class="comment-card">
                  <div class="comment-header">
                    <div class="article-info">
                      <el-icon><Document /></el-icon>
                      <el-tooltip
                        :content="row.articleTitle"
                        placement="top"
                        :show-after="500"
                      >
                        <el-link 
                          type="primary" 
                          @click="router.push(`/article/${row.articleId}`)"
                          class="article-title"
                        >
                          {{ row.articleTitle }}
                        </el-link>
                      </el-tooltip>
                      <el-tag 
                        v-if="row.parentCommentId === '0'" 
                        size="small" 
                        type="warning"
                        effect="plain"
                        class="comment-tag"
                      >
                        楼主
                      </el-tag>
                    </div>
                    <span class="comment-time">{{ formatDate(row.createTime) }}</span>
                  </div>
                  
                  <div class="comment-body">
                    <div class="comment-user-info" v-if="row.toUserInfo">
                      <span class="reply-label">回复</span>
                      <el-avatar 
                        :size="24" 
                        :src="row.toUserInfo.userPhoto"
                        class="user-avatar"
                      >
                        {{ row.toUserInfo.userName?.charAt(0) }}
                      </el-avatar>
                      <span class="user-name">{{ row.toUserInfo.userName }}</span>
                    </div>
                    
                    <div class="comment-content">
                      <p>{{ row.commentContent }}</p>
                      <el-image 
                        v-if="row.commentImg" 
                        :src="row.commentImg" 
                        class="comment-image"
                        :preview-src-list="[row.commentImg]"
                        :initial-index="0"
                        preview-teleported
                        fit="cover"
                      />
                    </div>  
                  </div>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column fixed="right" label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-popconfirm
                  title="确定删除这条评论吗？"
                  @confirm="handleDelete(row)"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                >
                  <template #reference>
                    <el-button link type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10]"
              layout="total, sizes, prev, pager, next"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCommentApi } from '@/services/modules/comment'
import { ElMessage } from 'element-plus'
import type { CommentUserDTO,CommentUserPageQuery } from '@/types/comment'
import AppHeader from '@/components/AppHeader.vue'
import { Document } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const comments = ref<CommentUserDTO[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 时间格式化函数
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 小于30天
  if (diff < 2592000000) {
    return `${Math.floor(diff / 86400000)}天前`
  }
  
  // 超过30天显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  
  // 如果是今年的评论，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hour}:${minute}`
  }
  
  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 加载评论列表
const loadComments = async () => {
  try {
    loading.value = true
    const response = await useCommentApi.getMyComments({
      userId: localStorage.getItem('userId') as string,
      page: currentPage.value,
      pageSize: pageSize.value
    } as CommentUserPageQuery)
    comments.value = response.data
    total.value = response.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取评论失败')
  } finally {
    loading.value = false
  }
}

// 删除评论
const handleDelete = async (comment: CommentUserDTO) => {
  try {
    await useCommentApi.delete({
      articleId: comment.articleId,
      commentId: comment.commentId,
      parentCommentId: comment.parentCommentId
    })
    ElMessage.success('删除成功')
    loadComments()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadComments()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadComments()
}

// 添加表格行的样式
const tableRowClassName = () => {
  return 'comment-row'
}

onMounted(() => {
  loadComments()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 60px; /* 为固定的 header 留出空间 */
}

.main-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.my-comments-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  margin: 0 0 24px;
  font-size: 24px;
  color: #333;
}

.comment-card {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.comment-card:hover {
  background-color: #f0f2f5;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.article-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
}

.article-title {
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.article-info :deep(.el-icon) {
  font-size: 16px;
  color: #909399;
}

.comment-time {
  color: #909399;
  font-size: 13px;
}

.comment-body {
  padding: 0 4px;
}

.comment-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 4px 8px;
  background-color: #eef2f7;
  border-radius: 4px;
  width: fit-content;
}

.reply-label {
  color: #909399;
  font-size: 13px;
}

.user-avatar {
  border: 1px solid #eee;
}

.user-name {
  font-weight: 500;
  color: #409EFF;
}

.comment-content {
  padding: 8px 0;
}

.comment-content p {
  margin: 0;
  line-height: 1.6;
  color: #303133;
  font-size: 14px;
}

.comment-image {
  margin-top: 8px;
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.comment-row) {
  background-color: transparent !important;
}

:deep(.comment-row:hover) td {
  background-color: transparent !important;
}

:deep(.el-table__cell) {
  padding: 8px 0;
}

.pagination-wrapper {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}

.comment-tag {
  font-size: 12px;
  height: 22px;
  padding: 0 8px;
  border-radius: 4px;
}
</style> 