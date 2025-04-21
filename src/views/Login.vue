<template>
  <div class="login-container">
    <el-card class="login-box">
      <template #header>
        <h2 class="login-title">欢迎登录</h2>
      </template>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="手机号" prop="userPhone">
          <el-input
            v-model="loginForm.userPhone"
            placeholder="请输入手机号"
            :prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="userPassword">
          <el-input
            v-model="loginForm.userPassword"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <div class="btn-group">
          <el-button type="primary" :loading="loading" @click="handleLogin">
            登录
          </el-button>
          <el-button type="success" @click="handleRegister">
            注册
          </el-button>
          <el-button type="info" @click="handleSkip">
            跳过登录
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref , onMounted} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserApi } from '@/services';
import type { LoginParams } from '@/types/user';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useUserStore } from '@/stores/user'

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const loginFormRef = ref<FormInstance>();
const userStore = useUserStore();

const loginForm = ref<LoginParams>({
  userPhone: '',
  userPassword: ''
});

const rules = ref<FormRules>({
  userPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  userPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
});

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true;
        const loginResponse = await useUserApi.login(loginForm.value);
        const { userInfo, token } = loginResponse;
        localStorage.setItem('token', token);
        const nowIp = await useUserApi.updateIp({userId: userInfo.userId});
        userInfo.userIp = nowIp;
        userStore.$patch({ userInfo });
        ElMessage.success('登录成功'); 
        router.push('/dashboard');
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 在组件挂载时检查是否有用户名参数
onMounted(() => {
  const userPhone = route.query.userPhone as string;
  if (userPhone) {
    loginForm.value.userPhone = userPhone;
  }
});

const handleRegister = () => {
  router.push('/register');
};

const handleSkip = () => {
  router.push('/dashboard');
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-box {
  width: 100%;
  max-width: 400px;
}

.login-title {
  text-align: center;
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-group .el-button {
  flex: 1;
}

:deep(.el-card__header) {
  padding: 16px 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>