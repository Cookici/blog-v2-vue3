<template>
  <div class="app-container">
    <AppHeader />
    <el-container class="main-container">
      <el-main>
        <div class="search-container" v-if="isSearchableTab">
          <el-form :model="searchForm" class="search-form" @submit.prevent>
            <div class="search-inputs">
              <el-form-item>
                <el-input 
                  v-model="searchForm.element" 
                  placeholder="搜索文章" 
                  clearable 
                  @clear="handleSearch"
                  @keyup.enter="handleSearch">
                  <template #prefix>
                    <el-icon>
                      <Search />
                    </el-icon>
                  </template>
                </el-input>
              </el-form-item>
            </div>
            <el-form-item class="search-button">
              <el-button type="primary" @click="handleSearch">
                <el-icon>
                  <Search />
                </el-icon>搜索
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="article-tabs">
          <div class="tabs-header">
            <el-tabs v-model="activeTab" @tab-change="handleTabChange">
              <el-tab-pane label="最新文章" name="latest"></el-tab-pane>
              <el-tab-pane label="我的喜欢" name="like"></el-tab-pane>
              <el-tab-pane label="推荐文章" name="recommended"></el-tab-pane>
              <el-tab-pane label="热门文章" name="hot"></el-tab-pane>
            </el-tabs>
            <div class="tabs-actions" v-if="activeTab === 'hot'">
              <el-button type="primary" size="small" @click="refreshCurrentTab" :loading="refreshing">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
            </div>
          </div>
          
          <!-- 文章内容区域 -->
          <div class="articles-grid" v-loading="loading">
            <el-card v-for="article in articles" :key="article.articleId" class="article-card">
              <!-- 文章卡片内容 -->
              <div class="article-header">
                <div class="author-info">
                  <el-avatar :size="32" :src="article.userInfo.userPhoto" />
                  <span class="author-name">{{ article.userInfo.userName }}</span>
                </div>
              </div>
              <div class="article-content" @click="viewArticle(article)">
                <h3 class="article-title">{{ article.articleTitle }}</h3>
                <p class="article-preview" v-html="getPreviewContent(article.articleContent)"></p>
              </div>
              <div class="article-footer">
                <div class="article-labels">
                  <el-tag v-for="label in article.labels" :key="label.labelId" size="small" class="label-tag">
                    {{ label.labelName }}
                  </el-tag>
                </div>
                <div class="article-meta">
                  <div class="meta-item">
                    <el-icon>
                      <View />
                    </el-icon>
                    {{ article.viewCount || 0 }}
                  </div>
                  <div class="meta-item">
                    <el-icon v-if="activeTab === 'latest' || activeTab === 'hot'">
                      <Star />
                    </el-icon>
                    <el-icon v-else>
                      <Heart />
                    </el-icon>
                    {{ article.likeCount || 0 }}
                  </div>
                  <span class="create-time">{{ formatDate(article.createTime) }}</span>
                </div>
              </div>
            </el-card>
          </div>

          <div class="pagination-container" v-if="showPagination">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
              :page-sizes="[10, 20, 30, 50]" layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange" @current-change="handleCurrentChange" />
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useArticleApi } from '@/services/modules/article'
import type {
  ArticleDTO,
  ArticleLikePageQuery,
  ArticleUserPageQuery,
  ArticleRecommendQuery,
  ArticleHotQuery
} from '@/types/article'
import { ElMessage } from 'element-plus'
import { View, Star, Search, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)

const router = useRouter()
const activeTab = ref('latest')
const articles = ref<ArticleDTO[]>([])
const loading = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchForm = ref({
  element: ''
})

// 计算属性：判断当前标签页是否需要显示分页
const showPagination = computed(() => {
  return ['latest', 'like'].includes(activeTab.value)
})

// 计算属性：判断当前标签页是否支持分页
const isPaginatedTab = computed(() => {
  return ['latest', 'like', 'recommended'].includes(activeTab.value)
})

