<template>
  <div class="app-container">
    <AppHeader />
    <el-container class="main-container">
      <el-main>
        <div class="profile-content">
          <el-card class="profile-card">
            <template #header>
              <div class="card-header">
                <h2>个人资料</h2>
              </div>
            </template>

            <el-form
              ref="profileFormRef"
              :model="profileForm"
              :rules="rules"
              label-width="100px"
              class="profile-form"
            >
              <!-- 头像上传 -->
              <div class="avatar-upload">
                <el-avatar 
                  :size="100" 
                  :src="profileForm.userPhoto || (userInfo && userInfo.userPhoto)" 
                  class="avatar-preview"
                >
                  {{ userInfo && userInfo.userName ? userInfo.userName.charAt(0).toUpperCase() : '' }}
                </el-avatar>
                
                <!-- 添加上传按钮和裁剪对话框 -->
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  :on-change="handleAvatarChange"
                >
                  <el-button type="primary" class="upload-btn">更换头像</el-button>
                </el-upload>

                <!-- 裁剪对话框 -->
                <el-dialog v-model="cropperVisible" title="裁剪头像" width="600px" destroy-on-close>
                  <div class="cropper-container">
                    <VueCropper
                      ref="cropperRef"
                      :img="cropperImage"
                      :outputSize="1"
                      :outputType="'png'"
                      :info="true"
                      :full="true"
                      :canMove="true"
                      :canMoveBox="true"
                      :original="false"
                      :autoCrop="true"
                      :autoCropWidth="200"
                      :autoCropHeight="200"
                      :fixedBox="true"
                      :fixed="true"
                      :fixedNumber="[1, 1]"
                    />
                  </div>
                  <template #footer>
                    <span class="dialog-footer">
                      <el-button @click="cropperVisible = false">取消</el-button>
                      <el-button 
                        type="primary" 
                        :loading="uploading" 
                        :disabled="uploading"
                        @click="handleCropUpload"
                      >
                        {{ uploading ? '上传中...' : '确认' }}
                      </el-button>
                    </span>
                  </template>
                </el-dialog>
              </div>

              <el-form-item label="用户名" prop="userName">
                <el-input v-model="profileForm.userName" />
              </el-form-item>

              <!-- 邮箱和手机号只读字段 -->
              <el-form-item label="邮箱">
                <el-input v-model="userEmail" disabled />
              </el-form-item>

              <el-form-item label="手机号">
                <el-input v-model="userPhone" disabled />
              </el-form-item>

              <el-form-item label="性别" prop="userSex">
                <el-select v-model="profileForm.userSex" style="width: 100%">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                  <el-option label="保密" value="保密" />
                </el-select>
              </el-form-item>

              <el-form-item label="生日" prop="userBirthday">
                <el-date-picker
                  v-model="profileForm.userBirthday"
                  type="date"
                  style="width: 100%"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  format="YYYY-MM-DD"
                  :default-time="new Date(2000, 0, 1, 0, 0, 0)"
                  placeholder="请选择生日"
                />
              </el-form-item>

              <el-form-item>
                <el-button 
                  type="primary" 
                  :loading="loading"
                  :disabled="loading"
                  @click="handleUpdateProfile"
                >
                  {{ loading ? '保存中...' : '保存修改' }}
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/AppHeader.vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useUserApi } from '@/services/modules/user'
import dayjs from 'dayjs';
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'

const router = useRouter();
const userStore = useUserStore()
const { userInfo } = storeToRefs(userStore)
const loading = ref(false)
const profileFormRef = ref<FormInstance>()

const profileForm = ref({
  userId: '',
  userName: '',
  userSex: '',
  userBirthday: '',
  userPhoto: ''
})

// 表单验证规则
const rules: FormRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  userSex: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
}

// 添加计算属性
const userEmail = computed(() => userInfo.value?.userEmail || '')
const userPhone = computed(() => userInfo.value?.userPhone || '')

// 初始化表单数据
onMounted(() => {
  if (userInfo.value) {
    const { userId, userName, userSex, userBirthday } = userInfo.value
    profileForm.value = {
      userId,
      userName,
      userSex,
      userBirthday: dayjs(userBirthday).format('YYYY-MM-DD HH:mm:ss'),
      userPhoto: ''
    }
  }
})

