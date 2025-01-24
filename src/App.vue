<script setup lang="ts">
import BackToTop from '@/components/BackToTop.vue'
</script>

<template>
  <router-view></router-view>
  <BackToTop />
</template>

<style>
/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background: #f5f7fa;
}

/* 返回顶部按钮样式 */
.back-to-top {
  height: 100%;
  width: 100%;
  background-color: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-lighter);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #409EFF;
  transition: all 0.3s;
}

.back-to-top:hover {
  background-color: #ecf5ff;
  color: var(--el-color-primary);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .back-to-top {
    font-size: 16px;
  }
}
</style>

