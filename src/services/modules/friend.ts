import { http } from '../http'
import type { PageDTO } from '../types'
import type {
  FriendResp,
  FriendUpdateNameReq,
   FriendDeleteReq,
  FriendPageReq, 
  FriendApplyPageReq,
  FriendApplyAddReq, 
  FriendApplyUpdateReq,
  FriendApplyResp
} from '@/types/friend'


export const useFriendApi = {

  // 更新好友备注名
  updateName(params: FriendUpdateNameReq) {
    return http.post('/friend/update/name', params)
  },

  // 获取好友列表
  page(params: FriendPageReq) {
    return http.get<PageDTO<FriendResp>>('/friend/page', { params })
  },

  // 删除好友
  delete(params: FriendDeleteReq) {
    return http.post('/friend/delete', params)
  },

  // 获取好友申请列表
  getFriendApplyPage(params: FriendApplyPageReq) {
    return http.get<PageDTO<FriendApplyResp>>('/friend-apply/page', { params });
  },

  // 添加好友申请
  addFriendApply(data: FriendApplyAddReq) {
    return http.post('/friend-apply/add', data);
  },

  // 更新好友申请
  updateFriendApply(data: FriendApplyUpdateReq) {
    return http.post('/friend-apply/update', data);
  }

}

