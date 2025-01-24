<template>
  <div class="app-container">
    <AppHeader />
    <el-container class="main-container">
      <el-main>
        <div class="search-container">
          <el-form :model="searchForm" class="search-form">
            <div class="search-inputs">
              <el-form-item>
                <el-input
                  v-model="searchForm.articleTitle"
                  placeholder="搜索文章标题"
                  clearable
                  @clear="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-input
                  v-model="searchForm.articleContent"
                  placeholder="搜索文章内容"
                  clearable
                  @clear="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Document /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item>
                <el-select
                  v-model="searchForm.labelNameList"
                  multiple
                  filterable
                  clearable
                  placeholder="选择标签筛选"
                  @clear="handleSearch"
                >
                  <template #prefix>
                    <el-icon><Collection /></el-icon>
                  </template>
                  <el-option
                    v-for="label in labelOptions"
                    :key="label.labelId"
                    :label="label.labelName"
                    :value="label.labelName"
                  />
                </el-select>
              </el-form-item>
            </div>
            <el-form-item class="search-button">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>搜索
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="article-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="最新文章" name="latest">
              <div class="articles-grid" v-loading="loading">
                <el-card v-for="article in articles" :key="article.articleId" class="article-card">
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
                      <el-tag v-for="label in article.labels" 
                        :key="label.labelId" 
                        size="small" 
                        class="label-tag"
                      >
                        {{ label.labelName }}
                      </el-tag>
                    </div>
                    <div class="article-meta">
                      <div class="meta-item">
                        <el-icon><View /></el-icon>
                        {{ article.viewCount || 0 }}
                      </div>
                      <div class="meta-item">
                        <el-icon><Star /></el-icon>
                        {{ article.likeCount || 0 }}
                      </div>
                      <span class="create-time">{{ formatDate(article.createTime) }}</span>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-tab-pane>

            <el-tab-pane label="热门文章" name="hot">
              <div class="articles-grid" v-loading="loading">
                <el-card v-for="article in articles" :key="article.articleId" class="article-card">
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
                      <el-tag v-for="label in article.labels" 
                        :key="label.labelId" 
                        size="small" 
                        class="label-tag"
                      >
                        {{ label.labelName }}
                      </el-tag>
                    </div>
                    <div class="article-meta">
                      <div class="meta-item">
                        <el-icon><View /></el-icon>
                        {{ article.viewCount || 0 }}
                      </div>
                      <div class="meta-item">
                        <el-icon><Heart /></el-icon>
                        {{ article.likeCount || 0 }}
                      </div>
                      <span class="create-time">{{ formatDate(article.createTime) }}</span>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-tab-pane>

            <el-tab-pane label="推荐文章" name="recommended">
              <div class="articles-grid" v-loading="loading">
                <el-card v-for="article in articles" :key="article.articleId" class="article-card">
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
                      <el-tag v-for="label in article.labels" 
                        :key="label.labelId" 
                        size="small" 
                        class="label-tag"
                      >
                        {{ label.labelName }}
                      </el-tag>
                    </div>
                    <div class="article-meta">
                      <div class="meta-item">
                        <el-icon><View /></el-icon>
                        {{ article.viewCount || 0 }}
                      </div>
                      <div class="meta-item">
                        <el-icon><Heart /></el-icon>
                        {{ article.likeCount || 0 }}
                      </div>
                      <span class="create-time">{{ formatDate(article.createTime) }}</span>
                    </div>
                  </div>
                </el-card>
              </div>
            </el-tab-pane>
          </el-tabs>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
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
import AppHeader from '@/components/AppHeader.vue'
import { useArticleApi } from '@/services/modules/article'
import type { ArticleDTO } from '@/types/article'
import { ElMessage } from 'element-plus'
import { View,Star, Search, Document, Collection } from '@element-plus/icons-vue'
import { useLabelApi } from '@/services/modules/label'
import type { LabelDTO } from '@/types/article'

const router = useRouter()
const activeTab = ref('latest')
const articles = ref<ArticleDTO[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const searchForm = ref({
  articleTitle: '',
  articleContent: '',
  labelNameList: [] as string[]
})

const labelOptions = ref<LabelDTO[]>([])

const loadLabelOptions = async () => {
  try {
    const labels = await useLabelApi.getKinds()
    labelOptions.value = labels
  } catch (error: any) {
    ElMessage.error(error.message || '获取标签失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadArticles()
}

const loadArticles = async () => {
  try {
    loading.value = true
    let apiMethod
    switch (activeTab.value) {
      case 'hot':
        apiMethod = useArticleApi.page
        break
      case 'recommended':
        apiMethod = useArticleApi.page
        break
      default:
        apiMethod = useArticleApi.page
    }

    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      articleTitle: searchForm.value.articleTitle,
      articleContent: searchForm.value.articleContent,
      labelNameList: searchForm.value.labelNameList.length > 0 ? searchForm.value.labelNameList : undefined
    }

    const { data, total: totalCount } = await apiMethod(params)
    articles.value = data
    total.value = totalCount
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章列表失败')
  } finally {
    loading.value = false
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
  loadLabelOptions()
  loadArticles()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 60px; /* 为固定的 header 留出空间 */
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

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-select) {
  width: 100%;
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