// 计算属性：判断当前标签页是否支持搜索
const isSearchableTab = computed(() => {
  return ['latest', 'like'].includes(activeTab.value)
})

const handleSearch = () => {
  currentPage.value = 1
  loadArticles()
}

const loadLatestArticles = async (params: ArticleUserPageQuery) => {
  const response = await useArticleApi.page(params)
  return response
}

const loadLikedArticles = async (params: ArticleLikePageQuery) => {
  const response = await useArticleApi.getLikePage(params)
  return response
}

const loadRecommendedArticles = async (params: ArticleRecommendQuery) => {
  const response = await useArticleApi.getUserRecommendArticles(params)
  return response
}

const loadHotArticles = async (params: ArticleHotQuery) => {
  const response = await useArticleApi.getHotPage(params)
  return response
}

// 获取基础参数
const getBaseParams = () => {
  return {
    userId: userInfo.value?.userId || '',
    page: currentPage.value,
    pageSize: pageSize.value,
    element: searchForm.value.element
  }
}

// 重构后的 loadArticles
const loadArticles = async () => {
  try {
    loading.value = true
    const baseParams = getBaseParams()

    let response
    switch (activeTab.value) {
      case 'like':
        response = await loadLikedArticles(baseParams as ArticleLikePageQuery)
        break
      case 'hot':
        response = await loadHotArticles({
          userId: userInfo.value?.userId || ''
        })
        break
      case 'recommended':
        response = await loadRecommendedArticles({
          userId: userInfo.value?.userId || ''
        })
        break
      default:
        response = await loadLatestArticles(baseParams)
    }

    articles.value = Array.isArray(response) ? response : response.data
    
    // 只有支持分页的标签页才更新总数
    if (isPaginatedTab.value) {
      total.value = Array.isArray(response) ? 0 : response.total
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章列表失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 刷新当前标签页数据
const refreshCurrentTab = async () => {
  try {
    refreshing.value = true
    await loadArticles()
    ElMessage.success('刷新成功')
  } catch (error: any) {
    ElMessage.error(error.message || '刷新失败')
  } finally {
    refreshing.value = false
  }
}

const handleTabChange = () => {
  currentPage.value = 1
  loadArticles()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadArticles()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadArticles()
}

const viewArticle = (article: ArticleDTO) => {
  router.push(`/article/${article.articleId}`)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getPreviewContent = (content: string) => {
  const plainText = content.replace(/<[^>]+>/g, '')
  return plainText.length > 50 ? plainText.slice(0, 50) + '...' : plainText
}

onMounted(() => {
  loadArticles()
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

.article-tabs {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.articles-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 10px;
}

.article-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.article-header {
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 14px;
  color: #606266;
}

.article-content {
  margin-bottom: 12px;
}

.article-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #303133;
  line-height: 1.4;
}

.article-preview {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.article-labels {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.label-tag {
  margin-right: 4px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 16px;
  background-color: #f5f7fa;
  color: #606266;
  font-size: 13px;
  transition: all 0.3s;
}

.meta-item:hover {
  background-color: #ecf5ff;
}

.meta-item .el-icon {
  font-size: 14px;
}

.create-time {
  margin-left: auto;
  color: #909399;
  font-size: 13px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.search-container {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.search-form {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.search-inputs {
  display: flex;
  flex: 1;
  gap: 16px;
}

.search-inputs .el-form-item {
  margin-bottom: 0;
  flex: 1;
}

.search-button {
  margin-bottom: 0;
}

.refresh-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-select) {
  width: 100%;
}
.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tabs-header :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.tabs-actions {
  display: flex;
  gap: 8px;
}

.search-container {
  transition: all 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .main-container {
    padding: 10px;
  }

  .search-form {
    flex-direction: column;
    gap: 12px;
  }

  .search-inputs {
    flex-direction: column;
    gap: 12px;
  }

  .search-button {
    display: flex;
    justify-content: center;
  }

  .search-button .el-button {
    width: 100%;
  }
}
</style>