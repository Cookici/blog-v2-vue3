<template>
  <div class="app-container">
    <AppHeader />
    <el-container class="main-container">
      <el-main>
        <div class="dashboard-content">
          <!-- 欢迎区域 -->
          <div class="welcome-section">
            <div class="welcome-left">
              <h2>欢迎回来，{{ userInfo?.userName }}</h2>
              <p class="subtitle">今天是个创作的好日子</p>
            </div>
            <el-button type="primary" size="large" @click="router.push('/article/edit')">
              <el-icon><Plus /></el-icon>发布文章
            </el-button>
          </div>

          <!-- 数据概览 -->
          <div class="stats-grid">
            <el-card v-for="card in statsCards" :key="card.title" class="stats-card">
              <template #header>
                <div class="card-header">
                  <span>{{ card.title }}</span>
                  <el-icon><component :is="card.icon" /></el-icon>
                </div>
              </template>
              <div class="stats-content">
                <div class="stats-value">{{ card.value }}</div>
                <div class="stats-label">{{ card.label }}</div>
              </div>
            </el-card>
          </div>

          <!-- 最近文章 -->
          <div class="recent-articles">
            <div class="section-header">
              <h3>最近发布的文章</h3>
              <el-button text type="primary" @click="router.push('/my-articles')">
                查看全部<el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
            </div>
            
            <el-table :data="recentArticles" style="width: 100%">
              <el-table-column prop="articleTitle" label="文章标题" min-width="200" />
              <el-table-column prop="userInfo.userName" label="用户名称" width="180" />
              <el-table-column prop="createTime" label="发布时间" width="180">
                <template #default="scope">
                  {{ formatDateTime(scope.row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="viewCount" label="浏览量" width="100" align="center" />
              <el-table-column prop="likeCount" label="点赞量" width="100" align="center" />
              <el-table-column fixed="right" label="操作" width="180">
                <template #default="scope">
                  <el-button link type="primary" @click="viewArticle(scope.row)">查看</el-button>
                  <el-button 
                    v-if="userInfo?.userId === scope.row.userId" 
                    link 
                    type="primary" 
                    @click="editArticle(scope.row)"
                  >
                    编辑
                  </el-button>
                  <el-popconfirm
                    v-if="userInfo?.userId === scope.row.userId"
                    title="确定删除这篇文章吗？"
                    @confirm="deleteArticle(scope.row)"
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
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/AppHeader.vue'
import { 
  Plus, 
  Document, 
  View, 
  ChatDotRound, 
  ArrowRight, 
  Star,
  Message
} from '@element-plus/icons-vue'
import { useArticleApi } from '@/services/modules/article'
import type { ArticleDTO, UserArticleDataDTO, ArticleUserPageQuery } from '@/types/article'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const recentArticles = ref<ArticleDTO[]>([])
const loading = ref(false)

const statsData = ref<UserArticleDataDTO>({
  articleCount: 0,
  likeCount: 0,
  viewCount: 0,
  commentCount: 0,
  friendApplyCount: 0
})

const loadRecentArticles = async () => {
  if (!userInfo.value?.userId) return
  
  try {
    loading.value = true
    const { data } = await useArticleApi.getUserArticles({
      userId: userInfo.value.userId,
      page: 1,
      pageSize: 5,
      articleTitle: undefined,
      articleContent: undefined,
      labelNameList: undefined
    } as ArticleUserPageQuery)
    recentArticles.value = data
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章列表失败')
  } finally {
    loading.value = false
  }
}

const loadStatsData = async () => {
  if (!userInfo.value?.userId) return
  
  try {
    const data = await useArticleApi.userArticleData()
    statsData.value = data
  } catch (error: any) {
    ElMessage.error(error.message || '获取统计数据失败')
  }
}

// 修改 statsCards 的计算方式
const statsCards = computed(() => {
  if (!userInfo.value?.userId) return []
  
  return [
    {
      title: '我的文章',
      value: statsData.value.articleCount,
      label: '总发布数',
      icon: Document
    },
    {
      title: '文章浏览',
      value: statsData.value.viewCount,
      label: '总浏览量',
      icon: View
    },
    {
      title: '收到评论',
      value: statsData.value.commentCount,
      label: '总评论数',
      icon: ChatDotRound
    },
    {
      title: '获得点赞',
      value: statsData.value.likeCount,
      label: '总点赞数',
      icon: Star
    },
    {
      title: '好友申请',
      value: statsData.value.friendApplyCount,
      label: '好友申请',
      icon: Message
    }
  ]
})

onMounted(() => {
  loadStatsData()
  loadRecentArticles()
})

const viewArticle = (article: ArticleDTO) => {
  router.push(`/article/${article.articleId}`)
}

const editArticle = (article: ArticleDTO) => {
  router.push({
    path: '/article/edit',
    query: {
      articleId: article.articleId,
      title: article.articleTitle,
      content: article.articleContent,
      labels: article.labels.map(label => label.labelId).join(',')
    }
  })
}

const deleteArticle = async (article: ArticleDTO) => {
  try {
    await useArticleApi.delete(article.articleId)
    ElMessage.success('删除成功')
    
    // 重新加载文章列表
    await loadRecentArticles()
    
    // 更新统计数据
    await loadStatsData()

  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss');
}
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 60px; /* 为固定的 header 留出空间 */
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-section {
  background: linear-gradient(135deg, #409EFF 0%, #85c5ff 100%);
  padding: 30px;
  border-radius: 12px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-left h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stats-card {
  border-radius: 8px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  padding: 12px 20px;
}

.stats-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 12px 0;
}

.stats-value {
  font-size: 32px;
  font-weight: 600;
  color: #409EFF;
  line-height: 1.2;
  margin-bottom: 8px;
}

.stats-label {
  font-size: 14px;
  color: #909399;
}

.recent-articles {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-table) {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stats-value {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>