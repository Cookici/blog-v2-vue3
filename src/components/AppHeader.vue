<template>
  <el-header class="app-header">
    <div class="header-left">
      <h2 class="logo">Suzi-Blog</h2>
    </div>
    <el-menu mode="horizontal" :router="true" class="header-menu">
      <el-menu-item index="/dashboard">首页</el-menu-item>
      <el-menu-item index="/articles">文章列表</el-menu-item>
      <el-menu-item index="/messages">
        私信

      </el-menu-item>
    </el-menu>
    <div class="header-right">
      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar :size="32" :src="userInfo?.userPhoto || ''">
            {{ userInfo?.userName?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <div class="user-details">
            <span class="username">{{ userInfo?.userName }}</span>
            <div class="user-meta">
              <el-tag size="small" type="success">Lv.{{ userInfo?.userLevel || 1 }}</el-tag>
              <el-tag size="small" type="info">{{ ipLocation || '定位中...' }}</el-tag>
            </div>
          </div>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
            <el-dropdown-item @click="router.push('/my-articles')">我的文章</el-dropdown-item>
            <el-dropdown-item @click="router.push('/my-comments')">我的评论</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-button 
                link 
                type="danger" 
                :loading="isLoggingOut"
              >
                {{ isLoggingOut ? '退出中...' : '退出登录' }}
              </el-button>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';
import { useUserApi } from '@/services/modules/user'
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const router = useRouter();
const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);
const ipLocation = ref<string>('')
const isLoggingOut = ref(false)

// 解析 IP 地址
const parseIpLocation = async () => {
  if (!userInfo.value?.userIp) return
  
  // 先从 localStorage 中获取缓存的结果
  const cachedLocation = localStorage.getItem(`ip_location_${userInfo.value.userIp}`)
  if (cachedLocation) {
    ipLocation.value = cachedLocation
    return
  }
  
  try {
    const location = await useUserApi.getIpLocation(userInfo.value.userIp)
    ipLocation.value = location
    // 将结果存入 localStorage
    localStorage.setItem(`ip_location_${userInfo.value.userIp}`, location)
  } catch (error) {
    console.error('IP解析失败:', error)
    ipLocation.value = '未知地区'
    // 缓存错误结果，避免重复请求
    localStorage.setItem(`ip_location_${userInfo.value.userIp}`, '未知地区')
  }
}

// 清除 IP 缓存（在登出时调用）
const clearIpCache = () => {
  if (userInfo.value?.userIp) {
    localStorage.removeItem(`ip_location_${userInfo.value.userIp}`)
  }
}

const handleLogout = async () => {
  if (isLoggingOut.value) return
  
  try {
    isLoggingOut.value = true
    // 只有在用户已登录的情况下才发送登出请求
    if (userInfo.value) {
      await useUserApi.logout()
    }
    clearIpCache()
    localStorage.removeItem('userId')
    userStore.$reset()
    router.push('/login')
    ElMessage.success('退出成功')
  } catch (error: any) {
    ElMessage.error(error.message || '登出失败')
  } finally {
    isLoggingOut.value = false
  }
}

// 在用户登录后建立WebSocket连接
onMounted(() => {
  parseIpLocation()
})

</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  margin: 0;
  font-size: 20px;
  color: #409EFF;
}

.header-menu {
  flex: 1;
  justify-content: center;
  border-bottom: none;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-details {
  margin-left: 8px;
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.user-meta {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

:deep(.el-tag--small) {
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
}

.message-badge :deep(.el-badge__content) {
  background-color: #f56c6c;
}
</style>