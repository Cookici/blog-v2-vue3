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

        <div class="articles-container">
          <div class="articles-grid" v-loading="loading">
            <el-card v-for="article in articles" :key="article.articleId" class="article-card">
              <div class="article-content" @click="viewArticle(article)">
                <h3 class="article-title">{{ article.articleTitle }}</h3>
                <p class="article-preview" v-html="getPreviewContent(article.articleContent)"></p>
              </div>
              <div class="article-footer">
                <div class="article-labels">
                  <el-tag 
                    v-for="label in article.labels" 
                    :key="label.labelId" 
                    size="small" 
                    class="label-tag"
                  >
                    {{ label.labelName }}
                  </el-tag>
                </div>
                <div class="article-meta">
                  <span class="meta-item">
                    <el-icon><View /></el-icon>
                    {{ article.viewCount || 0 }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Star /></el-icon>
                    {{ article.likeCount || 0 }}
                  </span>
                  <span class="create-time">{{ formatDate(article.createTime) }}</span>
                </div>
              </div>
              <div class="article-actions">
                <el-button link type="primary" @click="editArticle(article)">编辑</el-button>
                <el-popconfirm
                  title="确定删除这篇文章吗？"
                  @confirm="deleteArticle(article)"
                  confirm-button-text="确定"
                  cancel-button-text="取消"
                >
                  <template #reference>
                    <el-button link type="danger">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </el-card>
          </div>

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
import type { ArticleDTO, ArticleUserPageQuery } from '@/types/article'
import { ElMessage } from 'element-plus'
import { View, Star, Search, Document, Collection } from '@element-plus/icons-vue'
import { useLabelApi } from '@/services/modules/label'
import type { LabelDTO } from '@/types/article'

const router = useRouter()
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

// 加载标签选项
const loadLabelOptions = async () => {
  try {
    const labels = await useLabelApi.getKinds()
    labelOptions.value = labels
  } catch (error: any) {
    ElMessage.error(error.message || '获取标签失败')
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadArticles()
}

// 加载文章列表
const loadArticles = async () => {
  try {
    loading.value = true
    const params = {
      userId: localStorage.getItem('userId'),
      page: currentPage.value,
      pageSize: pageSize.value,
      articleTitle: searchForm.value.articleTitle,
      articleContent: searchForm.value.articleContent,
      labelNameList: searchForm.value.labelNameList.length > 0 ? searchForm.value.labelNameList : undefined
    } as ArticleUserPageQuery

    const { data, total: totalCount } = await useArticleApi.getUserArticles(params)
    articles.value = data
    total.value = totalCount
  } catch (error: any) {
    ElMessage.error(error.message || '获取文章列表失败')
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadArticles()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadArticles()
}

// 文章操作
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
    await loadArticles()
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

// 工具函数
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.articles-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.articles-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.article-card {
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.article-content {
  cursor: pointer;
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
  align-items: center;
  margin-bottom: 12px;
}

.article-labels {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.article-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

/* 搜索区域样式 */
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 响应式布局 */
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