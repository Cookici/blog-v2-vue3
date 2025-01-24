<script setup lang="ts">
import { CaretTop } from '@element-plus/icons-vue'
</script>

<template>
  <el-backtop 
    :right="40" 
    :bottom="40"
    :visibility-height="300"
  >
    <div class="back-to-top">
      <el-icon><CaretTop /></el-icon>
    </div>
  </el-backtop>
</template>

<style scoped>
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

@media (max-width: 768px) {
  .back-to-top {
    font-size: 16px;
  }
}
</style> 