<template>
  <div class="register-container">
    <el-card class="register-box">
      <template #header>
        <h2 class="register-title">用户注册</h2>
      </template>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input
            v-model="registerForm.userName"
            placeholder="请输入用户名"
          />
        </el-form-item>

        <el-form-item label="手机号" prop="userPhone">
          <el-input
            v-model="registerForm.userPhone"
            placeholder="请输入手机号"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="userPassword">
          <el-input
            v-model="registerForm.userPassword"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="userPasswordAgain">
          <el-input
            v-model="registerForm.userPasswordAgain"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="userEmail">
          <el-input
            v-model="registerForm.userEmail"
            placeholder="请输入邮箱"
          />
        </el-form-item>

        <el-form-item label="性别" prop="userSex">
          <el-select v-model="registerForm.userSex" placeholder="请选择性别" style="width: 100%">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
            <el-option label="保密" value="保密" />
          </el-select>
        </el-form-item>

        <el-form-item label="生日" prop="userBirthday">
          <el-date-picker
            v-model="registerForm.userBirthday"
            type="datetime"
            placeholder="请选择生日"
            style="width: 100%"
          />
        </el-form-item>

        <div class="btn-group">
          <el-button type="primary" :loading="loading" @click="handleRegister">
            注册
          </el-button>
          <el-button @click="handleBack">
            返回登录
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserApi } from '@/services';
import type { RegisterParams } from '@/types/user';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import dayjs from 'dayjs';

const router = useRouter();
const loading = ref(false);
const registerFormRef = ref<FormInstance>();

const registerForm = ref<RegisterParams>({
  userName: '',
  userPassword: '',
  userPasswordAgain: '',
  userPhone: '',
  userEmail: '',
  userSex: '',
  userBirthday: '',
  userLevel: 0
});

const validatePass2 = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== registerForm.value.userPassword) {
    callback(new Error('两次输入密码不一致!'));
  } else {
    callback();
  }
};

const rules = ref<FormRules>({
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  userPhone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  userPassword: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  userPasswordAgain: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ],
  userEmail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  userSex: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
});

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true;
        const formData = { ...registerForm.value };
        if (formData.userBirthday) {
          formData.userBirthday = dayjs(formData.userBirthday).format('YYYY-MM-DD HH:mm:ss');
        }
        const data = await useUserApi.register(formData);
        ElMessage.success('注册成功');
        router.push({
          path: '/login',
          query: { userPhone: data.userPhone.toString() }
        });
      } catch (error: any) {
        ElMessage.error(error.message || '注册失败');
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleBack = () => {
  router.push('/login');
};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.register-box {
  width: 100%;
  max-width: 500px;
}

.register-title {
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
</style> 