const cropperVisible = ref(false)
const cropperImage = ref('')
const cropperRef = ref()
const uploading = ref(false)

// 处理头像选择
const handleAvatarChange = (file: any) => {
  if (!file) return
  
  const isImage = file.raw.type.startsWith('image/')
  const isLt2M = file.raw.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('头像必须是图片格式!')
    return
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return
  }

  // 读取文件并显示裁剪对话框
  const reader = new FileReader()
  reader.onload = (e) => {
    cropperImage.value = e.target?.result as string
    cropperVisible.value = true
  }
  reader.readAsDataURL(file.raw)
}

// 处理裁剪和上传
const handleCropUpload = async () => {
  if (!cropperRef.value) return
  
  try {
    uploading.value = true
    await new Promise((resolve, reject) => {
      cropperRef.value.getCropBlob(async (blob: Blob) => {
        try {
          if (!blob) {
            reject(new Error('裁剪失败'))
            return
          }

          const formData = new FormData()
          formData.append('imageFile', blob, 'avatar.png')

          const data = await useUserApi.uploadAvatar(formData)

          profileForm.value.userPhoto = data.fileUrl
          if (userInfo.value) {
            userStore.$patch({
              userInfo: {
                ...userInfo.value,
                userPhoto: data.fileUrl
              }
            })
          }
          
          ElMessage.success('头像上传成功')
          cropperVisible.value = false
          resolve(true)
        } catch (error) {
          reject(error)
        }
      })
    })
  } catch (error: any) {
    ElMessage.error(error.message || '头像上传失败')
  } finally {
    uploading.value = false
  }
}

// 更新个人信息
const handleUpdateProfile = async () => {
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        
        const updateData: any = { userId: profileForm.value.userId }
        const isUserNameChanged = userInfo.value && 
          profileForm.value.userName !== userInfo.value.userName
        
        if (isUserNameChanged) {
          updateData.userName = profileForm.value.userName
        }
        
        if (userInfo.value && profileForm.value.userSex !== userInfo.value.userSex) {
          updateData.userSex = profileForm.value.userSex
        }
        
        if (userInfo.value && 
            dayjs(profileForm.value.userBirthday).format('YYYY-MM-DD HH:mm:ss') !== 
            dayjs(userInfo.value.userBirthday).format('YYYY-MM-DD HH:mm:ss')) {
          updateData.userBirthday = profileForm.value.userBirthday
        }
        
        if (Object.keys(updateData).length <= 1) {
          ElMessage.info('没有信息需要更新')
          loading.value = false
          return
        }
        await useUserApi.updateProfile(updateData)
        if (isUserNameChanged) {
          ElMessage.success('用户名已更新，需要重新登录')
          setTimeout(async () => {
            try {
              if (userInfo.value?.userIp) {
                localStorage.removeItem(`ip_location_${userInfo.value.userIp}`)
              }
              await useUserApi.logout()
              localStorage.removeItem('userId')
              userStore.$reset()
              router.push('/login')
            } catch (error: any) {
              console.error('登出失败:', error)
            }
          }, 1500)
        } else {
          if (userInfo.value) {
            userStore.$patch({
              userInfo: {
                ...userInfo.value,
                userName: profileForm.value.userName,
                userSex: profileForm.value.userSex,
                userBirthday: profileForm.value.userBirthday
              }
            })
          }
          ElMessage.success('个人信息更新成功')
        }
      } catch (error: any) {
        ElMessage.error(error.message || '更新失败')
      } finally {
        loading.value = false
      }
    }
  })
}
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

.profile-content {
  margin-top: 20px;
}

.profile-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.profile-form {
  margin-top: 20px;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  gap: 16px;
}

.avatar-preview {
  border: 2px solid #eee;
  background-color: #f5f7fa;
}

.upload-btn {
  margin-top: 10px;
}

.cropper-container {
  height: 400px;
  width: 100%;
  background: #f8f8f8;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .main-container {
    padding: 10px;
  }

  .el-form-item {
    margin-bottom: 18px;
  }
}
</style>