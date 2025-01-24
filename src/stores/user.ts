import { defineStore } from 'pinia'
import type { UserInfo } from '@/types/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    // 存储完整的用户信息，包含所有 UserInfo 接口定义的字段
    userInfo: null as UserInfo | null,
  }),
  
  getters: {

  },

  actions: {
    // 设置用户信息
    setUser(userInfo: UserInfo) {
      this.userInfo = userInfo
    },

    // 清除用户信息
    clearUser() {
      this.userInfo = null
    },

  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'user',
        storage: localStorage,
        paths: ['userInfo']
      }
    ]
  }
})