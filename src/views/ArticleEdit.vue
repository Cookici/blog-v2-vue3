<template>
  <div class="app-container">
    <AppHeader />
    <el-container class="main-container">
      <el-main>
        <div class="article-edit-content">
          <div class="page-header">
            <h2>{{ isEdit ? '编辑文章' : '创建文章' }}</h2>
            <div class="header-actions">
              <el-button @click="handleCancel">取消</el-button>
              <el-button type="primary" :loading="publishing" @click="handlePublish">
                <el-icon><DocumentAdd /></el-icon>{{ isEdit ? '保存' : '发布' }}文章
              </el-button>
            </div>
          </div>

          <el-form
            ref="articleFormRef"
            :model="articleForm"
            :rules="rules"
            label-position="top"
            class="article-form"
          >
            <el-form-item label="文章标题" prop="title">
              <el-input 
                v-model="articleForm.title" 
                placeholder="请输入文章标题" 
                class="title-input"
                :maxlength="100"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="文章标签" prop="tags">
              <el-select
                v-model="articleForm.tags"
                multiple
                filterable
                placeholder="请选择标签"
                class="tag-select"
              >
                <el-option
                  v-for="tag in labelOptions"
                  :key="tag.labelId"
                  :label="tag.labelName"
                  :value="tag.labelId"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="文章内容" prop="content">
              <div class="editor-container">
                <Toolbar
                  :editor="editorRef"
                  :defaultConfig="toolbarConfig"
                  mode="default"
                  style="border-bottom: 1px solid #ccc"
                />
                <Editor
                  :defaultConfig="editorConfig"
                  v-model="articleForm.content"
                  mode="default"
                  style="height: 500px"
                  @onCreated="handleCreated"
                  @onChange="handleChange"
                />
              </div>
            </el-form-item>
          </el-form>

          <div class="floating-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" :loading="publishing" @click="handlePublish">
              <el-icon><DocumentAdd /></el-icon>{{ isEdit ? '保存' : '发布' }}文章
            </el-button>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { DocumentAdd } from '@element-plus/icons-vue'
import { useArticleApi } from '@/services/modules/article'
import { useLabelApi } from '@/services/modules/label'
import type { LabelDTO } from '@/types/article'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { useUploadApi } from '@/services/modules/upload'

const router = useRouter()
const route = useRoute()
const publishing = ref(false)
const articleFormRef = ref<FormInstance>()
const editorRef = shallowRef()

// Move handleEditorUpload function here, before editorConfig
const handleEditorUpload = async (file: File, callback: (url: string) => void) => {
  try {
    const formData = new FormData()
    formData.append('imageFile', file)
    const data = await useUploadApi.uploadImage(formData)
    callback(data.fileUrl)
  } catch (error: any) {
    ElMessage.error(error.message || '图片上传失败')
  }
}

// Then the editor configs
const toolbarConfig = {
  excludeKeys: [
    'uploadVideo',
    'insertTable',
    'group-video',
    'emotion', // 移除默认表情
  ]
}

const editorConfig = {
  placeholder: '请输入文章内容...',
  MENU_CONF: {
    uploadImage: {
      server: '/api/oss/file/upload',  // 这个路径不会实际使用，因为我们用自定义上传
      fieldName: 'imageFile',
      maxFileSize: 2 * 1024 * 1024,    // 2MB
      maxNumberOfFiles: 10,
      allowedFileTypes: ['image/*'],
      customUpload: handleEditorUpload,
      onError: (err: any) => {
        ElMessage.error(err.message || '图片上传失败')
      }
    }
  }
}

const labelOptions = ref<LabelDTO[]>([])

const articleForm = ref({
  title: '',
  content: '',
  tags: [] as string[] // 存储 labelId
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' },
    { 
      validator: (_, value, callback) => {
        if (!value || value.length < 20) {
          callback(new Error('内容不能少于20个字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  tags: [
    { required: true, message: '请至少选择一个标签', trigger: 'change' },
    { type: 'array', max: 5, message: '最多选择5个标签', trigger: 'change' }
  ]
}

const isEdit = computed(() => Boolean(route.query.articleId))

// 编辑器创建完成时的回调
const handleCreated = (editor: any) => {
  editorRef.value = editor;
  // 如果是编辑模式，设置编辑器内容
  if (isEdit.value && route.query.content) {
    editor.setHtml(route.query.content as string);
  }
};

// 编辑器内容变化时的回调
const handleChange = (editor: any) => {
  articleForm.value.content = editor.getHtml();
};

// 加载标签选项
const loadLabelOptions = async () => {
  try {
    const data = await useLabelApi.getKinds()
    labelOptions.value = data
  } catch (error: any) {
    ElMessage.error('获取标签列表失败')
  }
}

// 初始化表单数据
const initFormData = () => {
  if (isEdit.value) {
    articleForm.value.title = route.query.title as string;
    // 不在这里设置 content，而是在编辑器创建完成后设置
    const labelIds = (route.query.labels as string)?.split(',') || [];
    articleForm.value.tags = labelIds;
  }
};

const handlePublish = async () => {
  if (!articleFormRef.value) return
  
  await articleFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        publishing.value = true
        const params = {
          articleTitle: articleForm.value.title,
          articleContent: articleForm.value.content,
          labelIdList: articleForm.value.tags
        }

        if (isEdit.value) {
          await useArticleApi.updateArticle({
            ...params,
            articleId: route.query.articleId as string
          })
          ElMessage.success('文章更新成功')
        } else {
          await useArticleApi.create(params)
          ElMessage.success('文章发布成功')
        }
        router.push('/dashboard')
      } catch (error: any) {
        ElMessage.error(error.message || (isEdit.value ? '更新失败' : '发布失败'))
      } finally {
        publishing.value = false
      }
    }
  })
}

const handleCancel = () => {
  router.back()
}

onMounted(() => {
  loadLabelOptions()
  initFormData()
})

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-top: 60px; /* 为固定的 header 留出空间 */
}

.main-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.article-edit-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: relative;
}

.page-header {
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.article-form {
  padding: 30px;
}

.title-input :deep(.el-input__wrapper) {
  padding: 8px 15px;
  font-size: 18px;
}

.title-input input {
  font-size: 18px;
  font-weight: 500;
}

.tag-select {
  width: 100%;
}

.editor-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  z-index: 100;
}

/* 确保编辑器工具栏在固定操作栏之下 */
:deep(.w-e-toolbar) {
  z-index: 2 !important;
}

:deep(.w-e-text-container) {
  z-index: 1 !important;
}

.floating-actions {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  gap: 12px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  padding-bottom: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .main-container {
    padding: 10px;
  }

  .article-form {
    padding: 20px;
  }

  .floating-actions {
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
  }
}
</style> 