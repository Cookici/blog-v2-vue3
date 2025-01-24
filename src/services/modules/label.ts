import { http } from '../http'
import type { LabelDTO } from '@/types/article'

export const useLabelApi = {
  // 获取标签列表
  getKinds() {
    return http.get<LabelDTO[]>('/label/kinds')
  }
} 